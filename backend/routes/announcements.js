import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as announcementsCtrl from "../controllers/announcements.js";

const router = express.Router();

router.get("/", announcementsCtrl.getAllAnnouncements);
router.get("/:id", announcementsCtrl.getOneAnnouncement);

router.post("/", auth, multer, resizeImage, announcementsCtrl.newAnnouncement);

router.put(
  "/:id",
  auth,
  multer,
  resizeImage,
  announcementsCtrl.updateAnnouncement
);

router.delete("/:id", auth, announcementsCtrl.deleteAnnouncement);

export default router;
