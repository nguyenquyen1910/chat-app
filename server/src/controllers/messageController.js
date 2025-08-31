import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Conversation from "../models/conversationModel.js";
import { normalizeParticipants } from "../lib/conversation.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const me = String(req.user._id);

    const [users, conversations] = await Promise.all([
      User.find({ _id: { $ne: me } }).select("-password"),
      Conversation.find({ participants: me }).lean(),
    ]);

    const convByOther = new Map();
    for (const c of conversations) {
      const [u1, u2] = c.participants.map(String);
      const other = u1 === me ? u2 : u1;

      const unreadCount =
        c.unreadCount && c.unreadCount.get
          ? c.unreadCount.get(me) || 0
          : (c.unreadCount && c.unreadCount[me]) || 0;

      convByOther.set(other, {
        lastMessage: c.lastMessage || null,
        unreadCount: unreadCount,
      });
    }

    const payload = users.map((u) => {
      const meta = convByOther.get(String(u._id)) || null;
      return {
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        profilePic: u.profilePic,
        createdAt: u.createdAt,
        isOnline: u.isOnline,
        lastSeen: u.lastSeen,
        lastMessage: meta?.lastMessage || null,
        unreadCount: meta?.unreadCount || 0,
      };
    });

    payload.sort((a, b) => {
      const at = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const bt = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return bt - at || a.fullName.localeCompare(b.fullName);
    });

    res.status(200).json(payload);
  } catch (error) {
    console.log("Error in getUsersForSidebar controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const me = String(req.user._id);
    const cons = await Conversation.find({ participants: me })
      .sort({ "lastMessage.createdAt": -1 })
      .lean();
    res.status(200).json(cons);
  } catch (error) {
    console.log("Error in getConversations controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    const { limit, sort } = req.query;

    let query = Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    if (sort) {
      query = query.sort(sort);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const messages = await query;

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { message, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
      image: imageUrl,
      isRead: false,
      isDelivered: false,
    });

    await newMessage.save();

    try {
      const participants = normalizeParticipants(senderId, receiverId);

      let conversation = await Conversation.findOne({ participants });

      if (!conversation) {
        conversation = await Conversation.create({
          participants,
          lastMessage: {
            text: message || (imageUrl ? "Sent an image" : ""),
            image: imageUrl || null,
            createdAt: new Date(),
            senderId: senderId,
          },
          unreadCount: new Map([
            [senderId.toString(), 0],
            [receiverId.toString(), 1],
          ]),
        });
      } else {
        conversation.lastMessage = {
          text: message || (imageUrl ? "Sent an image" : ""),
          image: imageUrl || null,
          createdAt: new Date(),
          senderId: senderId,
        };

        const currentUnread =
          conversation.unreadCount.get(receiverId.toString()) || 0;
        conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);

        await conversation.save();
      }
    } catch (convError) {
      console.log("Error message:", convError.message);
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(receiverSocketId).emit("conversation_updated", {
        with: senderId,
        lastMessage: {
          text: newMessage.message || (newMessage.image ? "Sent an image" : ""),
          image: newMessage.image || null,
          createdAt: newMessage.createdAt,
          senderId: senderId,
        },
        incUnreadFor: receiverId,
      });
    }

    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("conversation_updated", {
        with: receiverId,
        lastMessage: {
          text: newMessage.message || (newMessage.image ? "Sent an image" : ""),
          image: newMessage.image || null,
          createdAt: newMessage.createdAt,
          senderId: senderId,
        },
        incUnreadFor: receiverId,
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const updated = await Message.findOneAndUpdate(
      { senderId: messageId, receiverId: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Message not found" });
    }

    const senderSocketId = getReceiverSocketId(updated.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_read", {
        messageId: updated._id,
        readBy: userId,
        readAt: updated.readAt,
      });
    }
    res.status(200).json(updated);
  } catch (error) {
    console.log("Error in markMessageAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markThreadAsRead = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    const result = await Message.updateMany(
      { senderId: userId, receiverId: myId, isRead: { $ne: true } },
      { $set: { isRead: true, readAt: new Date() } }
    );

    await Conversation.updateOne(
      { participants: normalizeParticipants(req.user._id, userId) },
      { $set: { [`unreadCount.${req.user._id.toString()}`]: 0 } }
    );

    const senderSocketId = getReceiverSocketId(userId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("thread_read", {
        by: myId,
        with: userId,
        at: new Date(),
      });
    }

    res.status(200).json({ update: result.modifiedCount });
  } catch (error) {
    console.log("Error in markThreadAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
