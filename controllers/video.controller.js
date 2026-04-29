import mongoose from "mongoose";
import Video from "../models/video.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Like } from "../models/like.model";
import { Comment } from "../models/comment.model";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;

  const skip = (page - 1) * limit;

  const [allVideos, totalVideos] = await Promise.all([
    Video.aggregate([
      {
        $match: { owner: mongoose.Types.ObjectId(userId) },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]),
    Video.countDocuments({ owner: mongoose.Types.ObjectId(userId) }),
  ]);

  if (!allVideos || !totalVideos) {
    return new ApiError(404, "No Videos found");
  }

  return new ApiResponse(
    200,
    { allVideos, totalVideos },
    "User's Videos Fetched!",
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) {
    return new ApiError(404, "Video Not Found!");
  }
  return new ApiResponse(200, video);
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  await Promise.all([
    Video.deleteOne({ _id: mongoose.Types.ObjectId(videoId) }),
    Like.deleteMany({ videoId: mongoose.Types.ObjectId(videoId) }),
    Comment.deleteMany({ videoId: mongoose.Types.ObjectId(videoId) }),
  ]);
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  await Video.findByIdAndUpdate(videoId, {
    $set: { isPublished: { $eq: ["$isPublished", false] } },
  });
  return new ApiResponse(200, {}, "Successfully Updated!");
});
