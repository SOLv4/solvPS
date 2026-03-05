#!/bin/bash
set -euo pipefail

APP_DIR="/home/ubuntu/app"
BACKUP_DIR="/home/ubuntu/.deploy_backup"
BACKUP_ENV_PATH="${BACKUP_DIR}/.env"
STATIC_ENV_PATH="/home/ubuntu/config/solvps.env"
LOG_DIR="/home/ubuntu/.deploy_logs"
LOG_FILE="${LOG_DIR}/deploy.log"
ERR_LOG_FILE="${LOG_DIR}/deploy_err.log"

safe_log() {
  echo "$1" >> "${LOG_FILE}" 2>/dev/null || true
}

safe_err() {
  echo "$1" >> "${ERR_LOG_FILE}" 2>/dev/null || true
}

mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"

if [ -f "${APP_DIR}/.env" ]; then
  cp "${APP_DIR}/.env" "${BACKUP_ENV_PATH}"
  safe_log ">>> .env 백업 완료: ${BACKUP_ENV_PATH}"
elif [ -f "${STATIC_ENV_PATH}" ]; then
  cp "${STATIC_ENV_PATH}" "${BACKUP_ENV_PATH}"
  safe_log ">>> 고정 env로 백업 시드 생성: ${STATIC_ENV_PATH} -> ${BACKUP_ENV_PATH}"
elif [ -f "${BACKUP_ENV_PATH}" ]; then
  safe_log ">>> 기존 .env 백업 유지: ${BACKUP_ENV_PATH}"
else
  safe_err ">>> ERROR: 백업 가능한 .env가 없습니다. (${APP_DIR}/.env, ${STATIC_ENV_PATH})"
  exit 1
fi
