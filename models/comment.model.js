import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
  content: {
    type: String,
    required: [true, "Content required!"],
  },
  videoId: {
    type: Schema.Types.ObjectId,
    ref: "Video",
  },
  commentBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = mongoose.model("Comment", commentSchema); 