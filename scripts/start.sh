#!/bin/bash
set -e
cd /home/site/wwwroot

echo "=== OGADE startup ==="

# Verify prisma CLI exists
if [ ! -f node_modules/.bin/prisma ]; then
  echo "FATAL: node_modules/.bin/prisma not found"
  echo "Contents of wwwroot:"
  ls -la
  exit 1
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
echo "Starting NestJS on port ${PORT:-8080}..."
exec node apps/api/dist/main.js
