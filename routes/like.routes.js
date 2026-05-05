import { Router } from "express";

import {
  toggleVideoLike,
  getLikedVideos,
} from "../controllers/like.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/video/:videoId", verifyJWT, toggleVideoLike);
router.get("/video", verifyJWT, getLikedVideos);

export default router;
