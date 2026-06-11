import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js"; // Bug fix: same issue
import { asyncHandler } from "../utils/asyncHandler.js";
import { client } from "../services/redis.service.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const cacheKey = `channelStats:${req.user._id}`;

  const cachedData = await client.get(cacheKey);

  if (cachedData) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(cachedData),
          "Data fetched from cache!",
        ),
      );
  }

  const [totalVideosAndView, totalSubscribers, totalLikes] = await Promise.all([
    Video.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $group: {
          _id: "$owner",
          totalVideoViews: { $sum: "$views" },
          totalVideos: { $sum: 1 },
        },
      },
      {
        $project: {
          totalVideoViews: 1,
          totalVideos: 1,
        },
      },
    ]),
    Subscription.aggregate([
      {
        $match: { channel: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $group: {
          _id: "$channel",
          totalSubscribers: { $sum: 1 },
        },
      },
      {
        $project: { totalSubscribers: 1 },
      },
    ]),
    Video.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "videoId",
          as: "likes",
        },
      },
      {
        $group: {
          _id: "$owner",
          totalLikes: { $sum: { $size: "$likes" } },
        },
      },
      {
        $project: { totalLikes: 1 },
      },
    ]),
  ]);

  const data = {
    totalVideosAndView: totalVideosAndView[0] || {
      totalVideoViews: 0,
      totalVideos: 0,
    },
    totalSubscribers: totalSubscribers[0] || { totalSubscribers: 0 },
    totalLikes: totalLikes[0] || { totalLikes: 0 },
  };

  await client.set(cacheKey, JSON.stringify(data), { EX: 1800 });

  return res.status(200).json(new ApiResponse(200, data, "Data fetched!"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const channelVideos = await Video.find({
    owner: new mongoose.Types.ObjectId(req.user._id),
  })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  if (!channelVideos || channelVideos.length === 0) {
    return res
      .status(204)
      .json(new ApiResponse(204, [], "No videos Available!"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channelVideos, "Videos fetched!"));
});

export { getChannelStats, getChannelVideos };
