import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as galleryCtrl from "../controllers/gallery.js";

const router = express.Router();

// *********** ROUTES PHOTOS *********** //
router.get("/photos", galleryCtrl.getAllPhotos);
router.get("/photos/:id", galleryCtrl.getOnePhoto);

router.post("/photos", auth, multer, resizeImage, galleryCtrl.newPhoto);

router.put("/photos/:id", auth, multer, resizeImage, galleryCtrl.updatePhoto);

router.delete("/photos/:id", auth, galleryCtrl.deletePhoto);

// *********** ROUTES POSTERS *********** //
router.get("/posters", galleryCtrl.getAllPosters);
router.get("/posters/:id", galleryCtrl.getOnePoster);

router.post("/posters", auth, multer, resizeImage, galleryCtrl.newPoster);

router.put("/posters/:id", auth, multer, resizeImage, galleryCtrl.updatePoster);

router.delete("/posters/:id", auth, galleryCtrl.deletePoster);

export default router;
