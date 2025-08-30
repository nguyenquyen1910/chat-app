import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      validate: (v) => v.length === 2,
      index: true,
    },
    lastMessage: {
      text: { type: String, default: "" },
      image: { type: String, default: null },
      createdAt: { type: Date, default: Date.now, index: true },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index(
  { "participants.0": 1, "participants.1": 1 },
  { unique: true }
);

export default mongoose.model("Conversation", conversationSchema);
