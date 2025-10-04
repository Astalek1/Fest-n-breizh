import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as artistsCtrl from "../controllers/artists.js";

const router = express.Router();

router.get("/", artistsCtrl.getAllArtists);
router.get("/:id", artistsCtrl.getOneArtist);

router.post(
  "/",
  auth,
  multer.single("media"),
  resizeImage,
  artistsCtrl.newArtist
);

router.put(
  "/:id",
  auth,
  multer.single("media"),
  resizeImage,
  artistsCtrl.updateArtist
);

router.delete("/:id", auth, artistsCtrl.deleteArtist);

export default router;
