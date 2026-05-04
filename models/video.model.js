import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
  videoFile: {
    type: String,
    required: [true, "Video File is required"],
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  duration: {
    type: String,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
});

videoSchema.index({ owner: 1 });

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
