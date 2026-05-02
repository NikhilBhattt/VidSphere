import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/all-videos", verifyJWT, getAllVideos);

router.post("/video", verifyJWT, publishAVideo); // cloudinary & multer

router.get("/video/:videoId", verifyJWT, getVideoById);

router.put("/video/:videoId", verifyJWT, updateVideo);

router.delete("/video/:videoId", verifyJWT, deleteVideo);

router.get("video/toggle/:videoId", verifyJWT, togglePublishStatus);

export default router;
