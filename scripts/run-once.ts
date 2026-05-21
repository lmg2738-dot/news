/**
 * 배치 1회만 실행.
 * 사용: npm run batch:once
 */
import { appendFileSync } from "fs";
import { runNewsCycle } from "../lib/runner";

function writeGitHubOutput(r: {
  telegramSent: number;
  collectedCount: number;
  newCount: number;
}): void {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  appendFileSync(
    out,
    [
      `telegram_sent=${r.telegramSent}`,
      `collected_count=${r.collectedCount}`,
      `new_count=${r.newCount}`,
    ].join("\n") + "\n"
  );
}

runNewsCycle()
  .then((r) => {
    console.log(r.message, r);
    writeGitHubOutput(r);
    process.exit(r.ok ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
