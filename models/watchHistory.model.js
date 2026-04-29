import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema(
  {
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
  },
  {
    timestamps: true,
  },
);

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
