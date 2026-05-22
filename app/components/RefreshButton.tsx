"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_INTERVAL_MS = 60 * 60 * 1000;
const RUN_URL = "/api/status?run=1";

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

export function RefreshButton() {
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const loadingRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const runRefresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setStatus("loading");
    setMessage("");

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
      setMessage(`반영 ${synced}건 · 텔레그램 ${tg}건`);
      router.refresh();
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "수집 실패");
    } finally {
      loadingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      btnRef.current?.click();
    }, AUTO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="refresh-panel">
      <button
        ref={btnRef}
        id="news-refresh-btn"
        type="button"
        className="refresh-btn"
        onClick={() => void runRefresh()}
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
        ) : (
          <span className="refresh-hint">1시간마다 자동 수집</span>
        )}
      </div>
    </div>
  );
}
