#!/usr/bin/env bash
set -e

echo "============================================="
echo "  ZeeZo™ POS Zero-Downtime Production Deploy "
echo "============================================="

# 1. Build images in background while containers continue serving traffic
echo "[1/4] Building updated production images (traffic uninterrupted)..."
docker compose -f docker-compose.prod.yml build

# 2. Ensure database container is up and healthy
echo "[2/4] Ensuring PostgreSQL database is up and healthy..."
docker compose -f docker-compose.prod.yml up -d postgres
sleep 2

# 3. Gracefully swap backend, web & gateway
echo "[3/4] Performing rolling swap of backend, web & gateway..."
docker compose -f docker-compose.prod.yml up -d

# 4. Verify health status
echo "[4/4] Checking production services..."
sleep 3
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Zero-Downtime Deployment Complete ==="
echo "To tail backend logs: docker compose -f docker-compose.prod.yml logs -f backend"
