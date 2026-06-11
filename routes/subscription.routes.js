import { Router } from "express";

import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:channelId/toggle-subscription", verifyJWT, toggleSubscription);

router.get("/:channelId/subscribers", verifyJWT, getUserChannelSubscribers);

router.get("/subscribed-channels", verifyJWT, getSubscribedChannels);

export default router;
