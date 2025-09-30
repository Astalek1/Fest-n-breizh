import express from "express";
import auth from "../middleware/auth";
import multer from "../middleware/multer";
import resizeImage from "../middleware/resizeImage";
import * as partnersCtrl from "../controllers/partners.js";

const router = express.Router();

router.get("/", partnersCtrl.getAllPartners);
router.get("/:id", partnersCtrl.getOnePartner);

router.post("/", auth, multer, resizeImage, partnersCtrl.newPartner);

router.put("/:id", auth, multer, resizeImage, partnersCtrl.updatePartner);

router.delete("/:id", auth, partnersCtrl.deletePartner);

export default router;
