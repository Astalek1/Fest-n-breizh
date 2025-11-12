import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as guestsCtrl from "../controllers/guests.js";

const router = express.Router();

router.get("/", guestsCtrl.getAllGuests);
router.get("/:id", guestsCtrl.getOneGuest);

router.post("/", auth, multer.single("media"), resizeImage, guestsCtrl.createGuest);

router.put("/:id", auth, multer.single("media"), guestsCtrl.updateGuest);

router.delete("/:id", auth, guestsCtrl.deleteGuest);

export default router;
