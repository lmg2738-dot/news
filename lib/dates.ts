import { format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const KST = "Asia/Seoul";

export function nowKST(): Date {
  return toZonedTime(new Date(), KST);
}

export function dayKeyKST(date: Date = new Date()): string {
  return format(toZonedTime(date, KST), "yyyy-MM-dd");
}

export function todayKST(): string {
  return dayKeyKST(new Date());
}

export function yesterdayKST(): string {
  return dayKeyKST(subDays(nowKST(), 1));
}

/** Redis 저장 유지 일수(오늘 포함). 3이면 3일 전 당일부터 삭제 */
export const STORAGE_RETENTION_DAYS = 3;

/** 저장 시 유지할 최소 day 키 (이보다 이전 day는 삭제) */
export function minStorageDayKST(
  retentionDays: number = STORAGE_RETENTION_DAYS
): string {
  const keepThrough = Math.max(1, retentionDays) - 1;
  return dayKeyKST(subDays(nowKST(), keepThrough));
}

export function visibleDayKeys(): Set<string> {
  return new Set([todayKST(), yesterdayKST()]);
}

export function formatDisplayDay(day: string): string {
  const today = todayKST();
  const yesterday = yesterdayKST();
  if (day === today) return "오늘";
  if (day === yesterday) return "어제";
  return day;
}
