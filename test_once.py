"""1건만 수집해서 텔레그램 + 토스트 테스트."""
from cj_news_alert import (
    load_config, collect_articles, send_telegram,
    format_message, send_toast, setup_logging, KEYWORDS,
)

setup_logging()
config = load_config()
articles = collect_articles(KEYWORDS)
print(f"수집된 기사 수: {len(articles)}")

if articles:
    art = articles[0]
    print(f"기사: {art['title'][:60]}")

    msg = format_message(art)
    tg_ok = send_telegram(config["telegram_bot_token"], config["telegram_chat_id"], msg)
    print(f"텔레그램: {'성공' if tg_ok else '실패'}")

    if not tg_ok:
        toast_ok = send_toast(
            title=f"CJ 뉴스: {art['source']}",
            body=art["title"],
            link=art["link"],
        )
        print(f"토스트 알림: {'성공' if toast_ok else '실패'}")
else:
    print("기사를 찾지 못했습니다")
