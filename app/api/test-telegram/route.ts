import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import {
  formatTelegramMessage,
  sendTelegramDetailed,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function getMe(botToken: string) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`,
      { signal: AbortSignal.timeout(20000) }
    );
    const body = await res.json();
    return { ok: res.ok && body.ok, status: res.status, result: body };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      result: { description: e instanceof Error ? e.message : String(e) },
    };
  }
}

export async function GET() {
  try {
    const { telegramBotToken, telegramChatId } = getConfig();

    const getMeResult = await getMe(telegramBotToken);

    const plainMessage =
      `[CJ 뉴스 알림 테스트]\n` +
      `${new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date())}\n` +
      `Vercel에서 단건 API 호출 테스트입니다.`;

    const plainSend = await sendTelegramDetailed(
      telegramBotToken,
      telegramChatId,
      plainMessage.replace(/</g, "").replace(/>/g, "")
    );

    const htmlMessage = formatTelegramMessage({
      title: "텔레그램 HTML 형식 테스트",
      link: "https://news.google.com",
      source: "CJ News Alert",
    });

    const htmlSend = await sendTelegramDetailed(
      telegramBotToken,
      telegramChatId,
      htmlMessage
    );

    const allOk =
      getMeResult.ok && plainSend.ok && htmlSend.ok;

    return NextResponse.json({
      ok: allOk,
      chatId: telegramChatId,
      tests: {
        getMe: getMeResult,
        plainText: plainSend,
        htmlFormat: htmlSend,
      },
      hint: allOk
        ? "텔레그램 앱에서 테스트 메시지 2건을 확인하세요."
        : "getMe 실패 → 토큰 확인. sendMessage 실패 → 봇과 대화 시작(/start) 또는 chat_id 확인.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
