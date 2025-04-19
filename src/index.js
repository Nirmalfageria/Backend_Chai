import mongoose from "mongoose";
import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

// Configure proper path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from correct path
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

// just for checking
console.log('Cloudinary Config Loaded:', {
  cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
  api_key: !!process.env.CLOUDINARY_API_KEY,
  api_secret: !!process.env.CLOUDINARY_API_SECRET
});
// console.log('Environment Variables:', {
//   PORT: process.env.PORT,
//   MONGODB_URI: process.env.MONGODB_URI ? '***' : 'MISSING',
//   CLOUDINARY_NAME: process.env.CLOUDINARY_NAME ? '***' : 'MISSING',
//   CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '***' : 'MISSING',
//   CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '***' : 'MISSING'
// });

import DbConnect from "./db/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

DbConnect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });