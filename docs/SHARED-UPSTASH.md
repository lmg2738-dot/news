# Upstash 1개 DB — 프로젝트 여러 개 나누기

Upstash 무료/요금제로 DB를 하나만 쓸 때, **Redis 키 + JSON 안의 `instanceId`** 로 구분합니다.

## 이 프로젝트 (CJ)

환경 변수 **안 넣어도** 기본값으로 동작합니다.

| 변수 | 기본값 | Redis 키 |
|------|--------|----------|
| `REDIS_INSTANCE_ID` | `cj` | `cj-news:state` |

Vercel / GitHub Actions에 **추가 설정 불필요** (기존 `cj-news:state` 데이터 그대로 사용).

선택적으로 명시:

```env
REDIS_INSTANCE_ID=cj
```

## 다른 프로젝트 (복사본)

**같은** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 을 쓰고, 아래만 **다르게**:

```env
REDIS_INSTANCE_ID=lotte
NEWS_KEYWORDS=롯데,롯데그룹
TELEGRAM_BOT_TOKEN=...다른봇...
TELEGRAM_CHAT_ID=...다른채팅...
```

→ Redis 키: `lotte-news:state` (CJ와 **완전 분리**)

| REDIS_INSTANCE_ID | Redis 키 |
|-------------------|----------|
| `cj` | `cj-news:state` |
| `lotte` | `lotte-news:state` |
| `samsung` | `samsung-news:state` |

## 키를 직접 지정 (고급)

```env
REDIS_STATE_KEY=my-custom-key
```

`REDIS_INSTANCE_ID` 보다 **우선**합니다.

## JSON 안 `instanceId` (이중 안전장치)

저장 데이터 예:

```json
{
  "instanceId": "cj",
  "sent": { ... },
  "articles": [ ... ]
}
```

다른 프로젝트가 **실수로 같은 키**를 써도, `instanceId`가 다르면 **읽지 않고 빈 상태**로 시작합니다.

## 확인

배포 후:

```
GET /api/status
```

응답 예:

```json
{
  "redisInstanceId": "cj",
  "redisStateKey": "cj-news:state",
  ...
}
```

## 주의

- Upstash **URL/TOKEN** 은 공유 가능, **키(instance)** 는 프로젝트마다 다르게
- 텔레그램 봇·채팅, `NEWS_KEYWORDS` 도 프로젝트마다 분리
