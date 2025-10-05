import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as editionsCtrl from "../controllers/editions.js";

const router = express.Router();

// Récupérer toutes les éditions
router.get("/", editionsCtrl.getAllEditions);

// Récupérer une édition spécifique
router.get("/:id", editionsCtrl.getOneEdition);

// Créer une édition (avec affiche, artistes, invités)
router.post(
  "/",
  auth,
  upload.fields([
    { name: "media", maxCount: 1 }, // affiche
    { name: "artistFiles", maxCount: 10 }, // images artistes
    { name: "guestFiles", maxCount: 10 }, // logos invités
  ]),
  resizeImage,
  editionsCtrl.createEdition
);

// Modifier une édition
router.put(
  "/:id",
  auth,
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "artistFiles", maxCount: 10 },
    { name: "guestFiles", maxCount: 10 },
  ]),
  resizeImage,
  editionsCtrl.updateEdition
);

// Supprimer une édition
router.delete("/:id", auth, editionsCtrl.deleteEdition);

export default router;
