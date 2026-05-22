"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_INTERVAL_MS = 60 * 60 * 1000;
const RUN_URL = "/api/status?run=1";

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
    setMessage("수집 중…");

    try {
      const res = await fetch(RUN_URL, { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        runResult?: {
          telegramSent?: number;
          syncedCount?: number;
          message?: string;
        };
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const tg = data.runResult?.telegramSent ?? 0;
      const synced = data.runResult?.syncedCount ?? 0;
      setStatus("ok");
      setMessage(`완료 · 반영 ${synced}건 · 텔레그램 ${tg}건`);
      router.refresh();
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "새로고침 실패");
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
    <div className="refresh-wrap">
      <button
        ref={btnRef}
        id="news-refresh-btn"
        type="button"
        className="refresh-btn"
        onClick={() => void runRefresh()}
        disabled={status === "loading"}
        aria-busy={status === "loading"}
      >
        {status === "loading" ? "새로고침 중…" : "새로고침"}
      </button>
      {message ? (
        <p className={`refresh-status refresh-status--${status}`} role="status">
          {message}
        </p>
      ) : null}
      <p className="refresh-hint">1시간마다 자동 수집</p>
    </div>
  );
}
