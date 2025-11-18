import express from "express";
import * as userCtrl from "../controllers/user.js";

const router = express.Router();

router.post("/debug", (req, res) => {
  console.log("DEBUG BODY :", req.body);
  res.json(req.body);
});

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);

export default router;
