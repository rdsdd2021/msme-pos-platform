#!/bin/bash
# Validates required environment variables are set
set -e

ERRORS=0

check_var() {
  if [ -z "${!1}" ]; then
    echo "ERROR: $1 is not set"
    ERRORS=$((ERRORS+1))
  fi
}

check_var DATABASE_URL
check_var JWT_SECRET
check_var JWT_REFRESH_SECRET

if [ $ERRORS -gt 0 ]; then
  echo "$ERRORS required environment variable(s) missing."
  exit 1
fi

echo "All required environment variables are set."

