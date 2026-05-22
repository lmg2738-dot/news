export type Sentiment = "positive" | "negative" | "neutral";

const POSITIVE_KEYWORDS = [
  "성장",
  "호조",
  "확대",
  "증가",
  "상승",
  "흑자",
  "수상",
  "선정",
  "혁신",
  "출시",
  "개업",
  "연다",
  "공략",
  "성공",
  "최고",
  "호평",
  "기대",
  "수주",
  "계약",
  "투자",
  "확장",
  "론칭",
  "개선",
  "회복",
  "반등",
  "수익",
  "달성",
  "우수",
  "강세",
  "긍정",
  "전파",
  "제공",
  "개발",
  "출범",
  "인수",
  "협력",
  "MOU",
  "체결",
];

const NEGATIVE_KEYWORDS = [
  "유출",
  "감소",
  "하락",
  "적자",
  "논란",
  "의혹",
  "수사",
  "피해",
  "축소",
  "손실",
  "비판",
  "구속",
  "기소",
  "파산",
  "폐쇄",
  "취소",
  "중단",
  "리콜",
  "사고",
  "위기",
  "우려",
  "부진",
  "악화",
  "분쟁",
  "소송",
  "제재",
  "징계",
  "해고",
  "파업",
  "불법",
  "혐의",
  "피의",
  "고발",
  "무차별",
  "침해",
  "횡령",
  "배임",
  "사기",
  "폭로",
  "항의",
  "거부",
  "실패",
  "쇠퇴",
  "적발",
  "제재",
];

const POSITIVE_PHRASES = ["미식 경험", "K-푸드", "신규 매장", "호실적"];
const NEGATIVE_PHRASES = [
  "개인정보 유출",
  "정보 유출",
  "경찰 수사",
  "검찰 수사",
  "리콜",
  "악재",
];

function scoreText(text: string): { pos: number; neg: number } {
  const t = text.toLowerCase();
  let pos = 0;
  let neg = 0;

  for (const p of POSITIVE_PHRASES) {
    if (t.includes(p.toLowerCase())) pos += 2;
  }
  for (const p of NEGATIVE_PHRASES) {
    if (t.includes(p.toLowerCase())) neg += 3;
  }
  for (const w of POSITIVE_KEYWORDS) {
    if (t.includes(w)) pos += 1;
  }
  for (const w of NEGATIVE_KEYWORDS) {
    if (t.includes(w)) neg += 1;
  }

  return { pos, neg };
}

/** 제목 키워드 기반 감성 (규칙 기반, AI 아님) */
export function analyzeSentiment(title: string): Sentiment {
  const { pos, neg } = scoreText(title);
  if (neg > pos && neg >= 1) return "negative";
  if (pos > neg && pos >= 1) return "positive";
  return "neutral";
}

export function sentimentLabel(s: Sentiment): string {
  switch (s) {
    case "positive":
      return "긍정";
    case "negative":
      return "부정";
    default:
      return "중립";
  }
}

export type SentimentCounts = {
  positive: number;
  negative: number;
  neutral: number;
};

export function countSentiments(
  items: { title: string }[]
): SentimentCounts {
  const counts: SentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  for (const item of items) {
    counts[analyzeSentiment(item.title)] += 1;
  }
  return counts;
}
