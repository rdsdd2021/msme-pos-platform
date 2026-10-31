#!/bin/bash
set -e

echo "=== MSME POS Platform - Development Setup ==="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js 20+ is required. Aborting."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm 9+ is required. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Aborting."; exit 1; }
command -v flutter >/dev/null 2>&1 || echo "Flutter not found. Mobile development will not be available."

echo "[1/5] Installing Node.js dependencies..."
pnpm install

echo "[2/5] Copying environment files..."
cp apps/backend/.env.example apps/backend/.env 2>/dev/null || true
cp apps/web/.env.example apps/web/.env.local 2>/dev/null || true

echo "[3/5] Starting Docker services..."
cd infra/docker && docker compose up -d postgres
cd ../..

echo "[4/5] Waiting for PostgreSQL to be ready..."
sleep 5

echo "[5/5] Running database migrations..."
pnpm db:migrate || echo "No migrations to run yet."

echo ""
echo "=== Setup complete ==="
echo ""
echo "Start all services:"
echo "  docker compose -f infra/docker/docker-compose.yml up"
echo ""
echo "Or start services individually:"
echo "  Terminal 1: pnpm --filter backend start:dev"
echo "  Terminal 2: pnpm --filter web dev"
echo ""
echo "Available endpoints:"
echo "  Backend API:  http://localhost:3001/api/v1/health"
echo "  Swagger UI:   http://localhost:3001/api/docs"
echo "  Web app:      http://localhost:3000"

