import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { WatchHistory } from "../models/watchHistory.model.js";

const watchVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(404).json(new ApiError(404, "Invalid Video Id"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res.status(204).json(new ApiResponse(204, "Video not available"));
  }

  video.view += 1;
  await video.save();

  await WatchHistory.findOneAndUpdate(req.user._id, {
    videos: {
      $push: videoId,
    },
  });
  return res.status(200).json(new ApiResponse(200, {}, "User started watching"));
});

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

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
