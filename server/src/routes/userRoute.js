import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  updateProfile,
  updateFullName,
} from "../controllers/userController.js";

const router = express.Router();

router.put("/update-profile", protectRoute, updateProfile);
router.put("/update-info", protectRoute, updateFullName);

export default router;
