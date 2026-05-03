import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(404).json(new ApiError(404, "Invalid Video Id"));
  }

  // if Liked already -> delete like document

  const isVideoLiked = await Like.findOne({ videoId, likedBy: req.user._id });

  if (isVideoLiked) {
    // Video liked!
    await Like.deleteOne({ _id: isVideoLiked._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  // if not Liked -> create like document
  await Like.create({ videoId, likedBy: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [likedVideos, totalLikedVideos] = await Promise.all([
    Like.find({ likedBy: req.user._id })
      .skip(skip)
      .limit(limit)
      .populate(
        "videoId",
        "videoFile thumbnail owner title description views duration",
      )
      .lean(),
    Like.countDocuments({ likedBy: req.user._id }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likedVideos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalLikedVideos,
          totalPages: Math.ceil(totalLikedVideos / limit),
        },
      },
      "Liked Videos fetched Successfully!",
    ),
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
