import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
  videoFile: {
    type: String,
    required: [true, "Video File is required"],
  },
  thumbnail: {
    type: String,
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
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

videoSchema.plugin(mongooseAggregatePaginate)

export default Video = mongoose.model("Video", videoSchema);
