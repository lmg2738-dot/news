export async function sendTelegram(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
  return res.ok;
}

export function formatTelegramMessage(article: {
  title: string;
  link: string;
  source: string;
}): string {
  const now = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  const title = escapeHtml(article.title);
  const source = escapeHtml(article.source);
  const link = article.link;

  return (
    `📰 <b>CJ 뉴스 알림</b>\n\n` +
    `<b>${title}</b>\n` +
    `출처: ${source}\n` +
    `<a href="${link}">기사 보기</a>\n\n` +
    `🕐 ${now}`
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
