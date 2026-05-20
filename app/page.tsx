import {
  formatDisplayDay,
  todayKST,
  yesterdayKST,
} from "@/lib/dates";
import type { StoredArticle } from "@/lib/news";
import { getVisibleArticles, loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

function groupByDay(articles: StoredArticle[]) {
  const groups = new Map<string, StoredArticle[]>();
  for (const art of articles) {
    const list = groups.get(art.day) ?? [];
    list.push(art);
    groups.set(art.day, list);
  }
  const order = [todayKST(), yesterdayKST()];
  return order
    .filter((day) => groups.has(day))
    .map((day) => ({
      day,
      label: formatDisplayDay(day),
      articles: groups.get(day)!,
    }));
}

export default async function HomePage() {
  const state = await loadState();
  const articles = getVisibleArticles(state.articles);
  const groups = groupByDay(articles);

  return (
    <main className="page">
      <header className="header">
        <h1>CJ 뉴스 알림</h1>
        <p>전일·당일 뉴스만 표시됩니다. 매일 자정(KST) 기준으로 이전 기사는 숨깁니다.</p>
        <div className="badge-row">
          <span className="badge">10분마다 수집</span>
          <span className="badge">텔레그램 알림</span>
          <span className="badge">총 {articles.length}건</span>
        </div>
      </header>

      {groups.length === 0 ? (
        <p className="empty">
          표시할 뉴스가 없습니다.
          <br />
          Cron이 동작하면 새 기사가 여기에 쌓입니다.
        </p>
      ) : (
        groups.map(({ day, label, articles: dayArticles }) => (
          <section key={day} className="section">
            <h2 className="section-title">
              <span
                className={`dot ${label === "오늘" ? "today" : "yesterday"}`}
              />
              {label}
              <span style={{ fontWeight: 400 }}>({dayArticles.length})</span>
            </h2>
            <ul className="list">
              {dayArticles.map((art) => (
                <li key={art.hash}>
                  <article className="card">
                    <h2>
                      <a href={art.link} target="_blank" rel="noopener noreferrer">
                        {art.title}
                      </a>
                    </h2>
                    <div className="card-meta">
                      <span>{art.source}</span>
                      <time dateTime={art.addedAt}>
                        {new Intl.DateTimeFormat("ko-KR", {
                          timeZone: "Asia/Seoul",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(art.addedAt))}
                      </time>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <footer className="footer">
        갱신:{" "}
        {new Intl.DateTimeFormat("ko-KR", {
          timeZone: "Asia/Seoul",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date())}
      </footer>
    </main>
  );
}
