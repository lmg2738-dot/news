export type TelegramSendResult = {
  ok: boolean;
  status: number;
  errorCode?: number;
  description?: string;
};

export async function sendTelegramDetailed(
  botToken: string,
  chatId: string,
  message: string
): Promise<TelegramSendResult> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
      signal: AbortSignal.timeout(20000),
    });

    let body: { ok?: boolean; error_code?: number; description?: string } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      body = { description: await res.text().catch(() => "") };
    }

    const apiOk = Boolean(body.ok);
    return {
      ok: res.ok && apiOk,
      status: res.status,
      errorCode: body.error_code,
      description: body.description,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      status: 0,
      description: msg,
    };
  }
}

export async function sendTelegram(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  const result = await sendTelegramDetailed(botToken, chatId, message);
  if (!result.ok) {
    console.error(
      "[telegram]",
      result.status,
      result.errorCode,
      result.description
    );
  }
  return result.ok;
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
