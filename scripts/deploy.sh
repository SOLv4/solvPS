#!/bin/bash

echo ">>> 배포 시작" >> /home/ubuntu/deploy.log

cd /home/ubuntu/app

echo ">>> 의존성 설치" >> /home/ubuntu/deploy.log
npm install >> /home/ubuntu/deploy.log 2>> /home/ubuntu/deploy_err.log

echo ">>> 빌드" >> /home/ubuntu/deploy.log
npm run build >> /home/ubuntu/deploy.log 2>> /home/ubuntu/deploy_err.log

echo ">>> 현재 실행중인 애플리케이션 종료" >> /home/ubuntu/deploy.log
pm2 delete solvps 2>/dev/null || true

echo ">>> 애플리케이션 실행" >> /home/ubuntu/deploy.log
pm2 start npm --name solvps -- start >> /home/ubuntu/deploy.log 2>> /home/ubuntu/deploy_err.log
pm2 save >> /home/ubuntu/deploy.log

echo ">>> 배포 완료" >> /home/ubuntu/deploy.log