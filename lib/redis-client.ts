import { Redis } from "@upstash/redis";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

type FileConfig = {
  upstash_redis_rest_url?: string;
  upstash_redis_rest_token?: string;
};

function loadFileConfig(): FileConfig {
  const path = join(process.cwd(), "config.json");
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as FileConfig;
  } catch {
    return {};
  }
}

export function getRedis(): Redis | null {
  const file = loadFileConfig();
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    file.upstash_redis_rest_url?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    file.upstash_redis_rest_token?.trim();

  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}
