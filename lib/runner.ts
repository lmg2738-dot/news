import { dedupeArticles } from "./articles";
import { getConfig } from "./config";
import {
  collectArticles,
  MAX_NEW_PER_CYCLE,
  toStoredArticle,
} from "./news";
import { getVisibleArticles, loadState, saveState } from "./storage";
import { formatTelegramMessage, sendTelegram } from "./telegram";

export type RunResult = {
  ok: boolean;
  newCount: number;
  totalVisible: number;
  message: string;
};

export async function runNewsCycle(): Promise<RunResult> {
  const config = getConfig();
  const state = await loadState();
  state.articles = dedupeArticles(state.articles);

  const collected = await collectArticles(config.keywords);
  let newCount = 0;

  for (const art of collected) {
    if (newCount >= MAX_NEW_PER_CYCLE) break;
    if (state.sent[art.hash]) continue;

    const stored = toStoredArticle(art);
    await sendTelegram(
      config.telegramBotToken,
      config.telegramChatId,
      formatTelegramMessage(stored)
    );

    state.sent[art.hash] = stored.addedAt;
    state.articles = dedupeArticles([stored, ...state.articles]);
    newCount += 1;
  }

  await saveState(state);
  const visible = getVisibleArticles(state.articles);

  return {
    ok: true,
    newCount,
    totalVisible: visible.length,
    message:
      newCount > 0
        ? `새 기사 ${newCount}건 전송·저장 (표시 ${visible.length}건)`
        : `새 기사 없음 (표시 ${visible.length}건)`,
  };
}
