#!/bin/bash
set -euo pipefail

LOG_DIR="/home/ubuntu/.deploy_logs"
LOG_FILE="${LOG_DIR}/deploy.log"
ERR_LOG_FILE="${LOG_DIR}/deploy_err.log"

mkdir -p "${LOG_DIR}"

log() {
  echo "$1" >> "${LOG_FILE}" 2>/dev/null || true
}

log_err() {
  echo "$1" >> "${ERR_LOG_FILE}" 2>/dev/null || true
}

log ">>> 배포 시작"

cd /home/ubuntu/app

if [ ! -f /home/ubuntu/app/.env ]; then
  log_err ">>> ERROR: /home/ubuntu/app/.env 파일이 없습니다. 배포 중단"
  exit 1
fi

log ">>> 의존성 설치"
npm install >> "${LOG_FILE}" 2>> "${ERR_LOG_FILE}"

log ">>> 빌드"
npm run build >> "${LOG_FILE}" 2>> "${ERR_LOG_FILE}"

log ">>> 현재 실행중인 애플리케이션 종료"
pm2 delete solvps 2>/dev/null || true

log ">>> 애플리케이션 실행"
pm2 start npm --name solvps -- start >> "${LOG_FILE}" 2>> "${ERR_LOG_FILE}"
pm2 save >> "${LOG_FILE}" 2>> "${ERR_LOG_FILE}"

log ">>> 배포 완료"
