import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
dotenv.config(); // No need to specify path

import DbConnect from "./db/index.js";


const app = express();
const PORT = process.env.PORT || 5000;

DbConnect();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
