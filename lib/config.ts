import { ensureEnvFilesLoaded, missingEnvHint, readLocalConfigJson } from "./secrets";

export function getConfig() {
  ensureEnvFilesLoaded();
  const file = readLocalConfigJson();
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
      missingEnvHint(["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"])
    );
  }

  return { telegramBotToken, telegramChatId, keywords };
}
