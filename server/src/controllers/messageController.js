import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
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

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
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

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_read", {
        messageId: message._id,
        readBy: userId,
        readAt: new Date(),
      });
    }

    res.status(200).json(message);
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
