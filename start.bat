@echo off

REM Создаем сеть если её нет
docker network create openwebui-network 2>nul

REM Запускаем контейнеры
docker-compose up -d

REM Проверяем статус
echo Checking containers...
docker-compose ps

echo Checking network...
docker network inspect openwebui-network

echo PWA client available at: http://localhost:3001
echo Open WebUI available at: http://localhost:8080 