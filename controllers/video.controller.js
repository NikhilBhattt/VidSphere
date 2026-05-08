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

// where i should use Redis?

// 1. profile fetch
// 2. channel stats - Done
// 4. channels subscribed - Done
// 5. watchHistory - Done
// 6. getAllVideos - Done

const watchVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(404).json(new ApiError(404, "Invalid Video Id"));
  }

  const video = await Video.findById(videoId);

  if (!video) {
    return res.status(404).json(new ApiError(404, "Video not found!"));
  }

  await Video.updateOne({ _id: videoId }, { $inc: { view: 1 } });

  await WatchHistory.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { videos: videoId } },
    { upsert: true, new: true },
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User started watching"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  // get videos of a channel with pagination

  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

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

  const result = await Promise.all([
    Video.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(channelId) },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]),
    Video.countDocuments({ owner: new mongoose.Types.ObjectId(channelId) }),
  ]);

  if (result.length === 0) {
    return res.status(404).json(new ApiError(404, "No Videos found"));
  }

  const [allVideos, totalVideos] = result;

  const data = {
    allVideos,
    totalVideos,
    paginate: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalVideos / limit),
    },
  };

  await client.set(cacheKey, JSON.stringify(data), { EX: 120 }); // Cache for 2 minutes

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Channel's Videos Fetched!"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.file; // Assuming multer middleware is used for file upload

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

  if (mongoose.isValidObjectId(videoId)) {
    return res.status(404).json(new ApiError(404, "Video not found!"));
  }

  const video = await Video.findById(videoId).lean();
  if (!video) {
    return new ApiError(404, "Video Not Found!");
  }
  return new ApiResponse(200, video, "Video found!");
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (mongoose.isValidObjectId(videoId)) {
    return res.status(404).json(new ApiError(404, "Video not found!"));
  }

  await Promise.all([
    Video.deleteOne({ _id: mongoose.Types.ObjectId(videoId) }),
    Like.deleteMany({ videoId: mongoose.Types.ObjectId(videoId) }),
    Comment.deleteMany({ videoId: mongoose.Types.ObjectId(videoId) }),
  ]);

  return res.status(200).json(new ApiResponse(200, {}, "Video deleted!"));
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
