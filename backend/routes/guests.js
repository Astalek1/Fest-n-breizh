import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as guestsCtrl from "../controllers/guests.js";

const router = express.Router();

router.get("/", guestsCtrl.getAllGuests);
router.get("/:id", guestsCtrl.getOneGuest);

console.log("Route guests POST appelée");

router.post("/", auth, multer.single("file"), resizeImage, guestsCtrl.createGuest);

router.put("/:id", auth, multer.single("file"), resizeImage, guestsCtrl.updateGuest);

router.delete("/:id", auth, guestsCtrl.deleteGuest);

export default router;
