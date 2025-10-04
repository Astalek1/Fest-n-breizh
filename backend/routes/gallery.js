import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import {
  newPoster,
  getAllPosters,
  getOnePoster,
  updatePoster,
  deletePoster,
  newPhoto,
  getAllPhotos,
  getOnePhoto,
  updatePhoto,
  deletePhoto,
} from "../controllers/gallery.js";

const router = express.Router();

// ========================================================
// ===============        AFFICHES        =================
// ========================================================
router.get("/posters", getAllPosters);
router.get("/posters/:id", getOnePoster);

// upload d’un seul fichier nommé “media”
router.post("/posters", auth, multer.single("media"), resizeImage, newPoster);
router.put(
  "/posters/:id",
  auth,
  multer.single("media"),
  resizeImage,
  updatePoster
);
router.delete("/posters/:id", auth, deletePoster);

// ========================================================
// ===============         PHOTOS         =================
// ========================================================
router.get("/photos", getAllPhotos);
router.get("/photos/:id", getOnePhoto);

router.post("/photos", auth, multer.single("media"), resizeImage, newPhoto);
router.put(
  "/photos/:id",
  auth,
  multer.single("media"),
  resizeImage,
  updatePhoto
);
router.delete("/photos/:id", auth, deletePhoto);

export default router;
