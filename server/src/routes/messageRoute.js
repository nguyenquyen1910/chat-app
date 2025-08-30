import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  markMessageAsRead,
  markThreadAsRead,
  getConversations,
} from "../controllers/messageController.js";
import { sendMessageLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/conversations", protectRoute, getConversations);

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessageLimiter, sendMessage);
router.patch("/:messageId/read", protectRoute, markMessageAsRead);
router.patch("/read-all/:userId", protectRoute, markThreadAsRead);

export default router;
