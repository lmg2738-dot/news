"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_INTERVAL_MS = 60 * 60 * 1000;
const RUN_URL = "/api/status?run=1";
const LAST_AUTO_KEY = "cj-news-last-auto-run";

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`refresh-icon${spinning ? " refresh-icon--spin" : ""}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M21 12a9 9 0 1 1-2.64-6.36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 3v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatNextRunKST(ms: number): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

function getLastAutoRun(): number {
  try {
    return Number(localStorage.getItem(LAST_AUTO_KEY) || 0);
  } catch {
    return 0;
  }
}

function setLastAutoRun(ts: number): void {
  try {
    localStorage.setItem(LAST_AUTO_KEY, String(ts));
  } catch {
    /* private mode 등 */
  }
}

function msUntilDue(): number {
  const last = getLastAutoRun();
  if (!last) return 0;
  return Math.max(0, AUTO_INTERVAL_MS - (Date.now() - last));
}

function getNextRunAt(): number {
  const last = getLastAutoRun();
  if (!last) return Date.now() + AUTO_INTERVAL_MS;
  const due = last + AUTO_INTERVAL_MS;
  return due > Date.now() ? due : Date.now() + AUTO_INTERVAL_MS;
}

export function RefreshButton() {
  const router = useRouter();
  const loadingRef = useRef(false);
  const runRefreshRef = useRef<(auto?: boolean) => Promise<void>>(async () => {});
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [nextRunAt, setNextRunAt] = useState<number | null>(null);

  const scheduleNext = useCallback(() => {
    setNextRunAt(getNextRunAt());
  }, []);

  const runRefresh = useCallback(
    async (auto = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setStatus("loading");
      if (!auto) setMessage("");

      try {
        const res = await fetch(RUN_URL, { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          runResult?: {
            telegramSent?: number;
            syncedCount?: number;
          };
        };

        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        const tg = data.runResult?.telegramSent ?? 0;
        const synced = data.runResult?.syncedCount ?? 0;
        setStatus("ok");
        setMessage(
          auto
            ? `자동 · 반영 ${synced}건 · 텔레그램 ${tg}건`
            : `반영 ${synced}건 · 텔레그램 ${tg}건`
        );
        if (auto) setLastAutoRun(Date.now());
        setNextRunAt(Date.now() + AUTO_INTERVAL_MS);
        router.refresh();
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "수집 실패");
        scheduleNext();
      } finally {
        loadingRef.current = false;
      }
    },
    [router, scheduleNext]
  );

  runRefreshRef.current = runRefresh;

  useEffect(() => {
    scheduleNext();

    const tickAuto = () => void runRefreshRef.current(true);

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const wait = msUntilDue();
    const initialDelay = wait === 0 ? 5000 : wait;

    const timeoutId = setTimeout(() => {
      tickAuto();
      intervalId = setInterval(tickAuto, AUTO_INTERVAL_MS);
    }, initialDelay);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (msUntilDue() === 0 && !loadingRef.current) {
        tickAuto();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const nextLabelTimer = setInterval(scheduleNext, 30_000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      clearInterval(nextLabelTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [scheduleNext]);

  return (
    <div className="refresh-panel">
      <button
        id="news-refresh-btn"
        type="button"
        className="refresh-btn"
        onClick={() => void runRefresh(false)}
        disabled={status === "loading"}
        aria-busy={status === "loading"}
      >
        <RefreshIcon spinning={status === "loading"} />
        <span>{status === "loading" ? "수집 중" : "새로고침"}</span>
      </button>
      <div className="refresh-meta">
        {message ? (
          <span
            className={`refresh-toast refresh-toast--${status}`}
            role="status"
          >
            {status === "ok" ? "✓ " : status === "error" ? "✕ " : ""}
            {message}
          </span>
        ) : null}
        <span className="refresh-hint">
          {nextRunAt
            ? `다음 자동 수집 ${formatNextRunKST(nextRunAt)} (탭 열림 필요)`
            : "1시간마다 자동 수집 (탭 열림 필요)"}
        </span>
      </div>
    </div>
  );
}
