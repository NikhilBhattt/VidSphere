import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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
