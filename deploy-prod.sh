#!/usr/bin/env bash
set -e

echo "============================================="
echo "  Assistt POS Production Deploy & Restart    "
echo "============================================="

# Clean up any lingering dev containers
echo "[1/4] Stopping any dev containers..."
docker compose down --remove-orphans 2>/dev/null || true

# Stop existing prod containers
echo "[2/4] Stopping existing production containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans

# Build and start prod containers
echo "[3/4] Building and launching production containers..."
docker compose -f docker-compose.prod.yml up -d --build

# Verify status
echo "[4/4] Checking production services..."
sleep 3
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Deployment Complete ==="
echo "To tail backend logs: docker compose -f docker-compose.prod.yml logs -f backend"
