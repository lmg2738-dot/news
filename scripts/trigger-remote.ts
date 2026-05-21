/**
 * 배포된 Vercel URL의 /api/cron 을 HTTP로 호출.
 * 사용: npm run batch:remote
 */
async function main() {
  const APP_URL = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const CRON_SECRET = process.env.CRON_SECRET ?? "";

  if (!APP_URL) {
    console.error(
      "APP_URL 환경 변수가 필요합니다. (예: https://your-app.vercel.app)"
    );
    process.exit(1);
  }

  const url = `${APP_URL}/api/cron`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (CRON_SECRET) {
    headers.Authorization = `Bearer ${CRON_SECRET}`;
  }

  const res = await fetch(url, { headers });
  const body = await res.text();
  console.log(res.status, body);
  process.exit(res.ok ? 0 : 1);
}

void main();
