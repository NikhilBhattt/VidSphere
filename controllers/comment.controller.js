import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(404).json(new ApiResponse(404, null, "Video not found!"));
  }

  const commentsResult = await Promise.all([
    Comment.find({ videoId })
      .populate("commentBy", "username avatar")
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Comment.countDocuments({ videoId }),
  ]);

  if (commentsResult.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No comments found!"));
  }
  const [comments, totalComments] = commentsResult;

  const paginate = {
    page: parseInt(page),
    skip,
    limit: parseInt(limit),
    totalPage: Math.ceil(totalComments / parseInt(limit)),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { comments, totalComments, paginate },
        "Comments fetched!",
      ),
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(404).json(new ApiResponse(404, null, "Video not found!"));
  }

  const createdComment = await Comment.create({
    videoId,
    content,
    commentBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdComment, "Comment added!"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid comment ID!"));
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Comment not found!"));
  }

  if (comment.commentBy.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(
        new ApiResponse(
          403,
          null,
          "You are not authorized to update this comment!",
        ),
      );
  }

  const { content } = req.body;
  comment.content = content || comment.content;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated!"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid comment ID!"));
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Comment not found!"));
  }

  if (comment.commentBy.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(
        new ApiResponse(
          403,
          null,
          "You are not authorized to delete this comment!",
        ),
      );
  }

  await Comment.findByIdAndDelete(commentId);

  return res.status(200).json(new ApiResponse(200, null, "Comment deleted!"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
