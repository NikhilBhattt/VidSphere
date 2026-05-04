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
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/videos", verifyJWT, getAllVideos);

router.post("/video", verifyJWT, upload.single("video"), publishAVideo);

router.get("/:videoId", verifyJWT, getVideoById);

router.put("/:videoId", verifyJWT, updateVideo);

router.delete("/:videoId", verifyJWT, deleteVideo);

router.patch("/toggle/:videoId", verifyJWT, togglePublishStatus);

export { router };
