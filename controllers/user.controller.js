import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { WatchHistory } from "../models/watchHistory.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { cookiesOption } from "../src/constants.js";
import mongoose, { Schema } from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  // get user details
  const { username, fullName, email, password } = req.body;

  // validations
  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(422, "All fields are required!!!");
  }

  // check if already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists!");
  }

  // check for images, avatars
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(422, "Avatar is required!");
  }

  // upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required!");
  }

  // create user object
  const user = await User.create({
    username,
    fullName,
    email,
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
  });

  // remove password & refreshToken field from response
  const createdUser = await User.findOne({ _id: user._id }).select(
    "-password -refreshToken",
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(400, "Somethin went wrong while registering the user");
  }

  // return response
  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { field, password } = req.body;

  if ([field, password].some((f) => f?.trim() === "")) {
    throw new ApiError(400, "Both fields are required!!!");
  }

  const user = await User.findOne({
    $or: [{ username: field }, { email: field }],
  });

  if (!user) {
    throw new ApiError(400, "Invalid Credentials!");
  }

  const isPasswordValid = await user.isPasswordValid(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect Password!");
  }

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  const loggedInUser = await User.findOne({ _id: user._id }).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookiesOption)
    .cookie("refreshToken", refreshToken, cookiesOption)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  res
    .status(200)
    .clearCookie("accessToken", cookiesOption)
    .clearCookie("refreshToken", cookiesOption)
    .json(new ApiResponse(200, {}, "User logged out successfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request!");
  }

  const user = await User.findById(req.user._id).select("-password");

  if (user.refreshToken != incomingRefreshToken) {
    throw new ApiError(400, "Refresh Token is Expired");
  }

  const newAccessToken = await user.generateAccessToken();

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, cookiesOption)
    .json(
      new ApiResponse(200, { user, newAccessToken }, "Access Token Renewed!"),
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(422, "All fields are required!");
  }

  if (oldPassword.trim() == newPassword.trim()) {
    throw new ApiError(400, "Old password cannot be new password!");
  }

  const user = await User.findById(req.user._id);

  const isPasswordValid = await user.isPasswordValid(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password!");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully!"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, fullName, email } = req.body;

  if (!username || !fullName || !email) {
    throw new ApiError(422, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        username,
        fullName,
        email,
      },
    },
    { returnDocument: "after" },
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated!"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(422, "Avatar file is missing!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $set: { avatar: avatar?.secure_url },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, avatar.secure_url, "Avatar updated!"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;

  if (!coverLocalPath) {
    throw new ApiError(422, "Cover image file is missing!");
  }

  const cover = await uploadOnCloudinary(coverLocalPath);

  if (!cover) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $set: { coverImage: cover?.secure_url },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, cover.secure_url, "Cover Image updated!"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(422, "Username is missing!");
  }

  const [channel] = await User.aggregate([
    {
      $match: { username: username.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        let: { channelId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$channel", "$$channelId"],
              },
            },
          },
          { $count: "count" },
        ],
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$$userId", "$subscriber"],
              },
            },
          },
          { $count: "count" },
        ],
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: { $ifNull: ["$subscribers", []] },
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel) {
    throw new ApiError(404, "Channel doesn't exists!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel, "Channel fetched!"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const [watchHistory] = await WatchHistory.aggregate([
    {
      $match: { userId: 1 },
    },
    { $unwind: "$videos" },
    {
      $lookup: {
        from: "videos",
        localField: "videos.videoId",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $group: {
        _id: "$userId",
        watchedVideos: {
          $push: "$videoDetails",
        },
      },
    },
    {
      $project: {
        _id: 1,
        watchedVideos: 1,
      },
    },
  ]);

  if (!watchHistory) {
    throw new ApiError(404, "Data not found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, watchHistory, "User's watch history fetched!"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
