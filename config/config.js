import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/myapp",
  
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
};

export default config;
