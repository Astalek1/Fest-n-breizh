import express from "express";
import auth from "../middleware/auth";
import multer from "../middleware/multer";
import resizeImage from "../middleware/resizeImage";
import * as editionsCtrl from "../controllers/editions.js";

const router = express.Router();

router.get("/", editionsCtrl.getAllEditions);
router.get("/:id", editionsCtrl.getOneEdition);

router.post("/", auth, multer, resizeImage, editionsCtrl.createEdition);

router.put("/:id", auth, multer, resizeImage, editionsCtrl.updateEdition);

router.delete("/:id", auth, editionsCtrl.deleteEdition);

export default router;
