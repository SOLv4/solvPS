#!/bin/bash
set -euo pipefail

APP_DIR="/home/ubuntu/app"
BACKUP_DIR="/home/ubuntu/.deploy_backup"
BACKUP_ENV_PATH="${BACKUP_DIR}/.env"
LOG_DIR="/home/ubuntu/.deploy_logs"
LOG_FILE="${LOG_DIR}/deploy.log"

safe_log() {
  echo "$1" >> "${LOG_FILE}" 2>/dev/null || true
}

mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"

if [ -f "${APP_DIR}/.env" ]; then
  cp "${APP_DIR}/.env" "${BACKUP_ENV_PATH}"
  safe_log ">>> .env 백업 완료: ${BACKUP_ENV_PATH}"
else
  safe_log ">>> .env 백업 스킵: ${APP_DIR}/.env 파일 없음"
fi
