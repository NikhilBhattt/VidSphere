import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import { router as userRouter } from "../routes/user.routes.js";

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
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
app.use("/api/v1/user", userRouter);

export default app;
