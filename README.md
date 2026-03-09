# solvPS

solved.ac 데이터 기반 알고리즘 약점 분석 및 Claude AI 문제 추천 플랫폼

## 주요 기능

- **AI 약점 분석**: Claude AI가 solved.ac 데이터를 분석해 취약 알고리즘 태그를 진단하고 맞춤 문제를 추천
- **라이벌 비교**: 두 유저의 태그별 풀이 통계를 시각적으로 비교
- **팀 협업**: 초대 코드 기반 팀 생성, 멤버 순위 및 주간 활동 스트릭 확인
- **로드맵**: 단계별 학습 경로 생성 및 팀 공유, 진행률 추적
- **코드 비교**: 같은 문제를 풀이한 팀 멤버들의 코드 비교 및 AI 리뷰
- **BOJ 자동 동기화**: Chrome Extension으로 백준 정답 제출을 자동으로 플랫폼에 동기화

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16, React 19, TypeScript |
| 스타일링 | Tailwind CSS v4, shadcn/ui, Framer Motion |
| 데이터베이스 | PostgreSQL, Drizzle ORM |
| AI | Anthropic Claude API (claude-haiku-4-5-20251001) |
| 인증 | Better Auth |
| 외부 API | solved.ac API v3 |
| 확장 프로그램 | Chrome Extension Manifest V3 |

## 시작하기

### 사전 요구사항

- Node.js 20+
- PostgreSQL 데이터베이스
- Anthropic API 키

### 설치

```bash
npm install
cp .env.example .env
```

### 환경 변수

`.env` 파일에 다음 값을 설정하세요.

```env
DATABASE_URL=postgresql://user:password@host:port/database
ANTHROPIC_API_KEY=sk-ant-...
INTEGRATION_TOKEN_SECRET=your-secret-key
BETTER_AUTH_URL=https://your-domain.com
BETTER_AUTH_SECRET=your-better-auth-secret
```

### 데이터베이스 마이그레이션

```bash
npm run db:generate
npm run db:migrate
```

### 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 프로젝트 구조

```
solvPS/
├── src/
│   ├── app/
│   │   ├── (auth)/           # 로그인, 회원가입
│   │   ├── (dashboard)/      # 메인 대시보드, 개인 통계/분석
│   │   ├── (group)/          # 팀 목록, 팀 상세
│   │   ├── (problems)/       # 문제 검색, 코드 비교
│   │   ├── (roadmaps)/       # 로드맵 목록, 상세
│   │   └── api/              # API 라우트
│   ├── components/
│   │   ├── ui/               # shadcn/ui 공통 컴포넌트
│   │   ├── status/           # 통계 시각화 (레이더 차트, 히스토그램 등)
│   │   ├── group/            # 팀 관련 컴포넌트
│   │   └── dashboard/        # 사이드바
│   └── lib/
│       ├── db/               # Drizzle ORM 설정 및 스키마
│       ├── status/           # solved.ac API 래퍼, Claude Tool Use
│       ├── auth/             # Better Auth 설정
│       └── integration/      # Integration 토큰 관리
└── extension/
    └── boj-team-sync/        # Chrome Extension
```

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/status/analyze` | Claude AI 분석 (SSE 스트리밍) |
| `GET` | `/api/status/rival` | 라이벌 비교 |
| `GET/POST` | `/api/group` | 팀 목록 조회/생성 |
| `POST` | `/api/group/join` | 초대 코드로 팀 참가 |
| `GET` | `/api/group/[id]` | 팀 상세 정보 |
| `GET` | `/api/group/[id]/weekly-activity` | 주간 활동 스트릭 |
| `GET/POST` | `/api/roadmaps` | 로드맵 관리 |
| `GET` | `/api/problems/search` | 문제 검색 |
| `POST` | `/api/problems/compare/review` | 코드 AI 리뷰 |
| `POST` | `/api/integrations/boj/submissions` | BOJ 제출 동기화 |
| `GET/POST` | `/api/integrations/token` | Integration 토큰 관리 |

## Chrome Extension (BOJ Team Sync)

백준 온라인 저지에서 정답 제출 시 자동으로 플랫폼에 동기화하는 Chrome Extension입니다.

### 설치

1. `extension/boj-team-sync` 폴더를 Chrome 확장 프로그램 개발자 모드로 로드
2. 확장 프로그램 옵션에서 아래 값 설정:
   - **API Base URL**: 플랫폼 서버 주소 (예: `https://your-domain.com`)
   - **API Token**: `/api/integrations/token`에서 발급받은 토큰
   - **Team ID**: 동기화할 팀 ID
   - **BOJ Handle**: 자신의 백준 핸들

### 동작 방식

1. 백준 제출 페이지(`/submit`)에서 코드와 언어를 캡처하여 임시 저장
2. `/status` 페이지에서 채점 결과를 1.2초마다 폴링
3. "맞았습니다" 판정 시 `POST /api/integrations/boj/submissions`로 업로드
4. Background Service Worker가 CORS 우회 후 서버로 전송

## 데이터베이스 스키마

주요 테이블:

- `users`, `userBoj` - 사용자 및 BOJ 핸들 매핑
- `teams`, `teamMembers` - 팀 및 멤버 관리 (OWNER/ADMIN/MEMBER 권한)
- `problems`, `tags`, `problemTags` - 문제 및 태그 캐시
- `userSolvedStatuses` - 사용자별 풀이 상태
- `roadmaps`, `roadmapSteps`, `roadmapProblems`, `teamRoadmaps` - 로드맵 구조
- `userRoadmapProgresses` - 로드맵 진행률
- `integrationSubmissions` - BOJ 제출 이력
- `analysisReports` - Claude 분석 결과 저장

## 배포

AWS CodeDeploy를 사용합니다. `appspec.yml` 및 `scripts/` 참고.

```bash
npm run build
npm run start
```
