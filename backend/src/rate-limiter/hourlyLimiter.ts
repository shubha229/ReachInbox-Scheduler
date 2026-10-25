
import { redisConnection } from "../config/redis.js";

const RESERVE_SCRIPT = `
local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local minGap = tonumber(ARGV[3])

local hour = math.floor(now / 3600000)
local hourKey = KEYS[1] .. ":hour:" .. hour
local nextKey = KEYS[1] .. ":next"

local count = tonumber(redis.call("GET", hourKey) or "0")
local nextAllowed = tonumber(redis.call("GET", nextKey) or "0")

if count >= limit then
  return {0, (hour + 1) * 3600000}
end

local allowedAt = math.max(now, nextAllowed)

if allowedAt > now then
  return {0, allowedAt}
end

redis.call("INCR", hourKey)
redis.call("PEXPIRE", hourKey, 7200000)
redis.call("SET", nextKey, now + minGap)
redis.call("PEXPIRE", nextKey, 7200000)

return {1, now}
`;

export async function reserveSendSlot(
  senderId: string,
  hourlyLimit: number,
  minDelayMs: number
): Promise<{ allowed: boolean; retryAt: number }> {
  const now = Date.now();

  const result = (await redisConnection.eval(
    RESERVE_SCRIPT,
    1,
    `rate:${senderId}`,
    now,
    hourlyLimit,
    minDelayMs
  )) as [number, number];

  return {
    allowed: result[0] === 1,
    retryAt: result[1],
  };
}
