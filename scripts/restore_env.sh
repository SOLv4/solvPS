#!/bin/bash
set -euo pipefail

APP_DIR="/home/ubuntu/app"
BACKUP_ENV_PATH="/home/ubuntu/.deploy_backup/.env"
TARGET_ENV_PATH="${APP_DIR}/.env"
LOG_FILE="/home/ubuntu/deploy.log"
ERR_LOG_FILE="/home/ubuntu/deploy_err.log"

if [ -f "${BACKUP_ENV_PATH}" ]; then
  cp "${BACKUP_ENV_PATH}" "${TARGET_ENV_PATH}"
  echo ">>> .env 복원 완료: ${TARGET_ENV_PATH}" >> "${LOG_FILE}"
else
  echo ">>> ERROR: 백업된 .env가 없습니다 (${BACKUP_ENV_PATH})" >> "${ERR_LOG_FILE}"
  exit 1
fi
