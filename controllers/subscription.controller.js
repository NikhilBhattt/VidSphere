import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    return res.status(400).json(new ApiError(400, "Invalid Channel ID"));
  }

  client.del(`subscribedChannels:${req.user._id}`); // Invalidate cache

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findOneAndDelete({
      subscriber: req.user._id,
      channel: channelId,
    });
    return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed!"));
  } else {
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    return res.status(201).json(new ApiResponse(201, {}, "Subscribed!"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(channelId)) {
    return res.status(400).json(new ApiError(400, "Invalid Channel ID"));
  }

  const subscribersData = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $facet: {
        // pipeline 1 -> fetch paginate subscriber
        list: [
          {
            $lookup: {
              from: "users",
              localField: "subscriber",
              foreignField: "_id",
              as: "subscriber",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          { $unwind: "$subscriber" },
          { $replaceRoot: { newRoot: "$subscriber" } },
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
        ],
        // pipeline 2 -> get total count for frontend UI
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  if (subscriberData.length === 0) {
    return res.status(204).json(new ApiError(204, "No Subscribers found!"));
  }

  const result = {
    subscribers: subscribersData[0].list,
    total: subscribersData[0].totalCount[0]?.count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Subscribers Fetched!"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const cacheKey = `subscribedChannels:${req.user._id}`;

  const cachedData = await client.get(cacheKey);

  if (cachedData) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(cachedData),
          "Subscribed Channels Fetched!",
        ),
      );
  }

  const subscribedToChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelInfo",
      },
    },
    {
      $group: {
        _id: "$subscriber",
        subscribedToChannelsList: {
          $push: "$channelInfo",
        },
      },
    },
  ]);

  if (subscribedToChannels.length === 0) {
    return res.status(204).json(new ApiError(204, "Data not found!"));
  }

  const data = subscribedToChannels[0].subscribedToChannelsList.flat();

  await client.set(cacheKey, JSON.stringify(data), { EX: 300 }); // Cache for 5 minutes

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Subscribed Channels Fetched!"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
