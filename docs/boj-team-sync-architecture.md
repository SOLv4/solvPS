# BOJ Team Sync 아키텍처 및 기술 선택 문서

## 1. 배경
우리 서비스의 목표는 팀원들이 같은 문제를 어떻게 풀었는지 코드 단위로 비교하고 학습 기록을 축적하는 것이다.  
이를 위해서는 백준 제출 코드와 제출 메타데이터(문제 번호, 제출 번호, 언어, 결과 등)를 팀 플랫폼으로 자동 동기화해야 한다.

핵심 제약은 데이터가 생성되는 위치다.


1. 제출 코드는 사용자의 브라우저(백준 submit 페이지)에서 입력된다.
2. 채점 상태 변화(`pending -> accepted`)는 백준 status 페이지 DOM에서 실시간으로 반영된다.
3. 제출 상세 소스(`/source/{submissionId}`)도 사용자 세션 컨텍스트에서 접근하는 것이 가장 안정적이다.

따라서 서버 단독 방식이 아니라, 사용자 브라우저 내부에서 동작하는 수집 계층이 필요했고 Chrome Extension을 채택했다.

## 2. 왜 Chrome Extension이 필요했는가
Chrome Extension은 백준 페이지에 content script를 주입해 DOM 이벤트와 상태 변화를 직접 감지할 수 있다.  
이 구조로 아래 요구사항을 만족한다.

1. 제출 버튼 클릭 시점의 코드 원문 확보
2. status 페이지에서 정답 판정 시점 감지
3. 제출 ID 기반 소스 복구 fallback
4. 사용자 세션 기반 동작(별도 계정 위임/쿠키 수집 불필요)

정리하면 확장은 선택 기능이 아니라, 외부 플랫폼(백준)과 내부 플랫폼(우리 서비스)을 연결하는 수집 브리지다.

## 3. 크롤링과의 차이 및 한계

### 3.1 크롤링(서버 주도) 방식
장점

1. 서버에서 중앙 제어 가능
2. 배포 구조가 단순해 보일 수 있음

한계

1. 사용자별 백준 인증 세션을 서버가 다루어야 함
2. 제출 직후 실시간 감지가 어려움
3. 제출 순간 코드 원문 확보가 불안정함
4. 봇 차단/요율 제한/정책 이슈 리스크 존재
5. 운영 복잡도와 보안 책임 증가

### 3.2 확장(클라이언트 주도) 방식
장점

1. 사용자의 실제 브라우저 세션에서 즉시 감지 가능
2. submit/status DOM 기반으로 정확한 이벤트 추적 가능
3. 팀 플랫폼으로 필요한 데이터만 즉시 전송 가능

비교 결론  
본 프로젝트 요구사항(정확한 코드 원문 + 제출 타이밍 + 팀별 자동 동기화)에서는 확장 기반 접근이 실무적으로 더 적합하다.

## 4. 사용 기술

1. Chrome Extension Manifest V3
2. content script (`extension/boj-team-sync/content.js`)
3. background service worker (`extension/boj-team-sync/background.js`)
4. Chrome Storage (`chrome.storage.local`, `chrome.storage.sync`)
5. Next.js API Route
6. JWT 스타일 연동 토큰(HS256 서명 검증)
7. Drizzle ORM + PostgreSQL

## 5. 데이터 플로우(요약)

```text
[Group Page]
  - Team ID 노출
  - Integration Token 발급
         |
         v
[Extension Options]
  - apiBaseUrl / apiToken / teamId / memberHandle 저장
         |
         v
[BOJ submit page - content script]
  - 코드/언어/문제번호 임시 캐시
         |
         v
[BOJ status page - content script]
  - 최신 제출 상태 polling
  - accepted 확인
  - payload 생성
  - sendMessage(UPLOAD_ACCEPTED_SUBMISSION)
         |
         v
[Extension background]
  - 설정 검증(teamId 숫자 등)
  - POST /api/integrations/boj/submissions (Bearer token)
         |
         v
[Next API]
  - 토큰 검증
  - 팀 멤버십 검증
  - integration_submissions upsert
         |
         v
[Group/Compare UI]
  - GET /api/integrations/boj/submissions
  - 문제별/팀원별 코드 비교 렌더링
```

## 6. 실제 코드 기준 핵심 포인트

### 6.1 토큰 발급/검증
1. 발급 API: `src/app/api/integrations/token/route.ts`
2. 서명/검증 로직: `src/lib/integration/token.ts`
3. secret: `INTEGRATION_TOKEN_SECRET` (서버 전용)

### 6.2 확장 수집 로직
1. submit 시 코드 임시 저장: `extension/boj-team-sync/content.js`
2. status polling 및 accepted 판정: `extension/boj-team-sync/content.js`
3. background 메시지 전송: `extension/boj-team-sync/content.js`

### 6.3 업로드/저장 로직
1. background 업로드: `extension/boj-team-sync/background.js`
2. 업로드 수신 API: `src/app/api/integrations/boj/submissions/route.ts`
3. DB upsert 기준: `team_id + submission_id`

## 7. 신뢰성/운영 고려사항

1. 중복 업로드 방지
- `LAST_UPLOADED_KEY`로 동일 submissionId 중복 전송 차단

2. 실패 재시도 폭주 방지
- `LAST_FAILED_KEY`로 동일 실패 submissionId 반복 전송 제한

3. stale pending 대응
- 문제 번호 불일치 시 pending 캐시 제거 후 fallback 경로 사용

4. 입력 검증 강화
- 확장 옵션에서 Team ID 숫자 검증
- background 업로드 직전 Team ID 검증
- 서버에서 최종 Team ID 유효성 검증

5. 권한 최소화
- 백준 host 권한 중심
- API 도메인 권한은 옵션 저장 시 요청(선택 권한)

## 8. 보안 모델

1. 확장은 사용자 세션 컨텍스트에서만 백준 DOM/소스에 접근한다.
2. 서버 API는 Bearer 토큰 서명 검증과 만료 검증을 수행한다.
3. 서버는 팀 멤버십 검증 후에만 데이터 저장을 허용한다.
4. secret은 서버에만 저장하며 확장/클라이언트로 노출하지 않는다.

## 9. 현재 아키텍처 결론
현재 구조는 다음 역할 분리로 안정성을 확보한다.

1. 확장(content/background): 수집 및 전송
2. 서버(API + DB): 인증, 권한 검증, 저장
3. 웹 앱(그룹/비교 UI): 조회, 시각화, 협업 경험 제공

이 분리는 외부 플랫폼 의존 환경에서 데이터 수집 정확도와 운영 통제성을 동시에 만족시키는 현실적인 설계다.
