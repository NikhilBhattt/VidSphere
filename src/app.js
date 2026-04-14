import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router as userRouter } from "../routes/user.routes.js";

const app = express();

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
