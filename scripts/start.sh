#!/bin/bash
set -e
cd /home/site/wwwroot

echo "=== OGADE startup ==="

# Oryx extracts node_modules.tar.gz to /node_modules and adds
# /node_modules/.bin to PATH. We work WITH Oryx, not against it.

# Clean up Oryx leftovers (old real node_modules backup)
rm -rf _del_node_modules

# Verify prisma is available (should be in /node_modules/.bin via PATH)
echo "Checking prisma..."
which prisma && echo "prisma found at: $(which prisma)" || {
  echo "FATAL: prisma not found in PATH"
  echo "PATH=$PATH"
  ls -la /node_modules/.bin/prisma 2>/dev/null || echo "/node_modules/.bin/prisma does not exist"
  exit 1
}

# Run Prisma migrations
echo "Running Prisma migrations..."
prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
echo "Starting NestJS on port ${PORT:-8080}..."
exec node apps/api/dist/main.js
