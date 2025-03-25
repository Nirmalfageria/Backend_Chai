import mongoose from "mongoose";

import { DB_NAME } from "../contants";

const DbConnect = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`\n Database connected successfully ${connectionInstance}`);
  } catch (error) {
    console.log("Error connecting to database");
    console.log(error);
    process.exit(1);
  }
};

export default DbConnect;