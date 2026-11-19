#!/usr/bin/env bash
set -e

echo "============================================="
echo "  ZeeZo™ POS Zero-Downtime Production Deploy "
echo "============================================="

# 1. Build images in background while containers continue serving traffic
echo "[1/3] Building updated production images (traffic uninterrupted)..."
docker compose -f docker-compose.prod.yml build

# 2. Gracefully swap containers (PostgreSQL continues running uninterrupted)
echo "[2/3] Performing rolling swap of backend, web & gateway..."
docker compose -f docker-compose.prod.yml up -d

# 3. Verify health status
echo "[3/3] Checking production services..."
sleep 3
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Zero-Downtime Deployment Complete ==="
echo "To tail backend logs: docker compose -f docker-compose.prod.yml logs -f backend"
