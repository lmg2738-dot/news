import { Redis } from "@upstash/redis";
import { ensureEnvFilesLoaded, missingEnvHint } from "./secrets";

export function getRedis(): Redis | null {
  ensureEnvFilesLoaded();
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}

export function assertRedisConfigured(): void {
  if (!isRedisConfigured()) {
    throw new Error(
      missingEnvHint(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"])
    );
  }
}
