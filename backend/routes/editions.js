import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as editionsCtrl from "../controllers/editions.js";
import * as artistsCtrl from "../controllers/artists.js";
import * as guestsCtrl from "../controllers/guests.js";

const router = express.Router();

// === GESTION DES ÉDITIONS ===
router.get("/", editionsCtrl.getAllEditions);
router.get("/:id", editionsCtrl.getOneEdition);

router.post(
  "/",
  auth,
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "artistFiles", maxCount: 10 },
    { name: "guestFiles", maxCount: 10 },
  ]),
  resizeImage,
  editionsCtrl.createEdition
);

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

router.delete("/:id", auth, editionsCtrl.deleteEdition);

// === GESTION DES INVITÉS D'UNE ÉDITION ===
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
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "artistFiles", maxCount: 10 },
    { name: "guestFiles", maxCount: 10 },
  ]),
  resizeImage,
  editionsCtrl.updateEdition
);

router.delete("/:editionId/guests/:guestId", auth, guestsCtrl.deleteGuest);

// === GESTION DES ARTISTES D'UNE ÉDITION ===
router.post(
  "/:editionId/artists",
  auth,
  upload.single("media"),
  resizeImage,
  artistsCtrl.createArtist
);

router.put(
  "/:editionId/artists/:artistId",
  auth,
  upload.single("media"),
  resizeImage,
  artistsCtrl.updateArtist
);

router.delete("/:editionId/artists/:artistId", auth, artistsCtrl.deleteArtist);

export default router;
