import { visibleDayKeys } from "./dates";
import type { StoredArticle } from "./news";

/** hash 기준 중복 제거 (같은 기사는 가장 최근 addedAt 유지) */
export function dedupeArticles(articles: StoredArticle[]): StoredArticle[] {
  const byHash = new Map<string, StoredArticle>();
  for (const art of articles) {
    const prev = byHash.get(art.hash);
    if (!prev || art.addedAt.localeCompare(prev.addedAt) > 0) {
      byHash.set(art.hash, art);
    }
  }
  return Array.from(byHash.values());
}

/** 최신순(위→아래) 정렬 */
export function sortNewestFirst(articles: StoredArticle[]): StoredArticle[] {
  return [...articles].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/** 당일·어제만, 중복 제거, 최신순 */
export function prepareVisibleArticles(
  articles: StoredArticle[]
): StoredArticle[] {
  const days = visibleDayKeys();
  return sortNewestFirst(
    dedupeArticles(articles.filter((a) => days.has(a.day)))
  );
}
