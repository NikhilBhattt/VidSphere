import { createClient } from "redis";
import config from "../config/config.js";

const client = createClient({
  url: config.REDIS_URL,
});

client.on("error", (err) => console.error("Redis error: ", err));

async function connectRedis() {
  await client.connect();
  console.log("redis connected!");
}

export { client, connectRedis };
