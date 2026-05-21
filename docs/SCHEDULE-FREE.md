# 무료 10분 자동 배치 (Vercel Cron 없이)

Vercel **Cron Jobs는 유료 플랜** 기능입니다. 이 프로젝트는 아래 **무료** 방식만 사용합니다.

## 1) 기본: GitHub Actions (권장)

워크플로: [`.github/workflows/news-batch.yml`](../.github/workflows/news-batch.yml)

| 항목 | 내용 |
|------|------|
| 주기 | 10분 (`*/10 * * * *`, **UTC**) |
| 동작 | `npm run batch:once` → Upstash Redis 저장 + 텔레그램(회당 최대 5건) |
| 비용 | GitHub Actions 무료 한도 내 |

### 최초 1회 확인 (필수)

1. GitHub 저장소 → **Actions** → **CJ News Batch (10min)**
2. 상단에 **「Scheduled workflows are disabled」** 가 있으면 → **Enable**
3. **Run workflow** 로 수동 1회 실행 → 로그에 `텔레그램 5건` 등 확인
4. 이후 **10분마다** Run이 자동 생성되는지 확인 (KST로는 :00, :10, :20 … 근처)

### Secrets (필수)

`docs/VERCEL-ENV.md` 참고 — Actions에 Upstash·텔레그램 Secrets 설정 (config.json 미사용).

### 수동 실행만 알림이 올 때

- Actions 스케줄이 꺼져 있거나
- 저장소가 오래 비활성이라 스케줄이 중단된 경우

→ 위 **Enable** 후 20~30분 관찰 (브라우저에서 `/api/status?run=1` 반복 호출은 하지 마세요 — 그때마다 텔레그램 5건이 나갑니다).

---

## 2) 백업: cron-job.org (무료 HTTP 크론)

GitHub Actions가 막혔을 때 Vercel URL만 주기 호출합니다.

1. [cron-job.org](https://cron-job.org) 가입 (무료)
2. **Create cronjob**
   - URL: `https://news-iota-peach.vercel.app/api/cron`
   - Schedule: every 10 minutes
3. Vercel 환경 변수에 `CRON_SECRET` 설정 (임의 긴 문자열)
4. cron-job URL을 다음 중 하나로 설정:
   - Header: `Authorization: Bearer <CRON_SECRET>`
   - 또는 Query: `https://.../api/cron?secret=<CRON_SECRET>`

`CRON_SECRET`이 **없으면** 누구나 `/api/cron`을 호출할 수 있어 **반드시 설정**하세요.

---

## 3) 로컬 / 점검용 (자동 아님)

| 용도 | 명령/URL |
|------|----------|
| 상태만 | `GET /api/status` |
| 배치 1회 (수동) | `GET /api/status?run=1` 또는 `npm run batch:once` |
| Vercel 원격 1회 | `APP_URL=... CRON_SECRET=... npm run batch:remote` |

---

## 텔레그램이 안 올 때

| 상황 | 의미 |
|------|------|
| Actions Run 없음 | 스케줄 비활성 → Enable |
| Run 성공, 로그 `텔레그램 0건` | 새 기사 없음 또는 이미 `sent`에 있음 (정상) |
| Run 성공, `텔레그램 5건` | 정상, 텔레그램 앱에서 확인 |
| `/api/status?run=1`만 알림 | 자동 스케줄 미동작 → 1번·2번 점검 |
