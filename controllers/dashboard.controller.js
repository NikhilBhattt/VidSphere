import mongoose, { mongo } from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const result = await Promise.all([
    Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: "$owner",
          totalVideoViews: {
            $sum: "$views",
          },
          totalVideos: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          owner: 1,
          totalVideoViews: 1,
        },
      },
    ]),
    Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: "$channel",
          totalSubscribers: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          totalSubscribers: 1,
        },
      },
    ]),
    Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "videoId",
          pipeline: [
            {
              $group: {
                _id: "$videoId",
                videoLikes: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$owner",
          totalLikes: {
            $sum: "$videoLikes",
          },
        },
      },
      {
        $project: {
          totalLikes: 1,
        },
      },
    ]),
  ]);

  if (result.length === 0) {
    return res.status(500).json(new ApiError(404, "Internal Server Error"));
  }

  const [totalVideosAndView, totalSubscribers, totalLikes] = result;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideosAndView,
        totalSubscribers,
        totalLikes,
      },
      "Data fetched!",
    ),
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const channelVideos = await Video.find({
    owner: new mongoose.Types.ObjectId(req.user._id),
  })
    .skip(skip)
    .limit(limit);

  if (!channelVideos) {
    return res
      .status(204)
      .json(new ApiResponse(204, {}, "No videos Available!"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channelVideos, "Videos fetched!"));
});

export { getChannelStats, getChannelVideos };
