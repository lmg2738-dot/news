import { existsSync, readFileSync } from "fs";
import { join } from "path";

type FileConfig = {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
};

function loadFileConfig(): FileConfig {
  const path = join(process.cwd(), "config.json");
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as FileConfig;
  } catch {
    return {};
  }
}

export function getConfig() {
  const file = loadFileConfig();
  const telegramBotToken =
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    file.telegram_bot_token?.trim();
  const telegramChatId =
    process.env.TELEGRAM_CHAT_ID?.trim() ||
    file.telegram_chat_id?.trim();
  const keywords = (process.env.NEWS_KEYWORDS ?? "CJ")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (!telegramBotToken || !telegramChatId) {
    throw new Error(
      "config.json 또는 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID를 설정하세요."
    );
  }

  return { telegramBotToken, telegramChatId, keywords };
}
