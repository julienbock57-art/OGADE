#!/bin/bash
set -e
cd /home/site/wwwroot

echo "=== OGADE startup ==="

# Clean any stale Oryx artifacts to prevent future interference
rm -f node_modules.tar.gz oryx-manifest.toml
rm -rf _del_node_modules

# Restore node_modules if Oryx replaced it with a symlink
if [ -L node_modules ]; then
  echo "Removing Oryx symlink..."
  rm -f node_modules
fi

# Verify prisma CLI exists
if [ ! -f node_modules/.bin/prisma ]; then
  echo "FATAL: node_modules/.bin/prisma not found"
  echo "Contents of wwwroot:"
  ls -la
  echo "node_modules/.bin contents:"
  ls node_modules/.bin/ 2>/dev/null | head -20 || echo "directory missing"
  exit 1
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
echo "Starting NestJS on port ${PORT:-8080}..."
exec node apps/api/dist/main.js
