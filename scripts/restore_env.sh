#!/bin/bash
set -euo pipefail

APP_DIR="/home/ubuntu/app"
BACKUP_ENV_PATH="/home/ubuntu/.deploy_backup/.env"
TARGET_ENV_PATH="${APP_DIR}/.env"
LOG_DIR="/home/ubuntu/.deploy_logs"
LOG_FILE="${LOG_DIR}/deploy.log"
ERR_LOG_FILE="${LOG_DIR}/deploy_err.log"

safe_log() {
  echo "$1" >> "${LOG_FILE}" 2>/dev/null || true
}

safe_err() {
  echo "$1" >> "${ERR_LOG_FILE}" 2>/dev/null || true
}

mkdir -p "${LOG_DIR}"

if [ -f "${BACKUP_ENV_PATH}" ]; then
  cp "${BACKUP_ENV_PATH}" "${TARGET_ENV_PATH}"
  safe_log ">>> .env 복원 완료: ${TARGET_ENV_PATH}"
else
  safe_err ">>> ERROR: 백업된 .env가 없습니다 (${BACKUP_ENV_PATH}). BeforeInstall 백업 단계 확인 필요"
  exit 1
fi
