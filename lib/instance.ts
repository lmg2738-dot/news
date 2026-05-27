import { ensureEnvFilesLoaded } from "./secrets";

const DEFAULT_INSTANCE_ID = "cj";

/** 같은 Upstash DB 안에서 프로젝트별로 쓰는 구분 ID (예: cj, lotte) */
export function getRedisInstanceId(): string {
  ensureEnvFilesLoaded();
  const id =
    process.env.REDIS_INSTANCE_ID?.trim() ||
    process.env.REDIS_NAMESPACE?.trim() ||
    DEFAULT_INSTANCE_ID;
  return id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || DEFAULT_INSTANCE_ID;
}

/**
 * Upstash에 저장되는 키.
 * - REDIS_STATE_KEY 가 있으면 그대로 사용
 * - 없으면 `{instanceId}-news:state` (CJ 기본값: cj-news:state)
 */
export function getRedisStateKey(): string {
  ensureEnvFilesLoaded();
  const explicit = process.env.REDIS_STATE_KEY?.trim();
  if (explicit) return explicit;
  return `${getRedisInstanceId()}-news:state`;
}
