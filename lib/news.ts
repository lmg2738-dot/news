import * as cheerio from "cheerio";
import { createHash } from "crypto";
import Parser from "rss-parser";
import { dayKeyKST } from "./dates";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const GOOGLE_NEWS_RSS =
  "https://news.google.com/rss/search?q={query}&hl=ko&gl=KR&ceid=KR:ko";
const NAVER_NEWS_URL =
  "https://search.naver.com/search.naver?where=news&query={query}&sort=1&pd=4";

/** 회당 텔레그램 전송 상한 (중복 제거 후, 미전송 기사만) */
export const MAX_NEW_PER_CYCLE = 20;
export const MAX_SENT_HISTORY = 5000;

export type RawArticle = {
  title: string;
  link: string;
  source: string;
  published?: string;
};

export type StoredArticle = RawArticle & {
  hash: string;
  addedAt: string;
  day: string;
};

const rssParser = new Parser({
  headers: { "User-Agent": USER_AGENT },
  timeout: 15000,
});

export function articleHash(title: string, link: string): string {
  const raw = `${title.trim()}|${link.trim()}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

async function fetchGoogleNews(keyword: string): Promise<RawArticle[]> {
  const url = GOOGLE_NEWS_RSS.replace(
    "{query}",
    encodeURIComponent(keyword)
  );
  try {
    const feed = await rssParser.parseURL(url);
    return (feed.items ?? []).map((entry) => ({
      title: (entry.title ?? "").trim(),
      link: (entry.link ?? "").trim(),
      source:
        (entry as { source?: { title?: string } }).source?.title ??
        "Google News",
      published: entry.pubDate ?? "",
    }));
  } catch {
    return [];
  }
}

async function fetchNaverNews(keyword: string): Promise<RawArticle[]> {
  const url = NAVER_NEWS_URL.replace(
    "{query}",
    encodeURIComponent(keyword)
  );
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const articles: RawArticle[] = [];
    $("a.news_tit").each((_, el) => {
      const title = $(el).text().trim();
      const link = $(el).attr("href")?.trim() ?? "";
      if (title && link) {
        articles.push({ title, link, source: "네이버뉴스" });
      }
    });
    return articles;
  } catch {
    return [];
  }
}

export async function collectArticles(
  keywords: string[]
): Promise<(RawArticle & { hash: string })[]> {
  const all: (RawArticle & { hash: string })[] = [];
  const seen = new Set<string>();

  for (const kw of keywords) {
    for (const fetcher of [fetchGoogleNews, fetchNaverNews]) {
      const batch = await fetcher(kw);
      for (const art of batch) {
        const h = articleHash(art.title, art.link);
        if (seen.has(h)) continue;
        seen.add(h);
        all.push({ ...art, hash: h });
      }
    }
  }
  return all;
}

export function toStoredArticle(
  art: RawArticle & { hash: string }
): StoredArticle {
  const addedAt = new Date().toISOString();
  return {
    ...art,
    addedAt,
    day: dayKeyKST(new Date()),
  };
}

export function trimSentHistory(
  sent: Record<string, string>
): Record<string, string> {
  const entries = Object.entries(sent);
  if (entries.length <= MAX_SENT_HISTORY) return sent;
  const sorted = entries.sort((a, b) => b[1].localeCompare(a[1]));
  return Object.fromEntries(sorted.slice(0, MAX_SENT_HISTORY));
}
