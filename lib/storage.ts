import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { yesterdayKST } from "./dates";
import { dedupeArticles, prepareVisibleArticles, sortNewestFirst } from "./articles";
import type { StoredArticle } from "./news";
import { trimSentHistory } from "./news";

export const STATE_FILE = "data/news-state.json";
const STATE_BRANCH = process.env.STATE_BRANCH ?? "main";

export type AppState = {
  sent: Record<string, string>;
  articles: StoredArticle[];
};

function defaultState(): AppState {
  return { sent: {}, articles: [] };
}

function localStatePath(): string {
  return join(process.cwd(), STATE_FILE);
}

/** GitHub raw URL — Vercel·웹에서 읽기 */
export function getStatePublicUrl(): string {
  if (process.env.STATE_JSON_URL?.trim()) {
    return process.env.STATE_JSON_URL.trim();
  }
  const repo = process.env.GITHUB_REPOSITORY ?? "lmg2738-dot/news";
  return `https://raw.githubusercontent.com/${repo}/${STATE_BRANCH}/${STATE_FILE}`;
}

export function canPersistState(): boolean {
  return Boolean(
    process.env.GITHUB_ACTIONS === "true" ||
    (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) ||
    !process.env.VERCEL
  );
}

/** @deprecated Blob 미사용 — canPersistState 사용 */
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

async function loadStateFromGitHub(): Promise<AppState> {
  const url = `${getStatePublicUrl()}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return defaultState();
  return parseState((await res.json()) as AppState);
}

export async function loadState(): Promise<AppState> {
  if (!process.env.VERCEL) {
    const local = readLocalState();
    if (local) return local;
  }
  return loadStateFromGitHub();
}

function writeLocalState(state: AppState): void {
  const path = localStatePath();
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2), "utf-8");
}

async function saveStateViaGitHubApi(state: AppState): Promise<void> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.GITHUB_REPOSITORY?.trim();
  if (!token || !repo) {
    throw new Error(
      "GITHUB_TOKEN과 GITHUB_REPOSITORY가 필요합니다. (Vercel 환경 변수 또는 GitHub Actions)"
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
    throw new Error(`GitHub 저장 실패 (${putRes.status}): ${err.slice(0, 200)}`);
  }
}

export async function saveState(state: AppState): Promise<void> {
  const pruned: AppState = {
    sent: trimSentHistory(state.sent),
    articles: pruneArticlesForStorage(state.articles),
  };

  if (process.env.GITHUB_ACTIONS === "true" || !process.env.VERCEL) {
    writeLocalState(pruned);
    return;
  }

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
    await saveStateViaGitHubApi(pruned);
    return;
  }

  throw new Error(
    "저장 불가: GitHub Actions 배치를 사용하거나, Vercel에 GITHUB_TOKEN( repo 권한 )을 설정하세요."
  );
}

function normalizeStoredArticles(articles: StoredArticle[]): StoredArticle[] {
  return sortNewestFirst(dedupeArticles(articles));
}

function pruneArticlesForStorage(articles: StoredArticle[]): StoredArticle[] {
  const minDay = yesterdayKST();
  return sortNewestFirst(
    dedupeArticles(articles.filter((a) => a.day >= minDay))
  );
}

export function getVisibleArticles(articles: StoredArticle[]): StoredArticle[] {
  return prepareVisibleArticles(articles);
}
