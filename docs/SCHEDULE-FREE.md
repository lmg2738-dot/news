# 무료 자동 배치 (Vercel Cron 없이)

Vercel **Cron Jobs는 유료 플랜** 기능입니다. 이 프로젝트는 **GitHub Actions** 스케줄을 사용합니다.

## 1) GitHub Actions (권장)

워크플로: [`.github/workflows/news-batch.yml`](../.github/workflows/news-batch.yml)

| 항목 | 내용 |
|------|------|
| 주기 | **매시 정각** — `0 * * * *` (UTC 0분) = **KST 매시 00분** |
| 동작 | `npm run batch:once` → Upstash Redis + 텔레그램(미전송 최대 20건) |
| 비용 | GitHub Actions 무료 한도 내 |

### KST 정각 예시

| UTC | KST |
|-----|-----|
| 00:00 | 09:00 |
| 01:00 | 10:00 |
| 15:00 | 00:00 (자정) |

### 최초 1회 확인 (필수)

1. GitHub 저장소 → **Actions** → **CJ News Batch (hourly)**
2. **「Scheduled workflows are disabled」** → **Enable**
3. **Run workflow** 수동 실행 → 초록 체크, Summary에 `telegram_sent` 확인
4. **Secrets** 4개 설정 (`docs/VERCEL-ENV.md` 참고)
5. 이후 **매시 정각(KST)** 에 Run이 생기는지 확인

### Run이 없을 때

- 저장소 60일 비활성 → 스케줄 비활성화
- Secrets 누락 → Verify secrets 단계에서 빨간 X
- `main` 브랜치가 아닌 경우 스케줄 미동작

---

## 2) 웹 탭 1시간 자동 (보조)

페이지 **새로고침** 버튼 컴포넌트가 탭이 **열려 있을 때만** 1시간마다 `/api/status?run=1` 호출.

- PC에서 사이트를 닫으면 동작 안 함
- 24시간 무인 수집은 **GitHub Actions** 사용

---

## 3) 백업: cron-job.org

GitHub Actions가 막혔을 때 Vercel `/api/cron` HTTP 호출. `docs/VERCEL-ENV.md`의 `CRON_SECRET` 참고.

---

## 텔레그램이 안 올 때

| 상황 | 의미 |
|------|------|
| Actions Run 없음 | 스케줄 비활성 → Enable |
| Run 성공, `telegram_sent: 0` | 새 기사 없음 또는 이미 전송됨 |
| Run 실패, Secrets 오류 | GitHub Secrets 4개 추가 |
