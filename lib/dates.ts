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
