import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { minStorageDayKST } from "./dates";
import { getRedis, isRedisConfigured } from "./redis-client";
import { dedupeArticles, prepareVisibleArticles, sortNewestFirst } from "./articles";
import { getGitHubRepository, getGitHubToken } from "./github-token";
import {
  patPermissionHint,
  triggerNewsBatchWorkflow,
} from "./github-workflow";
import type { StoredArticle } from "./news";
import { trimSentHistory } from "./news";

export const STATE_FILE = "data/news-state.json";
const STATE_BRANCH = process.env.STATE_BRANCH ?? "main";
const REDIS_KEY = "cj-news:state";

export type AppState = {
  sent: Record<string, string>;
  articles: StoredArticle[];
};

export type StorageBackend = "redis" | "github" | "local" | "none";

function defaultState(): AppState {
  return { sent: {}, articles: [] };
}

function localStatePath(): string {
  return join(process.cwd(), STATE_FILE);
}

export function getStatePublicUrl(): string {
  if (process.env.STATE_JSON_URL?.trim()) {
    return process.env.STATE_JSON_URL.trim();
  }
  const repo = getGitHubRepository();
  return `https://raw.githubusercontent.com/${repo}/${STATE_BRANCH}/${STATE_FILE}`;
}

export function getActiveStorageBackend(): StorageBackend {
  if (isRedisConfigured()) return "redis";
  if (process.env.GITHUB_ACTIONS === "true") return "local";
  // Vercel: PAT로 GitHub API/Actions 트리거 불가 → Upstash 환경 변수 필요
  if (process.env.VERCEL) return "none";
  if (getGitHubToken() && getGitHubRepository()) return "github";
  return "local";
}

export function canPersistState(): boolean {
  return getActiveStorageBackend() !== "none";
}

/** @deprecated */
export function isBlobConfigured(): boolean {
  return canPersistState();
}

function parseState(data: AppState): AppState {
  const articles = Array.isArray(data.articles) ? data.articles : [];
  return {
    sent: data.sent ?? {},
    articles: normalizeStoredArticles(articles),
  };
}

function readLocalState(): AppState | null {
  const path = localStatePath();
  if (!existsSync(path)) return null;
  try {
    return parseState(JSON.parse(readFileSync(path, "utf-8")) as AppState);
  } catch {
    return null;
  }
}

async function loadFromRedis(): Promise<AppState | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const data = await redis.get<AppState>(REDIS_KEY);
    return data ? parseState(data) : null;
  } catch {
    return null;
  }
}

async function loadFromGitHubRaw(): Promise<AppState> {
  const url = `${getStatePublicUrl()}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return defaultState();
  return parseState((await res.json()) as AppState);
}

export async function loadState(): Promise<AppState> {
  const fromRedis = await loadFromRedis();
  if (fromRedis) return fromRedis;

  if (!process.env.VERCEL) {
    const local = readLocalState();
    if (local) return local;
  }

  return loadFromGitHubRaw();
}

function writeLocalState(state: AppState): void {
  const path = localStatePath();
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2), "utf-8");
}

async function saveToRedis(state: AppState): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis not configured");
  await redis.set(REDIS_KEY, state);
}

async function saveToGitHubApi(state: AppState): Promise<void> {
  const token = getGitHubToken();
  const repo = getGitHubRepository();
  if (!token) {
    throw new Error(
      "GitHub 토큰 없음: GITHUB_TOKEN 환경 변수를 설정하세요"
    );
  }

  const apiBase = `https://api.github.com/repos/${repo}/contents/${STATE_FILE}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  let sha: string | undefined;
  const getRes = await fetch(`${apiBase}?ref=${STATE_BRANCH}`, { headers });
  if (getRes.ok) {
    const meta = (await getRes.json()) as { sha?: string };
    sha = meta.sha;
  }

  const body: Record<string, string> = {
    message: "chore: update news state",
    content: Buffer.from(JSON.stringify(state, null, 2), "utf-8").toString(
      "base64"
    ),
    branch: STATE_BRANCH,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    const error = new Error(
      `GitHub 저장 실패 (${putRes.status}): ${err.slice(0, 300)}${patPermissionHint(putRes.status)}`
    );
    (error as Error & { status?: number }).status = putRes.status;
    throw error;
  }
}

async function saveViaGitHubWithWorkflowFallback(
  state: AppState
): Promise<"api" | "workflow"> {
  // Vercel: Contents API 대신 Actions 배치만 트리거 (PAT Contents 쓰기 불필요)
  if (process.env.VERCEL) {
    const trigger = await triggerNewsBatchWorkflow();
    if (trigger.ok) return "workflow";
    throw new Error(
      `GitHub Actions 트리거 실패: ${trigger.detail}. ` +
        "PAT에 Actions Read and write를 추가하거나, Actions 탭에서 'CJ News Batch'를 Run workflow 하세요."
    );
  }

  try {
    await saveToGitHubApi(state);
    return "api";
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 403) {
      const trigger = await triggerNewsBatchWorkflow();
      if (trigger.ok) return "workflow";
    }
    throw e;
  }
}

export type SaveMode = "redis" | "local" | "api" | "workflow";

export async function saveState(state: AppState): Promise<SaveMode> {
  const minDay = minStorageDayKST();
  const pruned: AppState = {
    sent: trimSentHistory(pruneSentForStorage(state.sent, minDay)),
    articles: pruneArticlesForStorage(state.articles, minDay),
  };

  const backend = getActiveStorageBackend();

  switch (backend) {
    case "redis":
      await saveToRedis(pruned);
      return "redis";
    case "github": {
      const mode = await saveViaGitHubWithWorkflowFallback(pruned);
      if (mode === "workflow") {
        console.info(
          "[storage] Contents API 403 → GitHub Actions 배치 트리거됨"
        );
      }
      return mode;
    }
    case "local":
      writeLocalState(pruned);
      return "local";
    default:
      throw new Error(
        "Vercel 저장소 미설정: UPSTASH_REDIS_REST_URL·UPSTASH_REDIS_REST_TOKEN 환경 변수 설정 " +
          "(console.upstash.com) 또는 GitHub Actions 'CJ News Batch' 실행"
      );
  }
}

function normalizeStoredArticles(articles: StoredArticle[]): StoredArticle[] {
  return sortNewestFirst(dedupeArticles(articles));
}

function pruneArticlesForStorage(
  articles: StoredArticle[],
  minDay: string
): StoredArticle[] {
  return sortNewestFirst(
    dedupeArticles(articles.filter((a) => a.day >= minDay))
  );
}

/** 3일 이전 sent 기록 제거 (Redis 용량·중복 알림 정리) */
function pruneSentForStorage(
  sent: Record<string, string>,
  minDay: string
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [hash, addedAt] of Object.entries(sent)) {
    const day = addedAt.slice(0, 10);
    if (day >= minDay) out[hash] = addedAt;
  }
  return out;
}

export function getVisibleArticles(articles: StoredArticle[]): StoredArticle[] {
  return prepareVisibleArticles(articles);
}
