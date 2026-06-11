import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  watchVideo,
} from "../controllers/video.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/:channelId/videos", verifyJWT, getAllVideos);

router.post("/video", verifyJWT, upload.single("video"), publishAVideo);

router.post("/:videoId/watch", verifyJWT, watchVideo);

router.get("/:videoId", verifyJWT, getVideoById);

router.put("/:videoId", verifyJWT, upload.single("thumbnail"), updateVideo);

router.delete("/:videoId", verifyJWT, deleteVideo);

router.patch("/toggle/:videoId", verifyJWT, togglePublishStatus);

export default router;
