import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
dotenv.config(); // No need to specify path

import DbConnect from "./db/index.js";
import app from "./app.js"

const PORT = process.env.PORT || 5000;

DbConnect().then(()=>{
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} 
)
.catch((err)=>{
  console.log("MongoDB connection failed",err);
})

