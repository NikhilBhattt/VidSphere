import mongoose, { Schema } from "mongoose";

const LikeSchema = new Schema({
  description: { type: String },
  videoId: {
    type: Schema.Types.ObjectId,
    ref: "Video",
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Like = mongoose.model("Like", LikeSchema);
