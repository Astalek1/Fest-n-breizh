import express from "express";
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
import multer from "../middleware/multer.js";

const router = express.Router();

// ========================================================
// ===============        AFFICHES        =================
// ========================================================

// Créer une nouvelle affiche
router.post("/posters", multer.single("media"), newPoster);

// Récupérer toutes les affiches
router.get("/posters", getAllPosters);

// Récupérer une affiche spécifique
router.get("/posters/:id", getOnePoster);

// Modifier une affiche
router.put("/posters/:id", multer.single("media"), updatePoster);

// Supprimer une affiche
router.delete("/posters/:id", deletePoster);

// ========================================================
// ===============         PHOTOS         =================
// ========================================================

// Créer une nouvelle photo
router.post("/photos", multer.single("media"), newPhoto);

// Récupérer toutes les photos
router.get("/photos", getAllPhotos);

// Récupérer une photo spécifique
router.get("/photos/:id", getOnePhoto);

// Modifier une photo
router.put("/photos/:id", multer.single("media"), updatePhoto);

// Supprimer une photo
router.delete("/photos/:id", deletePhoto);

export default router;
