# 두 번째 프로젝트 만들기 (CJ와 분리)

같은 코드로 **다른 키워드 + 다른 텔레그램 + 다른 Redis 키**를 쓰는 방법입니다.

---

## 1. GitHub에 빈 저장소 생성

1. GitHub → **New repository**
2. 이름 예: `news-lotte`, `news-monitor-2`
3. **README / .gitignore 추가 안 함** (빈 repo)

---

## 2-A. 폴더 복사 후 새 repo에 올리기 (권장)

PowerShell:

```powershell
# 1) 프로젝트 복사
Copy-Item -Recurse "C:\Users\lmg2738\NEW" "C:\Users\lmg2738\NEW-LOTTE"

cd C:\Users\lmg2738\NEW-LOTTE

# 2) 기존 git 연결 제거 후 새로 초기화
Remove-Item -Recurse -Force .git
git init
git add .
git commit -m "init: 롯데 뉴스 알림 인스턴스"

# 3) 새 GitHub repo 연결 (URL은 본인 repo로 교체)
git remote add origin https://github.com/본인아이디/news-lotte.git
git branch -M main
git push -u origin main
```

또는 스크립트:

```powershell
cd C:\Users\lmg2738\NEW
.\scripts\setup-new-git.ps1 -TargetDir "C:\Users\lmg2738\NEW-LOTTE" -RemoteUrl "https://github.com/본인아이디/news-lotte.git"
```

---

## 2-B. 같은 폴더에서 remote만 바꾸기 (비권장)

CJ용 `origin`을 잃으므로, **복사본 폴더**를 쓰는 편이 안전합니다.

---

## 3. 인스턴스별 환경 변수 (필수)

**CJ 프로젝트와 반드시 다르게** 설정하세요.

| 변수 | CJ 예시 | 새 인스턴스 예시 |
|------|---------|------------------|
| `APP_TITLE` | `CJ 뉴스 알림` | `롯데 뉴스 알림` |
| `APP_BRAND_MARK` | `CJ` | `LT` |
| `NEWS_KEYWORDS` | `CJ` | `롯데,롯데그룹` |
| `TELEGRAM_BOT_TOKEN` | CJ 봇 | **다른 봇** |
| `TELEGRAM_CHAT_ID` | CJ 채팅 | **다른 채팅** |
| `REDIS_STATE_KEY` | `cj-news:state` | `lotte-news:state` |
| `UPSTASH_REDIS_REST_URL` | 동일 DB 가능 | 동일 또는 **새 DB** |
| `UPSTASH_REDIS_REST_TOKEN` | | |
| `GITHUB_REPOSITORY` | `lmg2738-dot/news` | `본인/news-lotte` |
| `APP_URL` | CJ Vercel URL | 새 Vercel URL |

### Redis 주의

- **같은 Upstash DB**를 쓸 때: `REDIS_STATE_KEY`만 다르게 (CJ 데이터와 섞이지 않음)
- **완전 분리**하려면 Upstash에서 DB를 하나 더 만들고 URL/TOKEN도 분리

---

## 4. Vercel 새 프로젝트

1. Vercel → **Add New Project** → 새 GitHub repo Import
2. **Environment Variables**에 위 값 전부 입력
3. Deploy

---

## 5. GitHub Actions Secrets (새 repo)

새 저장소 → **Settings → Secrets → Actions**

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

**Variables** (선택):

- `NEWS_KEYWORDS` = `롯데,롯데그룹`

Actions → **CJ News Batch (hourly)** → Enable scheduled workflows → Run workflow 테스트

---

## 6. 로컬 `.env.local` 예시 (롯데)

```env
APP_TITLE=롯데 뉴스 알림
APP_BRAND_MARK=LT
NEWS_KEYWORDS=롯데,롯데그룹
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
REDIS_STATE_KEY=lotte-news:state
GITHUB_REPOSITORY=본인아이디/news-lotte
```

```powershell
copy .env.example .env.local
# 편집 후
npm run dev
npm run batch:once
```

---

## 체크리스트

- [ ] 새 GitHub repo에 push 완료
- [ ] Vercel 새 프로젝트 + env
- [ ] 텔레그램 **다른 봇/채팅** 확인
- [ ] `REDIS_STATE_KEY` CJ와 다름
- [ ] Actions 수동 Run 성공
- [ ] `/api/test-telegram` 성공
