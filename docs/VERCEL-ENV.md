# Vercel / GitHub 환경 변수 설정

`config.json`에 비밀번호·토큰을 넣지 마세요. **Git에 올라가면 유출**됩니다.  
Vercel과 GitHub Actions에는 아래 **Environment Variables / Secrets** 만 사용합니다.

로컬 개발은 `.env.local` (또는 gitignore된 `config.json`)을 씁니다.

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
| `NEWS_KEYWORDS` | 선택 | 검색 키워드 | 기본 `CJ` (쉼표로 여러 개) |

### Vercel에 넣을 때 체크리스트

1. 기존 `config.json`에 있던 값을 **복사해 위 변수에 붙여넣기**
2. 저장 후 **Deployments → Redeploy** (환경 변수는 재배포 후 반영)
3. `https://<도메인>/api/test-telegram` 으로 텔레그램 테스트
4. `https://<도메인>/api/status` 에서 `redisConfigured: true` 확인

---

## GitHub Actions (10분 배치, 필수)

**Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret 이름 | 필수 | 설명 |
|-------------|------|------|
| `UPSTASH_REDIS_REST_URL` | ✅ | Vercel과 **동일**한 Upstash URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Vercel과 **동일**한 토큰 |

텔레그램은 워크플로가 `config.json`을 읽지 않으므로, Actions에서도 텔레그램을 쓰려면 아래 Secrets를 추가합니다.

| Secret 이름 | 필수 | 설명 |
|-------------|------|------|
| `TELEGRAM_BOT_TOKEN` | ✅ (Actions에서 TG 전송 시) | Vercel과 동일 |
| `TELEGRAM_CHAT_ID` | ✅ | Vercel과 동일 |

> 워크플로 `news-batch.yml`은 checkout 후 `npm run batch:once`를 실행합니다.  
> 저장소에 `config.json`이 없으면 **반드시** 위 Secrets가 있어야 합니다.

---

## 로컬 개발

```bash
copy .env.example .env.local
# .env.local 편집 후
npm run dev
npm run batch:once
```

`config.json`은 **로컬에서만** 선택적으로 사용 가능합니다 (Vercel·Actions 빌드에서는 무시).

---

## Git에서 제거할 것

이미 커밋된 `config.json`이 있다면:

```bash
git rm --cached config.json
git commit -m "chore: config.json Git 추적 제거"
git push
```

이후 Upstash·텔레그램 토큰은 **Vercel/GitHub에서 로테이션(재발급)** 하는 것을 권장합니다.

---

## 변수별 예시 형식 (값은 본인 것으로 교체)

```
TELEGRAM_BOT_TOKEN=123456789:AAxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=1061163641
UPSTASH_REDIS_REST_URL=https://xxxx-xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxxxxxxxxxxxxx
CRON_SECRET=your-random-long-secret-here
NEWS_KEYWORDS=CJ
```

`GITHUB_TOKEN`은 Vercel에서 Redis만 쓸 때 **불필요**합니다.
