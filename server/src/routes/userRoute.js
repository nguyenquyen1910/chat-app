import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  updateProfile,
  updateFullName,
  updateLastSeen,
  getProfile,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/:userId", protectRoute, getProfile);
router.put("/update-profile", protectRoute, updateProfile);
router.put("/update-info", protectRoute, updateFullName);
router.patch("/last-seen", protectRoute, updateLastSeen);

export default router;
