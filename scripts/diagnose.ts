/**
 * 로컬 진단: 수집 · 저장 · 텔레그램 · 웹 표시 건수 확인
 * 사용: npm run diagnose
 */
import { todayKST, yesterdayKST } from "../lib/dates";
import { getConfig } from "../lib/config";
import { collectArticles } from "../lib/news";
import { runNewsCycle } from "../lib/runner";
import {
  canPersistState,
  getStatePublicUrl,
  getVisibleArticles,
  loadState,
} from "../lib/storage";

async function main() {
  console.log("=== CJ 뉴스 진단 ===");
  console.log("KST 오늘:", todayKST(), "| 어제:", yesterdayKST());
  console.log("상태 URL:", getStatePublicUrl());
  console.log("저장 가능:", canPersistState() ? "예" : "아니오 (GitHub Actions 또는 GITHUB_TOKEN)");

  const { keywords } = getConfig();
  const collected = await collectArticles(keywords);
  console.log("\n[수집]", collected.length, "건");
  collected.slice(0, 5).forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.source}] ${a.title.slice(0, 50)}...`);
  });

  const state = await loadState();
  const visible = getVisibleArticles(state.articles);
  console.log("\n[저장소] articles:", state.articles.length, "| sent:", Object.keys(state.sent).length);
  console.log("[웹 표시 가능]", visible.length, "건");

  console.log("\n[배치 1회 실행]");
  const result = await runNewsCycle();
  console.log(result);

  process.exit(result.ok ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
