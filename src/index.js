import mongoose from "mongoose";
import express from "express";

import DbConnect from "./db/index";

const app = express();
const PORT = process.env.PORT || 5000;

