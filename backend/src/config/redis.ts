import "dotenv/config";

const redisUrl = process.env.REDIS_URL;

const parsedUrl = redisUrl ? new URL(redisUrl) : null;

export const redisConnection = parsedUrl
  ? {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port || 6379),
      username: decodeURIComponent(parsedUrl.username || "default"),
      password: decodeURIComponent(parsedUrl.password),
      ...(parsedUrl.protocol === "rediss:" ? { tls: {} } : {}),
    }
  : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
    };