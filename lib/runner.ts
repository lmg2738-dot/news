import { dedupeArticles } from "./articles";
import { getConfig } from "./config";
import {
  collectArticles,
  MAX_NEW_PER_CYCLE,
  toStoredArticle,
} from "./news";
import {
  canPersistState,
  getActiveStorageBackend,
  getStatePublicUrl,
  getVisibleArticles,
  loadState,
  saveState,
} from "./storage";
import {
  formatTelegramMessage,
  sendTelegramDetailed,
} from "./telegram";

export type RunResult = {
  ok: boolean;
  newCount: number;
  syncedCount: number;
  collectedCount: number;
  totalVisible: number;
  telegramSent: number;
  storageReady: boolean;
  storageBackend: string;
  stateUrl: string;
  saveMode?: string;
  message: string;
  error?: string;
};

export async function runNewsCycle(): Promise<RunResult> {
  const storageReady = canPersistState();
  const storageBackend = getActiveStorageBackend();
  const config = getConfig();
  const state = await loadState();
  state.articles = dedupeArticles(state.articles);

  const collected = await collectArticles(config.keywords);
  let syncedCount = 0;
  let newCount = 0;
  let telegramSent = 0;

  for (const art of collected) {
    const stored = toStoredArticle(art);
    const before = state.articles.length;
    state.articles = dedupeArticles([stored, ...state.articles]);
    if (state.articles.length >= before) syncedCount += 1;
  }

  for (const art of collected) {
    if (state.sent[art.hash]) continue;
    if (newCount >= MAX_NEW_PER_CYCLE) break;

    const stored =
      state.articles.find((a) => a.hash === art.hash) ??
      toStoredArticle(art);

    const tg = await sendTelegramDetailed(
      config.telegramBotToken,
      config.telegramChatId,
      formatTelegramMessage(stored)
    );
    if (tg.ok) {
      telegramSent += 1;
      state.sent[art.hash] = stored.addedAt;
    } else {
      console.error(
        "[telegram]",
        art.hash,
        tg.status,
        tg.errorCode,
        tg.description
      );
    }
    newCount += 1;
  }

  let saveMode: string | undefined;
  try {
    saveMode = await saveState(state);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    const visible = getVisibleArticles(state.articles);
    return {
      ok: false,
      newCount,
      syncedCount,
      collectedCount: collected.length,
      totalVisible: visible.length,
      telegramSent,
      storageReady,
      storageBackend,
      stateUrl: getStatePublicUrl(),
      message: msg,
      error: msg,
    };
  }

  const visible = getVisibleArticles(state.articles);
  const workflowNote =
    saveMode === "workflow"
      ? " (GitHub Actions 배치 트리거 — 1~3분 후 페이지 갱신)"
      : "";

  return {
    ok: true,
    newCount,
    syncedCount,
    collectedCount: collected.length,
    totalVisible: visible.length,
    telegramSent,
    storageReady,
    storageBackend,
    stateUrl: getStatePublicUrl(),
    saveMode,
    message:
      collected.length === 0
        ? "수집된 뉴스 없음"
        : saveMode === "workflow"
          ? `수집 ${collected.length}건 · 저장은 Actions 배치에서 진행${workflowNote}`
          : newCount > 0
            ? `수집 ${collected.length}건 · 웹 반영 ${syncedCount}건 · 텔레그램 ${telegramSent}건 · 표시 ${visible.length}건`
            : `수집 ${collected.length}건 · 웹 반영 ${syncedCount}건 · 표시 ${visible.length}건`,
  };
}
