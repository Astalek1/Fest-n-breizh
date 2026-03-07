import express from "express";
import { sendContact } from "../controllers/contact.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 2,
  keyGenerator: (req) => req.body.email || "unknown",
  message: {
    error: "Trop de messages envoyés. Réessayez plus tard."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/",contactLimiter ,sendContact);

export default router;