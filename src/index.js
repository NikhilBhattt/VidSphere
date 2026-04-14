import app from "./app.js";
import connectDB from "../db/connection.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const port = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(port, async () => {
      await uploadOnCloudinary("");
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDb connection failed!!!", err);
  });
