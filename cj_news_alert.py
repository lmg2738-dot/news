import feedparser
import json
import hashlib
import time
import logging
import re
import sys
import urllib.request
import urllib.parse
import urllib.error
import ssl
from datetime import datetime, timedelta
from pathlib import Path
from html.parser import HTMLParser

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
SENT_FILE = DATA_DIR / "sent_articles.json"
CONFIG_FILE = BASE_DIR / "config.json"
LOG_FILE = BASE_DIR / "data" / "cj_news_alert.log"

GOOGLE_NEWS_RSS = (
    "https://news.google.com/rss/search?"
    "q={query}&hl=ko&gl=KR&ceid=KR:ko"
)
NAVER_NEWS_URL = (
    "https://search.naver.com/search.naver?"
    "where=news&query={query}&sort=1&pd=4"
)

KEYWORDS = ["CJ"]
CHECK_INTERVAL_SECONDS = 600  # 10분
MAX_SENT_HISTORY = 5000
MAX_ARTICLE_AGE_HOURS = 48
MAX_NEW_PER_CYCLE = 20

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)

try:
    import certifi
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE


class NaverNewsParser(HTMLParser):
    """네이버 뉴스 검색 결과에서 기사 제목·링크·출처를 추출하는 파서."""

    def __init__(self):
        super().__init__()
        self.articles: list[dict] = []
        self._in_news_tit = False
        self._current: dict = {}

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        cls = attr_dict.get("class", "")
        if tag == "a" and "news_tit" in cls:
            self._in_news_tit = True
            self._current = {
                "title": "",
                "link": attr_dict.get("href", ""),
                "source": "네이버뉴스",
                "published": "",
            }
        elif tag == "a" and "info press" in cls and self._current:
            pass

    def handle_data(self, data):
        if self._in_news_tit:
            self._current["title"] += data

    def handle_endtag(self, tag):
        if tag == "a" and self._in_news_tit:
            self._in_news_tit = False
            if self._current.get("title") and self._current.get("link"):
                self.articles.append(self._current)
            self._current = {}


def setup_logging():
    DATA_DIR.mkdir(exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(LOG_FILE, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )


def load_config() -> dict:
    if not CONFIG_FILE.exists():
        logging.error(
            "config.json이 없습니다. config.json.example을 참고해 생성하세요."
        )
        sys.exit(1)
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    if not cfg.get("telegram_bot_token") or not cfg.get("telegram_chat_id"):
        logging.error(
            "config.json에 telegram_bot_token과 telegram_chat_id를 입력하세요."
        )
        sys.exit(1)
    return cfg


def load_sent() -> dict:
    if SENT_FILE.exists():
        with open(SENT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_sent(sent: dict):
    if len(sent) > MAX_SENT_HISTORY:
        cutoff = datetime.now() - timedelta(hours=MAX_ARTICLE_AGE_HOURS * 2)
        sent = {
            k: v for k, v in sent.items()
            if datetime.fromisoformat(v) > cutoff
        }
    DATA_DIR.mkdir(exist_ok=True)
    with open(SENT_FILE, "w", encoding="utf-8") as f:
        json.dump(sent, f, ensure_ascii=False, indent=2)


def article_hash(title: str, link: str) -> str:
    raw = f"{title.strip()}|{link.strip()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def http_get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as resp:
        return resp.read().decode("utf-8", errors="replace")


def fetch_google_news(keyword: str) -> list[dict]:
    articles = []
    url = GOOGLE_NEWS_RSS.format(query=urllib.parse.quote(keyword))
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries:
            articles.append({
                "title": entry.get("title", "").strip(),
                "link": entry.get("link", "").strip(),
                "source": entry.get("source", {}).get("title", "Google News"),
                "published": entry.get("published", ""),
            })
    except Exception as e:
        logging.warning(f"Google News RSS 파싱 실패: {e}")
    return articles


def fetch_naver_news(keyword: str) -> list[dict]:
    url = NAVER_NEWS_URL.format(query=urllib.parse.quote(keyword))
    try:
        html = http_get(url)
        parser = NaverNewsParser()
        parser.feed(html)
        return parser.articles
    except Exception as e:
        logging.warning(f"네이버 뉴스 스크래핑 실패: {e}")
    return []


def collect_articles(keywords: list[str]) -> list[dict]:
    all_articles = []
    seen_hashes = set()
    for kw in keywords:
        for fetcher in [fetch_google_news, fetch_naver_news]:
            for art in fetcher(kw):
                h = article_hash(art["title"], art["link"])
                if h not in seen_hashes:
                    seen_hashes.add(h)
                    art["hash"] = h
                    all_articles.append(art)
    return all_articles


def _send_telegram_urllib(bot_token: str, chat_id: str, message: str) -> bool:
    """urllib 기반 전송 (일반 네트워크에서 사용)."""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = json.dumps({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    }).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as resp:
        return resp.status == 200


def _send_telegram_raw_socket(bot_token: str, chat_id: str, message: str) -> bool:
    """raw socket + TLS 직접 연결 (urllib 실패 시 폴백)."""
    import socket
    payload = json.dumps({
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": False,
    }).encode("utf-8")

    host = "api.telegram.org"
    path = f"/bot{bot_token}/sendMessage"

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    for proto in (ssl.TLSVersion.TLSv1_3, ssl.TLSVersion.TLSv1_2):
        try:
            ctx.minimum_version = proto
            ctx.maximum_version = proto
            raw = socket.create_connection((host, 443), timeout=15)
            sock = ctx.wrap_socket(raw, server_hostname=host)
            break
        except Exception:
            continue
    else:
        return False

    try:
        request_line = f"POST {path} HTTP/1.0\r\n"
        headers = (
            f"Host: {host}\r\n"
            f"Content-Type: application/json\r\n"
            f"Content-Length: {len(payload)}\r\n"
            f"Connection: close\r\n"
            f"\r\n"
        )
        sock.sendall((request_line + headers).encode("utf-8") + payload)

        response = b""
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            response += chunk
        status_line = response.split(b"\r\n", 1)[0].decode()
        return " 200 " in status_line
    finally:
        sock.close()


def send_telegram(bot_token: str, chat_id: str, message: str) -> bool:
    for method_name, method_fn in [
        ("urllib", _send_telegram_urllib),
        ("raw_socket", _send_telegram_raw_socket),
    ]:
        try:
            if method_fn(bot_token, chat_id, message):
                return True
            logging.warning(f"텔레그램 전송 실패 ({method_name})")
        except Exception as e:
            logging.debug(f"텔레그램 {method_name} 실패: {e}")
    logging.warning("텔레그램 전송: 모든 방법 실패")
    return False


def send_toast(title: str, body: str, link: str = "") -> bool:
    """Windows 10/11 토스트 알림 전송."""
    try:
        from winotify import Notification
        toast = Notification(
            app_id="CJ 뉴스 알림",
            title=title,
            msg=body,
            duration="long",
        )
        if link:
            toast.add_actions(label="기사 보기", launch=link)
        toast.show()
        return True
    except Exception as e:
        logging.warning(f"토스트 알림 실패: {e}")
        return False


def format_message(article: dict) -> str:
    title = article["title"]
    link = article["link"]
    source = article["source"]
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    return (
        f"\U0001f4f0 <b>CJ 뉴스 알림</b>\n\n"
        f"<b>{title}</b>\n"
        f"출처: {source}\n"
        f'<a href="{link}">기사 보기</a>\n\n'
        f"\U0001f550 {now}"
    )


def run_once(config: dict, sent: dict) -> dict:
    articles = collect_articles(KEYWORDS)
    new_count = 0
    for art in articles:
        if new_count >= MAX_NEW_PER_CYCLE:
            break
        h = art["hash"]
        if h in sent:
            continue

        msg = format_message(art)
        ok = send_telegram(
            config["telegram_bot_token"],
            config["telegram_chat_id"],
            msg,
        )
        if not ok:
            send_toast(
                title=f"CJ 뉴스: {art['source']}",
                body=art["title"],
                link=art["link"],
            )

        sent[h] = datetime.now().isoformat()
        new_count += 1
        time.sleep(1)

    if new_count > 0:
        logging.info(f"새 기사 {new_count}건 처리 완료")
        save_sent(sent)
    else:
        logging.info("새 기사 없음")
    return sent


def main():
    setup_logging()
    logging.info("=== CJ 뉴스 알림 서비스 시작 ===")
    config = load_config()
    sent = load_sent()

    logging.info(
        f"텔레그램 chat_id: {config['telegram_chat_id']} | "
        f"키워드: {KEYWORDS} | 주기: {CHECK_INTERVAL_SECONDS}초"
    )

    while True:
        try:
            sent = run_once(config, sent)
        except Exception as e:
            logging.error(f"실행 중 오류: {e}", exc_info=True)
        logging.info(f"다음 확인까지 {CHECK_INTERVAL_SECONDS}초 대기...")
        time.sleep(CHECK_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
