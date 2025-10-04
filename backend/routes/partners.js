import express from "express";
import auth from "../middleware/auth.js";
import multer from "../middleware/multer.js";
import resizeImage from "../middleware/resizeImage.js";
import * as partnersCtrl from "../controllers/partners.js";

const router = express.Router();

router.get("/", partnersCtrl.getAllPartners);
router.get("/:id", partnersCtrl.getOnePartner);

router.post(
  "/",
  auth,
  multer.single("media"),
  resizeImage,
  partnersCtrl.newPartner
);

router.put(
  "/:id",
  auth,
  multer.single("media"),
  resizeImage,
  partnersCtrl.updatePartner
);

router.delete("/:id", auth, partnersCtrl.deletePartner);

export default router;
