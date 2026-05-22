import type { Sentiment } from "@/lib/sentiment";
import { sentimentLabel } from "@/lib/sentiment";

function SentimentIcon({ sentiment }: { sentiment: Sentiment }) {
  if (sentiment === "positive") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path
          d="M8 14s1.5 2 4 2 4-2 4-2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="9" cy="10" r="1.2" fill="currentColor" />
        <circle cx="15" cy="10" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  if (sentiment === "negative") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path
          d="M8 10s1.5 2 4 2 4-2 4-2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="9" cy="14" r="1.2" fill="currentColor" />
        <circle cx="15" cy="14" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M8 12h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span
      className={`sentiment sentiment--${sentiment}`}
      title={`감성: ${sentimentLabel(sentiment)} (제목 키워드 분석)`}
    >
      <SentimentIcon sentiment={sentiment} />
      <span className="sentiment__text">{sentimentLabel(sentiment)}</span>
    </span>
  );
}

export function SentimentStatIcon({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span className={`stat-sentiment-icon stat-sentiment-icon--${sentiment}`}>
      <SentimentIcon sentiment={sentiment} />
    </span>
  );
}
