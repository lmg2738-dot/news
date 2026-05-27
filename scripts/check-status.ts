import { getRedis } from "../lib/redis-client";
import { getConfig } from "../lib/config";
import { collectArticles } from "../lib/news";
import { loadState } from "../lib/storage";
import { todayKST, yesterdayKST } from "../lib/dates";

async function main() {
  const config = getConfig();
  const collected = await collectArticles(config.keywords);
  const state = await loadState();

  const sentHashes = new Set(Object.keys(state.sent));
  const notSent = collected.filter((a) => !sentHashes.has(a.hash));
  const yesterday = yesterdayKST();
  const today = todayKST();

  console.log("=== CJ 뉴스 상태 진단 ===\n");
  console.log("KST 오늘:", today, "| 어제:", yesterday);
  console.log("수집(지금):", collected.length, "건");
  console.log("Redis/articles 저장:", state.articles.length, "건");
  console.log("sent(텔레그램 이력):", sentHashes.size, "건");
  console.log("아직 텔레그램 안 보낸 수집 기사:", notSent.length, "건");
  if (notSent.length > 0) {
    console.log("  예시:", notSent.slice(0, 3).map((a) => a.title.slice(0, 40)));
  }

  const redis = getRedis();
  if (redis) {
    const raw = await redis.get<{
      sent: Record<string, string>;
      articles: unknown[];
    }>("cj-news:state");
    if (raw) {
      console.log("\n[Upstash Redis 직접 조회]");
      console.log("  articles:", raw.articles?.length ?? 0);
      console.log("  sent:", Object.keys(raw.sent ?? {}).length);
    }
  } else {
    console.log("\n[Upstash] 환경 변수 미설정 — docs/VERCEL-ENV.md 참고");
  }

  console.log("\n[판단]");
  if (notSent.length === 0 && collected.length > 0) {
    console.log(
      "  → 수집된 기사는 있으나 모두 sent에 있음. 텔레그램은 '새 기사'만 전송."
    );
  } else if (notSent.length > 0) {
    console.log(
      "  → 미전송 기사 있음. GitHub Actions 매시 배치 또는 Vercel env 확인."
    );
  }
}

main().catch(console.error);
