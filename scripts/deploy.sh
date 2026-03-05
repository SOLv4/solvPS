#!/bin/bash

echo ">>> 배포 시작" >> /home/ubuntu/deploy.log

cd /home/ubuntu/app

echo ">>> 의존성 설치" >> /home/ubuntu/deploy.log
npm install --production >> /home/ubuntu/deploy.log 2>> /home/ubuntu/deploy_err.log

echo ">>> 현재 실행중인 애플리케이션 종료" >> /home/ubuntu/deploy.log
sudo ps -ef | grep node | grep -v grep | awk '{print $2}' | xargs kill -15 2>/dev/null || true

echo ">>> 애플리케이션 실행" >> /home/ubuntu/deploy.log
nohup node app.js >> /home/ubuntu/deploy.log 2>> /home/ubuntu/deploy_err.log &

echo ">>> 배포 완료" >> /home/ubuntu/deploy.log