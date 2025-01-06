#!/bin/bash

echo "Checking environment..."

# Check Docker
if command -v docker &>/dev/null; then
    echo "✓ Docker installed"
else
    echo "✗ Docker not installed"
    exit 1
fi

# Check containers
echo "Checking containers..."
if docker ps -a | grep -q "open-webui "; then
    echo "✓ Open WebUI container exists"
else
    echo "✗ Open WebUI container missing"
fi

if docker ps -a | grep -q "open-webui-pwa"; then
    echo "✓ PWA client container exists"
else
    echo "✗ PWA client container missing"
fi

# Check ports
echo "Checking ports..."
if netstat -tuln | grep -q ":3000 "; then
    echo "✗ Port 3000 is already in use"
else
    echo "✓ Port 3000 available"
fi

if netstat -tuln | grep -q ":3001 "; then
    echo "✗ Port 3001 is already in use"
else
    echo "✓ Port 3001 available"
fi

# Check required files
files=(
    ".env"
    "docker-compose.yml"
    "Dockerfile"
    "public/index.html"
    "public/js/config.js"
)

echo "Checking files..."
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
    fi
done 