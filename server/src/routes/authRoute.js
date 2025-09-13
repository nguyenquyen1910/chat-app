import express from "express";
import {
  signup,
  login,
  logout,
  checkAuth,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
} from "../controllers/authController.js";
import { protectRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.get("/check", protectRoute, checkAuth);

// OAuth2 routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookCallback);

export default router;
