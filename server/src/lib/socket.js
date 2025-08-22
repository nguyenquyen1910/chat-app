import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}
const typingUsers = {}; // {roomId: Set of userIds}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Leave room
  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  // Typing
  socket.on("typing_start", (data) => {
    const { roomId, userId } = data;
    if (!typingUsers[roomId]) {
      typingUsers[roomId] = new Set();
    }
    typingUsers[roomId].add(userId);
    socket.to(roomId).emit("user_typing", {
      roomId,
      userId,
      isTyping: true,
    });
  });

  socket.on("typing_stop", (data) => {
    const { roomId, userId } = data;
    if (typingUsers[roomId]) {
      typingUsers[roomId].delete(userId);
      if (typingUsers[roomId].size === 0) {
        delete typingUsers[roomId];
      }
    }

    socket.to(roomId).emit("user_typing", {
      roomId,
      userId,
      isTyping: false,
    });
  });

  // Message read status
  socket.on("mark_as_read", (data) => {
    const { messageId, roomId } = data;
    socket.to(roomId).emit("message_read", {
      messageId,
      readBy: userId,
      readAt: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
