import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";

const app = express();

const limiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use(limiter);

app.use(
  cors({
    origin: process.env.CORS_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRouter from "../routes/user.routes.js";
import videoRouter from "../routes/video.routes.js";
import subscriptionRouter from "../routes/subscription.routes.js";
import commentRouter from "../routes/comment.routes.js";
import LikeRouter from "../routes/like.routes.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/like", LikeRouter);

export default app;
