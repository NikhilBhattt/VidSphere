import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import config from "../config/config.js";

const uploadOnCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
  
  if (!localFilePath) {
    return null;
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath);
    console.log("File is uploaded to Cloudinary!");
    fs.unlinkSync(localFilePath);
    return response;
  } catch (err) {
    console.error("Error while uploading to Cloudinary:", err);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Temporary file deleted:", localFilePath);
    }
    return null;
  }
};

export default uploadOnCloudinary;
