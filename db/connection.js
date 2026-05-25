import mongoose from "mongoose";
import { DB_NAME } from "../src/constants.js";

import config from "../config/config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(`${config.MONGODB_URI}/${DB_NAME}`);
    console.log("MongoDb connected!");
  } catch (error) {
    console.log("MongoDb connection failed!!!", error);
    process.exit(1);
  }
};

export default connectDB;
