import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies.accessToken || req.headers?.authorization?.split(" ")?.[1];

  if (!accessToken) {
    throw new ApiError(401, "Unauthorized Request!");
  }

  const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decodedToken._id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(401, "Invalid AccessToken!");
  }

  req.user = user;
  next();
});

export default verifyJWT;
