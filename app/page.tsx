import {
  formatDisplayDay,
  todayKST,
  yesterdayKST,
} from "@/lib/dates";
import { getVisibleArticles, loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const state = await loadState();
  const articles = getVisibleArticles(state.articles);
  const today = todayKST();
  const yesterday = yesterdayKST();
  const todayCount = articles.filter((a) => a.day === today).length;
  const yesterdayCount = articles.filter((a) => a.day === yesterday).length;

  return (
    <main className="page">
      <header className="header">
        <h1>CJ 뉴스 알림</h1>
        <p>
          당일·어제 기사를 중복 없이 누적합니다. 최신 기사가 맨 위, 이전 기사가
          아래로 이어집니다.
        </p>
        <div className="badge-row">
          <span className="badge">오늘 {todayCount}건</span>
          <span className="badge">어제 {yesterdayCount}건</span>
          <span className="badge">합계 {articles.length}건</span>
        </div>
      </header>

      {articles.length === 0 ? (
        <p className="empty">
          표시할 뉴스가 없습니다.
          <br />
          Cron이 동작하면 새 기사가 여기에 쌓입니다.
        </p>
      ) : (
        <ul className="timeline">
          {articles.map((art, index) => (
            <li key={art.hash} className="timeline-item">
              <span className="timeline-rank" aria-hidden>
                {index + 1}
              </span>
              <article className="card">
                <div className="card-top">
                  <span
                    className={`day-chip ${
                      art.day === today ? "today" : "yesterday"
                    }`}
                  >
                    {formatDisplayDay(art.day)}
                  </span>
                  <time className="card-time" dateTime={art.addedAt}>
                    {new Intl.DateTimeFormat("ko-KR", {
                      timeZone: "Asia/Seoul",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(art.addedAt))}
                  </time>
                </div>
                <h2>
                  <a
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {art.title}
                  </a>
                </h2>
                <p className="card-source">{art.source}</p>
              </article>
            </li>
          ))}
        </ul>
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
