import type { NextRequest } from "next/server";

/** Vercel Cron 대신 cron-job.org 등 무료 HTTP 스케줄러용 */
export function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const q = request.nextUrl.searchParams.get("secret");
  return q === secret;
}
