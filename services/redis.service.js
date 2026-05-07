import { createClient } from "redis";

const client = createClient({
  url: "redis://localhost:6379",
});

client.on("error", (err) => console.error("Redis error: ", err));

async function connectRedis() {
  await client.connect();
  console.log("redis connected!");
}

export { client, connectRedis };
