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
import { countSentiments, analyzeSentiment } from "@/lib/sentiment";
import { APP_VERSION } from "@/lib/version";
import { RefreshButton } from "./components/RefreshButton";
import { SentimentBadge, SentimentStatIcon } from "./components/SentimentBadge";

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
  const sentimentCounts = countSentiments(articles);
  const pageUpdated = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="shell">
      <main className="page">
        <header className="hero panel">
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
            GitHub Actions(매시 정각)와 새로고침(탭 열림 시 1시간)으로 갱신됩니다.
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
              <span className="stat__meta">1시간 · Actions</span>
            </div>
          </div>

          <div className="stats stats--sentiment" role="list">
            <div className="stat stat--positive" role="listitem">
              <span className="stat__label">
                <SentimentStatIcon sentiment="positive" />
                긍정
              </span>
              <span className="stat__value stat__value--positive">
                {sentimentCounts.positive}
              </span>
              <span className="stat__unit">건</span>
            </div>
            <div className="stat stat--negative" role="listitem">
              <span className="stat__label">
                <SentimentStatIcon sentiment="negative" />
                부정
              </span>
              <span className="stat__value stat__value--negative">
                {sentimentCounts.negative}
              </span>
              <span className="stat__unit">건</span>
            </div>
            <div className="stat stat--neutral" role="listitem">
              <span className="stat__label">
                <SentimentStatIcon sentiment="neutral" />
                중립
              </span>
              <span className="stat__value stat__value--neutral">
                {sentimentCounts.neutral}
              </span>
              <span className="stat__unit">건</span>
            </div>
          </div>
          <p className="sentiment-note">
            제목 키워드 기준 자동 분류 (AI 아님)
          </p>

          <div className="hero__actions">
            <RefreshButton />
          </div>
        </header>

        <section className="feed panel" aria-labelledby="feed-heading">
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
              {articles.map((art, index) => {
                const sentiment = analyzeSentiment(art.title);
                return (
                <li key={art.hash} className="timeline__item">
                  <article
                    className={`card card--${
                      art.day === today ? "today" : "yesterday"
                    } card--sentiment-${sentiment}`}
                  >
                    <header className="card__head">
                      <div className="card__tags">
                        <span
                          className={`day-chip ${
                            art.day === today ? "today" : "yesterday"
                          }`}
                        >
                          {formatDisplayDay(art.day)}
                        </span>
                        <SentimentBadge sentiment={sentiment} />
                      </div>
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
              );
              })}
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
