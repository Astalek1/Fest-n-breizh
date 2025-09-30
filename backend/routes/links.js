import express from "express";
import auth from "../middleware/auth";
import multer from "../middleware/multer";
import resizeImage from "../middleware/resizeImage";
import * as linksCtrl from "../controllers/links.js";

const router = express.Router();

router.get("/", linksCtrl.getAllLinks);
router.get("/:id", linksCtrl.getOneLink);

router.post("/", auth, multer, resizeImage, linksCtrl.newLink);

router.put("/:id", auth, multer, resizeImage, linksCtrl.updateLink);

router.delete("/:id", auth, linksCtrl.deleteLink);

export default router;
