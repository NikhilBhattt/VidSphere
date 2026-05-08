import app from "./app.js";
import connectDB from "../db/connection.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { connectRedis } from "../services/redis.service.js";

const port = process.env.PORT || 3000;

(async () => {
  try {
    // Connect to database and Redis
    await Promise.all([connectDB(), connectRedis()]);

    // Start the server
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
})();
