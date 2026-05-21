/**
 * 로컬/서버에서 상시 실행하는 Node.js 배치 (10분마다).
 * 사용: npm run batch
 */
import cron from "node-cron";
import { runNewsCycle } from "../lib/runner";

const TZ = "Asia/Seoul";
const SCHEDULE = "*/10 * * * *";

async function tick() {
  const started = new Date().toISOString();
  try {
    const result = await runNewsCycle();
    console.log(`[${started}]`, result.message, result);
  } catch (e) {
    console.error(`[${started}]`, e);
  }
}

console.log(`CJ 뉴스 배치 시작 — ${SCHEDULE} (${TZ}), 즉시 1회 실행`);

cron.schedule(SCHEDULE, tick, { timezone: TZ });
void tick();
