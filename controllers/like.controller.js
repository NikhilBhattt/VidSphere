import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { client } from "../services/redis.service.js"; // Bug fix: was missing

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid Video Id"));
  }

  const isVideoLiked = await Like.findOne({ videoId, likedBy: req.user._id });

  if (isVideoLiked) {
    await Like.deleteOne({ _id: isVideoLiked._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  await Like.create({ videoId, likedBy: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const cacheKey = `likedVideos:${req.user._id}:page:${page}:limit:${limit}`;

  const cachedData = await client.get(cacheKey);

  if (cachedData) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(cachedData),
          "Liked Videos fetched Successfully!",
        ),
      );
  }

  const [likedVideos, totalLikedVideos] = await Promise.all([
    Like.find({ likedBy: req.user._id })
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        "videoId",
        "videoFile thumbnail owner title description views duration",
      )
      .lean(),
    Like.countDocuments({ likedBy: req.user._id }),
  ]);

  const data = {
    likedVideos,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalLikedVideos,
      totalPages: Math.ceil(totalLikedVideos / parseInt(limit)),
    },
  };

  await client.set(cacheKey, JSON.stringify(data), { EX: 120 });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Liked Videos fetched Successfully!"));
});

export { toggleVideoLike, getLikedVideos };
