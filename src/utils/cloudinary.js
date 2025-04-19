import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secert: process.env.CLOUDINARY_API_SECERT,
});

const cloudinaryUploader = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file is uploaded to the cloudinary", response);
    return response;
  } catch {
    fs.unlinkSync(localFilePath)
    // remove the file from the local cloud
  }
};

export default cloudinaryUploader