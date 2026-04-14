import mongoose from "mongoose";
import { DB_NAME } from "../src/constants.js";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("MongoDb connected!");
  } catch (error) {
    console.log("MongoDb connection failed!!!", error);
    process.exit(1);
  }
};

export default connectDB