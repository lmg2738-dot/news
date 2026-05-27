import { ensureEnvFilesLoaded } from "./secrets";

/** 인스턴스별 설정 (CJ / 롯데 등 복제 프로젝트용) */
export function getAppMeta() {
  ensureEnvFilesLoaded();
  const title = process.env.APP_TITLE?.trim() || "CJ 뉴스 알림";
  const brandMark = process.env.APP_BRAND_MARK?.trim() || "CJ";
  const redisStateKey =
    process.env.REDIS_STATE_KEY?.trim() || "cj-news:state";
  const keywords = (process.env.NEWS_KEYWORDS ?? "CJ")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return { title, brandMark, redisStateKey, keywords };
}

export function getAppTitle(): string {
  return getAppMeta().title;
}

export function getAppBrandMark(): string {
  return getAppMeta().brandMark;
}

export function getRedisStateKey(): string {
  return getAppMeta().redisStateKey;
}
