import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as guestsCtrl from "../controllers/guests.js";

const router = express.Router();

router.get("/", guestsCtrl.getAllGuests);
router.get("/:id", guestsCtrl.getOneGuest);

router.post("/", auth, multer.single("media"), resizeImage, guestsCtrl.createGuest);

//router.put("/:id", auth, multer.single("media"), resizeImage, guestsCtrl.updateGuest);

router.delete("/:id", auth, guestsCtrl.deleteGuest);

router.put(
  "/:id",
  auth,
  (req, res, next) => {
    console.log("🧭 [TRACE] Passage dans multer.single avant resizeImage");
    next();
  },
  multer.single("media"),
  (req, res, next) => {
    console.log("🧭 [TRACE] Passage dans resizeImage");
    next();
  },
  resizeImage,
  (req, res, next) => {
    console.log("🧭 [TRACE] Passage avant updateGuest");
    console.log("headersSent avant updateGuest:", res.headersSent);
    next();
  },
  guestsCtrl.updateGuest
);

export default router;
