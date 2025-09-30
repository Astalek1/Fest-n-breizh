import express from "express";
import auth from "../middleware/auth";
import multer from "../middleware/multer";
import resizeImage from "../middleware/resizeImage";
import * as guestsCtrl from "../controllers/guests.js";

const router = express.Router();

router.get("/", guestsCtrl.getAllGuests);
router.get("/:id", guestsCtrl.getOneGuest);

router.post("/", auth, multer, resizeImage, guestsCtrl.newGuest);

router.put("/:id", auth, multer, resizeImage, guestsCtrl.updateGuest);

router.delete("/:id", auth, guestsCtrl.deleteGuest);

export default router;
