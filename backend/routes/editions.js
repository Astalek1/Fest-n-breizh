import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as editionsCtrl from "../controllers/editions.js";

const router = express.Router();

router.get("/", editionsCtrl.getAllEditions);
router.get("/:id", editionsCtrl.getOneEdition);

router.post(
  "/",
  auth,
  multer.single("media"),
  resizeImage,
  editionsCtrl.createEdition
);

router.put(
  "/:id",
  auth,
  multer.single("media"),
  resizeImage,
  editionsCtrl.updateEdition
);

router.delete("/:id", auth, editionsCtrl.deleteEdition);

export default router;
