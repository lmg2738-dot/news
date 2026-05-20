export function getConfig() {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const keywords = (process.env.NEWS_KEYWORDS ?? "CJ")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (!telegramBotToken || !telegramChatId) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 환경 변수를 설정하세요."
    );
  }

  return { telegramBotToken, telegramChatId, keywords };
}
