import { list, put } from "@vercel/blob";
import { yesterdayKST } from "./dates";
import { dedupeArticles, prepareVisibleArticles, sortNewestFirst } from "./articles";
import type { StoredArticle } from "./news";
import { trimSentHistory } from "./news";

const STATE_PATHNAME = "cj-news/state.json";

export type AppState = {
  sent: Record<string, string>;
  articles: StoredArticle[];
};

function defaultState(): AppState {
  return { sent: {}, articles: [] };
}

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function pickLatestStateBlob(
  blobs: { pathname: string; url: string; uploadedAt?: Date | string }[]
) {
  const matches = blobs.filter((b) => b.pathname === STATE_PATHNAME);
  const candidates = matches.length > 0 ? matches : blobs;
  return candidates.sort((a, b) => {
    const ta = new Date(a.uploadedAt ?? 0).getTime();
    const tb = new Date(b.uploadedAt ?? 0).getTime();
    return tb - ta;
  })[0];
}

export async function loadState(): Promise<AppState> {
  if (!isBlobConfigured()) {
    return defaultState();
  }

  try {
    const { blobs } = await list({ prefix: "cj-news/" });
    const blob = pickLatestStateBlob(blobs);
    if (!blob?.url) return defaultState();

    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return defaultState();
    const data = (await res.json()) as AppState;
    const articles = Array.isArray(data.articles) ? data.articles : [];
    return {
      sent: data.sent ?? {},
      articles: normalizeStoredArticles(articles),
    };
  } catch {
    return defaultState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  const pruned: AppState = {
    sent: trimSentHistory(state.sent),
    articles: pruneArticlesForStorage(state.articles),
  };

  if (!isBlobConfigured()) {
    throw new Error(
      "Vercel Blob이 연결되지 않았습니다. Vercel 대시보드 → Storage → Blob을 프로젝트에 연결하세요."
    );
  }

  await put(STATE_PATHNAME, JSON.stringify(pruned), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
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
