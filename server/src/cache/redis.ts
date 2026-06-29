import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const redisCache = {
  // Save game state for 24 hours
  // We still JSON.stringify on the way IN — this is required and correct.
  async setGameState(roomId: string, state: object) {
    await redis.setex(`game:${roomId}`, 86400, JSON.stringify(state));
  },

  // Load game state
  // Upstash's REST client auto-parses JSON responses for us.
  // `data` here is already a real object, NOT a string — so no JSON.parse needed.
  async getGameState(roomId: string) {
    const data = await redis.get(`game:${roomId}`);
    return data ?? null;
  },

  // Delete game state
  async deleteGameState(roomId: string) {
    await redis.del(`game:${roomId}`);
  },

  // Save user session for 7 days
  async setSession(userId: number, sessionData: object) {
    await redis.setex(`session:${userId}`, 604800, JSON.stringify(sessionData));
  },

  // Load user session
  async getSession(userId: string) {
    const data = await redis.get(`session:${userId}`);
    return data ?? null;
  },

  // Clear session
  async clearSession(userId: number) {
    await redis.del(`session:${userId}`);
  },
};