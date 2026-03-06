# Production 배포 장애 기록 및 해결 런북 (2026-03-05 ~ 2026-03-06)

이 문서는 `production` 브랜치 배포 과정에서 실제 발생한 장애를 시간순으로 기록하고,
각 장애의 원인/해결/재발 방지 방법을 남긴 운영 문서다.

## 1) 장애 요약

### 증상
- `https://www.fromisus.store` 접속 시 `500 Internal Server Error`
- 클라이언트 콘솔:
  - `Application error: a server-side exception has occurred...`
  - `Digest: 1923974184`
  - `POST http://localhost:3000/api/auth/sign-in/email net::ERR_CONNECTION_REFUSED`
  - `INVALID_ORIGIN` (403)
- CodeDeploy 단계별 실패:
  - `BeforeInstall` 실패 (`backup_env.sh`)
  - `AfterInstall` 실패 (`restore_env.sh`)
  - `ApplicationStart` 실패 (`deploy.sh`)

### 핵심 원인(최종)
1. 인증 환경변수 누락/불일치
   - `BETTER_AUTH_SECRET` 누락
   - `NEXT_PUBLIC_BETTER_AUTH_URL` 누락
   - `trustedOrigins` 미설정
2. 배포 구조상 `.env`가 덮어쓰기/소실됨
   - CodeDeploy `overwrite: yes`
   - (초기) CI에서 `.env`를 매번 생성/덮어씀
3. 배포 스크립트 로깅/복원 설계 부족
   - `runas: ubuntu`인데 로그 파일 권한 문제
   - 백업 시드 없는 상태에서 restore 수행
4. `.env` 값 자체 오류
   - URL 자리에 `...` 같은 placeholder가 남아 `Invalid URL` 발생

---

## 2) 실제 발생 에러와 진단

### A. 서버 500 + digest `1923974184`
#### 로그
`pm2 logs solvps` / `~/.pm2/logs/solvps-error.log`:
- `BetterAuthError: You are using the default secret. Please set BETTER_AUTH_SECRET...`

#### 원인
- 서버 실행 환경에서 `BETTER_AUTH_SECRET` 미주입.

#### 해결
- `/home/ubuntu/app/.env`에 `BETTER_AUTH_SECRET` 추가.
- PM2 재시작:
  - `pm2 delete solvps`
  - `pm2 start npm --name solvps -- start`

---

### B. 로그인 시 `POST http://localhost:3000/...` 실패
#### 로그
- 브라우저 콘솔:
  - `POST http://localhost:3000/api/auth/sign-in/email net::ERR_CONNECTION_REFUSED`

#### 원인
- 클라이언트 auth base URL은 `NEXT_PUBLIC_BETTER_AUTH_URL`을 사용.
- 서버 `.env`에 해당 값이 없어 fallback(`http://localhost:3000`)으로 요청.

#### 해결
- `.env`에 추가:
  - `NEXT_PUBLIC_BETTER_AUTH_URL=https://www.fromisus.store`
- `NEXT_PUBLIC_*`는 빌드 타임 주입이므로 반드시 재빌드 후 재시작:
  - `npm run build`
  - `pm2 delete solvps && pm2 start npm --name solvps -- start`

---

### C. 로그인 시 `INVALID_ORIGIN` 403
#### 로그
- 브라우저 응답:
  - `{ code: "INVALID_ORIGIN", status: 403 }`

#### 원인
- Better Auth 서버 origin 검증 목록에 실제 도메인이 누락.

#### 해결
- `src/lib/auth/index.ts`에 `trustedOrigins` 추가:
  - `https://www.fromisus.store`
  - `https://fromisus.store`

---

### D. GitHub Actions 배포 후 `.env`가 사라짐/비어짐
#### 진단 포인트
- `deploy.yml`에 `.env` 생성 단계가 있었음:
  - `echo "${{ secrets.ENV }}" > ./.env`
- CodeDeploy가 `/home/ubuntu/app`에 `overwrite: yes`로 전체 덮어씀.

#### 원인
- CI 생성 `.env`가 빈값이거나, 배포 번들 기준으로 앱 디렉토리가 매번 교체되어 EC2 수동 `.env`가 유지되지 않음.

#### 해결(적용됨)
1. `.github/workflows/deploy.yml`
   - `pull_request` 트리거 제거
   - `.env` 생성 단계 제거
   - zip 생성 시 `.env`, `.env.*` 제외
2. `appspec.yml`
   - `BeforeInstall`/`AfterInstall` 훅 추가
3. 스크립트 추가
   - `scripts/backup_env.sh`
   - `scripts/restore_env.sh`

---

### E. `backup_env.sh` Permission denied
#### 로그
- `/opt/codedeploy-agent/.../backup_env.sh: /home/ubuntu/deploy.log: Permission denied`

#### 원인
- `runas: ubuntu`인데 `/home/ubuntu/deploy.log` 파일 권한 충돌.

#### 해결(적용됨)
- 로그 위치를 `/home/ubuntu/.deploy_logs/*`로 이동.
- 로깅 실패가 전체 실패로 번지지 않도록 `safe_log` 처리.

---

### F. `restore_env.sh` 실패 (AfterInstall)
#### 로그
- `백업된 .env가 없습니다 (/home/ubuntu/.deploy_backup/.env)`

#### 원인
- 초기 1회는 백업 시드가 없는데 restore를 시도함.

#### 해결(적용됨)
- `backup_env.sh` 로직 강화:
  1. `/home/ubuntu/app/.env` 있으면 백업
  2. 없으면 `/home/ubuntu/config/solvps.env`를 시드로 백업
  3. 둘 다 없으면 명시적으로 실패

---

### G. `deploy.sh` 실패 (ApplicationStart) + `Invalid URL`
#### 로그
- `TypeError: Invalid URL`
- `Failed to collect page data for /api/group/[id]/roadmap-problems`

#### 원인
- `.env` 복원은 되었지만, URL 계열 값에 placeholder(`...`) 또는 형식 오류가 남아 빌드 실패.

#### 해결
- `/home/ubuntu/config/solvps.env`, `/home/ubuntu/.deploy_backup/.env`, `/home/ubuntu/app/.env`의 값 동기화.
- `DATABASE_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`를 실제 유효 값으로 교체.

---

## 3) 최종 적용된 배포 구조

### GitHub Actions
- 파일: `.github/workflows/deploy.yml`
- 동작:
  - `production` push 시 배포
  - `.env` 파일은 아티팩트에 포함하지 않음

### CodeDeploy
- 파일: `appspec.yml`
- 훅 순서:
  1. `BeforeInstall` -> `scripts/backup_env.sh`
  2. `AfterInstall` -> `scripts/restore_env.sh`
  3. `ApplicationStart` -> `scripts/deploy.sh`

### 서버 측 영구 환경변수 시드
- 권장 경로: `/home/ubuntu/config/solvps.env`
- 백업 경로: `/home/ubuntu/.deploy_backup/.env`
- 런타임 경로: `/home/ubuntu/app/.env`

---

## 4) 운영 체크리스트 (배포 전/후)

### 배포 전 1회 세팅
```bash
sudo mkdir -p /home/ubuntu/config /home/ubuntu/.deploy_backup /home/ubuntu/.deploy_logs
sudo chown -R ubuntu:ubuntu /home/ubuntu/config /home/ubuntu/.deploy_backup /home/ubuntu/.deploy_logs /home/ubuntu/app
```

`/home/ubuntu/config/solvps.env` 필수 키:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=https://www.fromisus.store`
- `NEXT_PUBLIC_BETTER_AUTH_URL=https://www.fromisus.store`
- `INTEGRATION_TOKEN_SECRET`
- `ANTHROPIC_API_KEY` (사용 시)

시드 복사:
```bash
cp /home/ubuntu/config/solvps.env /home/ubuntu/.deploy_backup/.env
cp /home/ubuntu/config/solvps.env /home/ubuntu/app/.env
chmod 600 /home/ubuntu/config/solvps.env /home/ubuntu/.deploy_backup/.env /home/ubuntu/app/.env
```

### 배포 실패 시 즉시 확인
```bash
tail -n 200 /home/ubuntu/.deploy_logs/deploy_err.log
tail -n 200 /home/ubuntu/.deploy_logs/deploy.log
sudo tail -n 200 /opt/codedeploy-agent/deployment-root/deployment-logs/codedeploy-agent-deployments.log
pm2 logs solvps --lines 120
```

### URL 유효성 빠른 점검
```bash
grep -nE '^(DATABASE_URL|BETTER_AUTH_URL|NEXT_PUBLIC_BETTER_AUTH_URL)=' /home/ubuntu/config/solvps.env
```

---

## 5) 재발 방지 원칙

1. `.env`는 GitHub 아티팩트로 배포하지 않는다.
2. 런타임 시크릿은 EC2 고정 경로(`/home/ubuntu/config/solvps.env`)를 단일 진실원으로 관리한다.
3. CodeDeploy 훅에서 `.env` 백업/복원을 자동화한다.
4. `NEXT_PUBLIC_*` 변경 시 반드시 재빌드한다.
5. 배포 실패 로그는 `/home/ubuntu/.deploy_logs`와 CodeDeploy agent 로그를 우선 확인한다.
