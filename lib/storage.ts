import { list, put } from "@vercel/blob";
import { visibleDayKeys, yesterdayKST } from "./dates";
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

export async function loadState(): Promise<AppState> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return defaultState();
  }

  try {
    const { blobs } = await list({ prefix: "cj-news/" });
    const blob = blobs.find((b) => b.pathname === STATE_PATHNAME) ?? blobs[0];
    if (!blob?.url) return defaultState();

    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return defaultState();
    const data = (await res.json()) as AppState;
    return {
      sent: data.sent ?? {},
      articles: Array.isArray(data.articles) ? data.articles : [],
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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob이 연결되지 않았습니다. Storage → Blob을 프로젝트에 연결하세요."
    );
  }

  await put(STATE_PATHNAME, JSON.stringify(pruned), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

function pruneArticlesForStorage(articles: StoredArticle[]): StoredArticle[] {
  const minDay = yesterdayKST();
  return articles
    .filter((a) => a.day >= minDay)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export function getVisibleArticles(articles: StoredArticle[]): StoredArticle[] {
  const days = visibleDayKeys();
  return articles
    .filter((a) => days.has(a.day))
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}
