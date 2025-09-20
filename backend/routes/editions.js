import express from "express";
import auth from "../middleware/auth";
import multer from "../middleware/multer";
import resizeImage from "../middleware/resizeImage";
import * as userCtrl from "../controllers/editions.js";

const router = express.Router();

router.get("/");
router.get("/:id");

router.post("/", auth, multer, resizeImage);

router.put("/:id", auth, multer, resizeImage);

router.delete("/:id", auth);
