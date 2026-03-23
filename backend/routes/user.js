import express from "express";
import * as userCtrl from "../controllers/user.js";

const router = express.Router();

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);
router.post("/logout", userCtrl.logout);

export default router;
