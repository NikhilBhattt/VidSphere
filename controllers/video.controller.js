import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { WatchHistory } from "../models/watchHistory.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { client } from "../services/redis.service.js";

const watchVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid Video Id"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res.status(404).json(new ApiError(404, "Video not found!"));
  }

  // Bug fix: field was "view" but schema defines "views"
  await Video.updateOne({ _id: videoId }, { $inc: { views: 1 } });

  await WatchHistory.findOneAndUpdate(
    { userId: req.user._id },
    { $addToSet: { videos: videoId } },
    { upsert: true, new: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User started watching"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(channelId)) {
    return res.status(400).json(new ApiError(400, "Invalid Channel Id"));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const cacheKey = `channelVideos:${channelId}:page:${page}:limit:${limit}`;

  const cachedData = await client.get(cacheKey);

  if (cachedData) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(cachedData),
          "Channel's Videos Fetched!",
        ),
      );
  }

  const [allVideos, totalVideos] = await Promise.all([
    Video.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(channelId) },
      },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]),
    Video.countDocuments({ owner: new mongoose.Types.ObjectId(channelId) }),
  ]);

  const data = {
    allVideos,
    totalVideos,
    paginate: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalVideos / parseInt(limit)),
    },
  };

  await client.set(cacheKey, JSON.stringify(data), { EX: 120 });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Channel's Videos Fetched!"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.file;

  if (!title || !description) {
    return res
      .status(422)
      .json(new ApiError(422, "Title and description are required"));
  }
  if (!videoFile) {
    return res.status(400).json(new ApiError(400, "No video file provided"));
  }

  try {
    const uploadResponse = await uploadOnCloudinary(videoFile.path);

    if (!uploadResponse) {
      return res
        .status(500)
        .json(new ApiError(500, "Failed to upload video to Cloudinary"));
    }

    const newVideo = await Video.create({
      title,
      description,
      videoFile: uploadResponse.secure_url,
      duration: uploadResponse.duration,
      owner: req.user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newVideo, "Video published successfully"));
  } catch (error) {
    console.error("Error publishing video:", error);
    return res
      .status(500)
      .json(new ApiError(500, "An error occurred while publishing the video"));
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Bug fix: condition was inverted (was returning error when ID IS valid)
  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid Video Id!"));
  }

  const video = await Video.findById(videoId).lean();

  if (!video) {
    // Bug fix: was returning ApiError/ApiResponse without res.status().json()
    return res.status(404).json(new ApiError(404, "Video Not Found!"));
  }

  return res.status(200).json(new ApiResponse(200, video, "Video found!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid Video Id"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res.status(404).json(new ApiError(404, "Video not found!"));
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(new ApiError(403, "You are not authorized to update this video!"));
  }

  const { title, description } = req.body;
  const thumbnailFile = req.file;

  if (title) video.title = title;
  if (description) video.description = description;

  if (thumbnailFile) {
    const uploadResponse = await uploadOnCloudinary(thumbnailFile.path);
    if (!uploadResponse) {
      return res
        .status(500)
        .json(new ApiError(500, "Failed to upload thumbnail"));
    }
    video.thumbnail = uploadResponse.secure_url;
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Bug fix: condition was inverted
  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid Video Id"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res.status(404).json(new ApiError(404, "Video not found!"));
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(new ApiError(403, "You are not authorized to delete this video!"));
  }

  // Bug fix: mongoose.Types.ObjectId() → new mongoose.Types.ObjectId()
  await Promise.all([
    Video.deleteOne({ _id: new mongoose.Types.ObjectId(videoId) }),
    Like.deleteMany({ videoId: new mongoose.Types.ObjectId(videoId) }),
    Comment.deleteMany({ videoId: new mongoose.Types.ObjectId(videoId) }),
  ]);

  return res.status(200).json(new ApiResponse(200, {}, "Video deleted!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid Video Id"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res.status(404).json(new ApiError(404, "Video not found!"));
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(new ApiError(403, "Not authorized to update this video!"));
  }

  // Bug fix: $set with aggregation expression doesn't work in findByIdAndUpdate this way
  // Use actual boolean negation instead
  video.isPublished = !video.isPublished;
  await video.save();

  // Bug fix: was returning ApiResponse without res.status().json()
  return res
    .status(200)
    .json(new ApiResponse(200, { isPublished: video.isPublished }, "Successfully Updated!"));
});

export {
  watchVideo,
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
