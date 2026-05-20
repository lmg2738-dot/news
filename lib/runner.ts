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
  const articles = await collectArticles(config.keywords);

  let newCount = 0;
  const existingHashes = new Set(state.articles.map((a) => a.hash));

  for (const art of articles) {
    if (newCount >= MAX_NEW_PER_CYCLE) break;
    if (state.sent[art.hash]) continue;

    const stored = toStoredArticle(art);
    await sendTelegram(
      config.telegramBotToken,
      config.telegramChatId,
      formatTelegramMessage(stored)
    );

    state.sent[art.hash] = stored.addedAt;
    if (!existingHashes.has(art.hash)) {
      state.articles.unshift(stored);
      existingHashes.add(art.hash);
    }
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
        ? `새 기사 ${newCount}건 전송·저장`
        : "새 기사 없음",
  };
}
