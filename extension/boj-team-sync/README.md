# BOJ Team Sync Extension (MVP)

백준(BOJ) 제출을 팀 플랫폼으로 동기화하기 위한 Chrome Extension 초안입니다.

## 동작 방식

1. `/submit/{problemId}` 페이지에서 제출 시점에 코드/언어/문제번호를 로컬에 임시 저장합니다.
2. `/status` 페이지에서 최신 제출이 `맞았습니다`인지 확인합니다.
3. 정답이면 background service worker가 팀 플랫폼 API로 업로드합니다.

## 설치

1. Chrome에서 `chrome://extensions` 열기
2. 우측 상단 `개발자 모드` 활성화
3. `압축해제된 확장 프로그램을 로드합니다` 클릭
4. 이 폴더(`extension/boj-team-sync`) 선택

## 설정

확장 옵션 페이지에서 아래 값 입력:

- `apiBaseUrl`: 예) `http://localhost:3000`
- `apiToken`: 플랫폼 인증 토큰(Bearer)
- `teamId`: 팀 식별자
- `memberHandle`: BOJ 핸들

## 기대 API 스펙 (MVP)

`POST /api/integrations/boj/submissions`

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

Body:

```json
{
  "sourcePlatform": "baekjoon",
  "teamId": "team-1",
  "memberHandle": "han97901",
  "submissionId": "123456789",
  "problemId": "1000",
  "language": "Python 3",
  "sourceCode": "print(1)",
  "runtimeMs": 56,
  "memoryKb": 2024,
  "submittedAt": "2026-03-04 12:34:56",
  "result": "accepted"
}
```

## 주의

- 현재 구현은 백준 DOM 구조에 의존합니다.
- 백준 페이지 마크업이 변경되면 파싱 로직을 업데이트해야 합니다.
- 실제 운영 전 이용약관/보안/개인정보 동의 정책 검토가 필요합니다.
