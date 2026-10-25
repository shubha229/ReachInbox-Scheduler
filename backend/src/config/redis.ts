import "dotenv/config";
import {Redis} from "ioredis";

export const redisConnection = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
    console.log("Connected to Redis");
});

redisConnection.on("error", (err) => {
    console.error("Redis connection error:", err.message);
});