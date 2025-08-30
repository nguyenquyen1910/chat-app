import rateLimit from "express-rate-limit";

export const sendMessageLimiter = rateLimit({
  windowMs: 2 * 1000, // 2s
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
});
