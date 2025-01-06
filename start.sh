#!/bin/bash

# Создаем сеть если её нет
docker network create openwebui-network 2>/dev/null || true

# Запускаем контейнеры
docker-compose up -d

# Проверяем статус
echo "Checking containers..."
docker-compose ps

echo "Checking network..."
docker network inspect openwebui-network

echo "PWA client available at: http://localhost:3001"
echo "Open WebUI available at: http://localhost:8080" 