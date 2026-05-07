import app from "./app.js";
import connectDB from "../db/connection.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { connectRedis } from "../services/redis.service.js";

const port = process.env.PORT || 3000;

// databae connect
connectDB();

// redis connect
connectRedis();

// server start
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
