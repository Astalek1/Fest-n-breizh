import express from "express";
import auth from "../middleware/auth";
import * as videosCtrl from "../controllers/videos.js";

const router = express.Router();

router.get("/", videosCtrl.getAllVideos);
router.get("/:id", videosCtrl.getOneVideo);

router.post("/", auth, videosCtrl.newVideo);

router.put("/:id", auth, videosCtrl.updateVideo);

router.delete("/:id", auth, videosCtrl.deleteVideo);

export default router;
