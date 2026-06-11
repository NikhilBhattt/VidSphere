import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/stats", verifyJWT, getChannelStats);
router.get("/videos", verifyJWT, getChannelVideos);

export default router;
