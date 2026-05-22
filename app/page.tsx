import {
  formatDisplayDay,
  todayKST,
  yesterdayKST,
} from "@/lib/dates";
import {
  canPersistState,
  getVisibleArticles,
  loadState,
} from "@/lib/storage";
import { APP_VERSION } from "@/lib/version";
import { RefreshButton } from "./components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const storageReady = canPersistState();
  const state = await loadState();
  const articles = getVisibleArticles(state.articles);
  const storedTotal = state.articles.length;
  const today = todayKST();
  const yesterday = yesterdayKST();
  const todayCount = articles.filter((a) => a.day === today).length;
  const yesterdayCount = articles.filter((a) => a.day === yesterday).length;
  const pageUpdated = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="shell">
      <main className="page">
        <header className="hero">
          <div className="hero__brand">
            <span className="hero__mark" aria-hidden>
              CJ
            </span>
            <div className="hero__titles">
              <p className="hero__eyebrow">News Monitor</p>
              <h1 className="hero__title">뉴스 알림</h1>
            </div>
          </div>

          <p className="hero__desc">
            당일·어제 기사를 중복 없이 모읍니다. 최신순으로 정렬되며, 수집·알림은
            GitHub Actions와 새로고침으로 갱신됩니다.
          </p>

          <div className="stats" role="list">
            <div className="stat" role="listitem">
              <span className="stat__label">오늘</span>
              <span className="stat__value stat__value--today">
                {todayCount}
              </span>
              <span className="stat__unit">건</span>
            </div>
            <div className="stat" role="listitem">
              <span className="stat__label">어제</span>
              <span className="stat__value stat__value--yesterday">
                {yesterdayCount}
              </span>
              <span className="stat__unit">건</span>
            </div>
            <div className="stat" role="listitem">
              <span className="stat__label">합계</span>
              <span className="stat__value">{articles.length}</span>
              <span className="stat__unit">건</span>
            </div>
            <div className="stat stat--meta" role="listitem">
              <span className="stat__label">스케줄</span>
              <span className="stat__meta">10분 · Actions</span>
            </div>
          </div>

          <div className="hero__actions">
            <RefreshButton />
          </div>
        </header>

        <section className="feed" aria-labelledby="feed-heading">
          <div className="feed__head">
            <h2 id="feed-heading" className="feed__title">
              최신 기사
            </h2>
            <span className="feed__count">{articles.length}건 표시</span>
          </div>

          {articles.length === 0 ? (
            <div className="empty">
              <p className="empty__title">표시할 뉴스가 없습니다</p>
              <p className="empty__sub">
                {today} · {yesterday} 기준
              </p>
              <p className="empty__body">
                {!storageReady ? (
                  <>
                    Vercel Environment에 Upstash·텔레그램 변수를 설정하거나
                    GitHub Actions에서 CJ News Batch를 실행하세요.
                  </>
                ) : storedTotal > 0 ? (
                  <>
                    저장된 기사 {storedTotal}건이 있으나 당일·어제가 아니어서
                    숨겨졌습니다.
                  </>
                ) : (
                  <>
                    상단 <strong>새로고침</strong>으로 첫 수집을 시작할 수
                    있습니다.
                  </>
                )}
              </p>
            </div>
          ) : (
            <ol className="timeline">
              {articles.map((art, index) => (
                <li key={art.hash} className="timeline__item">
                  <div className="timeline__rail" aria-hidden>
                    <span className="timeline__dot" />
                    {index < articles.length - 1 ? (
                      <span className="timeline__line" />
                    ) : null}
                  </div>
                  <article
                    className={`card card--${
                      art.day === today ? "today" : "yesterday"
                    }`}
                  >
                    <header className="card__head">
                      <span
                        className={`day-chip ${
                          art.day === today ? "today" : "yesterday"
                        }`}
                      >
                        {formatDisplayDay(art.day)}
                      </span>
                      <time className="card__time" dateTime={art.addedAt}>
                        {new Intl.DateTimeFormat("ko-KR", {
                          timeZone: "Asia/Seoul",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(art.addedAt))}
                      </time>
                    </header>
                    <h3 className="card__title">
                      <a
                        href={art.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {art.title}
                      </a>
                    </h3>
                    <footer className="card__foot">
                      <span className="card__source">{art.source}</span>
                      <span className="card__rank">#{index + 1}</span>
                    </footer>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="site-footer">
          <span>v{APP_VERSION}</span>
          <span className="site-footer__dot" aria-hidden>
            ·
          </span>
          <span>페이지 갱신 {pageUpdated}</span>
        </footer>
      </main>
    </div>
  );
}
