# Vercel / GitHub 환경 변수 설정

Vercel과 GitHub Actions, 로컬 모두 **Environment Variables / `.env.local`** 만 사용합니다.

---

## Vercel (필수)

**Project → Settings → Environment Variables**  
Production · Preview · Development 모두에 동일하게 넣는 것을 권장합니다.

| 변수명 | 필수 | 설명 | 값 가져오는 곳 |
|--------|------|------|----------------|
| `TELEGRAM_BOT_TOKEN` | ✅ | 텔레그램 봇 토큰 | [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | ✅ | 알림 받을 채팅 ID | 봇과 대화 후 `getUpdates` 등 |
| `UPSTASH_REDIS_REST_URL` | ✅ | Redis REST URL | [Upstash Console](https://console.upstash.com) → DB → REST |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Redis REST 토큰 | 동일 |
| `CRON_SECRET` | 권장 | `/api/cron` 호출 비밀번호 | 임의 긴 문자열 (32자 이상) |
| `NEWS_KEYWORDS` | 선택 | 검색 키워드(OR) | 기본 `CJ`. **쉼표로 구분** — 키워드마다 Google·네이버를 각각 검색 후 합침 |

### Vercel에 넣을 때 체크리스트

1. 텔레그램·Upstash 값을 위 변수에 붙여넣기
2. 저장 후 **Deployments → Redeploy** (환경 변수는 재배포 후 반영)
3. `https://<도메인>/api/test-telegram` 으로 텔레그램 테스트
4. `https://<도메인>/api/status` 에서 `redisConfigured: true` 확인

---

## GitHub Actions (매시 정각 배치, 필수)

**Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret 이름 | 필수 | 설명 |
|-------------|------|------|
| `UPSTASH_REDIS_REST_URL` | ✅ | Vercel과 **동일**한 Upstash URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Vercel과 **동일**한 토큰 |

Actions에서도 텔레그램을 쓰려면 아래 Secrets를 추가합니다.

| Secret 이름 | 필수 | 설명 |
|-------------|------|------|
| `TELEGRAM_BOT_TOKEN` | ✅ (Actions에서 TG 전송 시) | Vercel과 동일 |
| `TELEGRAM_CHAT_ID` | ✅ | Vercel과 동일 |

> 워크플로 `news-batch.yml`은 checkout 후 `npm run batch:once`를 실행합니다.  
> 위 Secrets가 없으면 배치가 실패합니다.

---

## 로컬 개발

```bash
copy .env.example .env.local
# .env.local 편집 후
npm run dev
npm run batch:once
```

---

## 변수별 예시 형식 (값은 본인 것으로 교체)

```
TELEGRAM_BOT_TOKEN=123456789:AAxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=1061163641
UPSTASH_REDIS_REST_URL=https://xxxx-xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxxxxxxxxxxxxx
CRON_SECRET=your-random-long-secret-here
NEWS_KEYWORDS=CJ,롯데
```

### 다중 키워드 (OR 검색)

`CJ,롯데` 처럼 **쉼표(,)** 로 나눕니다. 띄어쓰기는 자동 제거됩니다.

- `CJ` 로 검색한 기사 **+** `롯데` 로 검색한 기사를 **합칩니다**
- **「CJ 롯데」가 한 제목에 같이 있는 기사만** 찾는 방식이 **아닙니다**
- 같은 기사(제목·URL 동일)는 hash로 **한 번만** 저장됩니다

예: Vercel / GitHub Actions 모두  
`NEWS_KEYWORDS=CJ,롯데,삼성`

`GITHUB_TOKEN`은 Vercel에서 Redis만 쓸 때 **불필요**합니다.
