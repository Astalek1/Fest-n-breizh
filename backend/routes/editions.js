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

// === Gestion des invités d'une édition ===
router.post(
  "/:editionId/guests",
  auth,
  upload.single("media"),
  resizeImage,
  editionsCtrl.addGuestToEdition
);

router.put(
  "/:editionId/guests/:guestId",
  auth,
  upload.single("media"),
  resizeImage,
  editionsCtrl.updateGuestInEdition
);

router.delete(
  "/:editionId/guests/:guestId",
  auth,
  editionsCtrl.deleteGuestFromEdition
);

// === Gestion des artistes d'une édition ===
router.post(
  "/:editionId/artists",
  auth,
  upload.single("media"),
  resizeImage,
  editionsCtrl.addArtistToEdition
);

router.put(
  "/:editionId/artists/:artistId",
  auth,
  upload.single("media"),
  resizeImage,
  editionsCtrl.updateArtistInEdition
);

router.delete(
  "/:editionId/artists/:artistId",
  auth,
  editionsCtrl.deleteArtistFromEdition
);

export default router;
