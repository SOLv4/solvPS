#!/bin/bash
set -euo pipefail

APP_DIR="/home/ubuntu/app"
BACKUP_DIR="/home/ubuntu/.deploy_backup"
BACKUP_ENV_PATH="${BACKUP_DIR}/.env"
LOG_FILE="/home/ubuntu/deploy.log"

mkdir -p "${BACKUP_DIR}"

if [ -f "${APP_DIR}/.env" ]; then
  cp "${APP_DIR}/.env" "${BACKUP_ENV_PATH}"
  echo ">>> .env 백업 완료: ${BACKUP_ENV_PATH}" >> "${LOG_FILE}"
else
  echo ">>> .env 백업 스킵: ${APP_DIR}/.env 파일 없음" >> "${LOG_FILE}"
fi
