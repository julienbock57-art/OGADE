#!/bin/bash
set -e
cd /home/site/wwwroot

echo "=== OGADE startup ==="

# Undo Oryx's node_modules manipulation if it happened
if [ -L node_modules ] && [ -d _del_node_modules ]; then
  echo "Undoing Oryx: restoring real node_modules..."
  rm -f node_modules
  mv _del_node_modules node_modules
fi

# Delete stale Oryx files to prevent interference on next restart
rm -f node_modules.tar.gz oryx-manifest.toml 2>/dev/null || true
rm -rf _del_node_modules 2>/dev/null || true

# Fix .bin symlinks broken by ZIP extraction
if [ -f node_modules/.bin/prisma ] && [ ! -L node_modules/.bin/prisma ]; then
  echo "Fixing broken prisma symlink..."
  rm -f node_modules/.bin/prisma
  ln -s ../prisma/build/index.js node_modules/.bin/prisma
fi

# Verify prisma works
if [ ! -f node_modules/prisma/build/index.js ]; then
  echo "FATAL: node_modules/prisma/build/index.js not found"
  ls -la node_modules/prisma/build/ 2>/dev/null || echo "prisma/build/ missing"
  exit 1
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
node node_modules/prisma/build/index.js migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
echo "Starting NestJS on port ${PORT:-8080}..."
exec node apps/api/dist/main.js
