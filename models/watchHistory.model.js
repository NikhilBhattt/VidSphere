import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  videos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
});

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
