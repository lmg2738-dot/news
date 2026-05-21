/**
 * 텔레그램 API 단건 전송 테스트
 * 사용: npm run test:telegram
 */
import { getConfig } from "../lib/config";
import {
  sendTelegramDetailed,
  formatTelegramMessage,
} from "../lib/telegram";

async function getMe(botToken: string) {
  const url = `https://api.telegram.org/bot${botToken}/getMe`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

async function sendRaw(
  botToken: string,
  chatId: string,
  text: string,
  parseMode?: string
) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
  };
  if (parseMode) payload.parse_mode = parseMode;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log("=== 텔레그램 API 테스트 ===\n");
  const { telegramBotToken: botToken, telegramChatId: chatId } = getConfig();
  console.log("chat_id:", chatId);
  console.log("bot_token:", botToken.slice(0, 12) + "...\n");

  console.log("[1] getMe (봇 토큰 확인)");
  const me = await getMe(botToken);
  console.log("  status:", me.status, "| ok:", me.ok);
  console.log("  response:", JSON.stringify(me.body, null, 2));

  if (!me.ok) {
    console.error("\n봇 토큰이 유효하지 않습니다.");
    process.exit(1);
  }

  const plainText =
    `[CJ 뉴스 알림 테스트]\n` +
    `시각: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}\n` +
    `단건 API 호출 정상 여부 확인용 메시지입니다.`;

  console.log("\n[2] sendMessage (일반 텍스트, HTML 없음)");
  const plain = await sendRaw(botToken, chatId, plainText);
  console.log("  status:", plain.status, "| ok:", plain.ok);
  console.log("  response:", JSON.stringify(plain.body, null, 2));

  console.log("\n[3] sendMessage (HTML — 앱과 동일 형식)");
  const htmlMsg = formatTelegramMessage({
    title: "텔레그램 전송 테스트 기사",
    link: "https://news.google.com",
    source: "테스트",
  });
  const html = await sendRaw(botToken, chatId, htmlMsg, "HTML");
  console.log("  status:", html.status, "| ok:", html.ok);
  console.log("  response:", JSON.stringify(html.body, null, 2));

  console.log("\n[4] lib/telegram.ts sendTelegramDetailed()");
  const viaLib = await sendTelegramDetailed(botToken, chatId, htmlMsg);
  console.log("  결과:", JSON.stringify(viaLib, null, 2));

  const allOk = plain.ok && html.ok && viaLib.ok;
  console.log("\n=== 종합:", allOk ? "전송 정상" : "일부 실패", "===");
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("오류:", e);
  process.exit(1);
});
