import express from "express";
import * as userCtrl from "../controllers/user.js";
import auth from "../middleware/auth.js";
import * as userController from '../controllers/user.js'

const router = express.Router();

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);
router.post("/logout", userCtrl.logout);
router.post('/ping', auth, userController.ping)

export default router;
