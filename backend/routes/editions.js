import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as editionsCtrl from "../controllers/editions.js";

const router = express.Router();

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

router.delete("/:editionId/guests/:guestId", auth, editionsCtrl.deleteGuestFromEdition);

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

router.delete("/:editionId/artists/:artistId", auth, editionsCtrl.deleteArtistFromEdition);

// === Routes générales ===
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

export default router;
