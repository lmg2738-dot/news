import { NextResponse } from "next/server";
import { todayKST, yesterdayKST } from "@/lib/dates";
import { collectArticles } from "@/lib/news";
import { getConfig } from "@/lib/config";
import { runNewsCycle } from "@/lib/runner";
import {
  canPersistState,
  getStatePublicUrl,
  getVisibleArticles,
  loadState,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const run = searchParams.get("run") === "1";

  try {
    const config = getConfig();
    const collected = await collectArticles(config.keywords);
    const state = await loadState();
    const visible = getVisibleArticles(state.articles);

    let runResult = null;
    if (run) {
      runResult = await runNewsCycle();
    }

    return NextResponse.json({
      ok: true,
      storage: "github-json",
      storageReady: canPersistState(),
      stateUrl: getStatePublicUrl(),
      today: todayKST(),
      yesterday: yesterdayKST(),
      collectedNow: collected.length,
      storedArticles: state.articles.length,
      storedSent: Object.keys(state.sent).length,
      visibleOnWeb: visible.length,
      sampleCollected: collected.slice(0, 3).map((a) => ({
        title: a.title.slice(0, 60),
        source: a.source,
        hash: a.hash,
      })),
      runResult,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
