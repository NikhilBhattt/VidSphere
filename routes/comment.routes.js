import { Router } from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:videoId", getVideoComments);

router.post("/:videoId", verifyJWT, addComment);

router.patch("/:commentId", verifyJWT, updateComment);

router.delete("/:commentId", verifyJWT, deleteComment);

export default router;