import { createClient } from "redis";

const g = globalThis as any;

// Returns a connected client, or null if Redis is unavailable.
export async function getRedis() {
  try {
    if (!g._redis) {
      const c = createClient({
        url: process.env.REDIS_URL,
        socket: { connectTimeout: 1000, reconnectStrategy: false },
      });
      c.on("error", () => {});
      g._redis = c;
    }
    if (!g._redis.isOpen) await g._redis.connect();
    return g._redis;
  } catch {
    g._redis = undefined;
    return null;
  }
}
