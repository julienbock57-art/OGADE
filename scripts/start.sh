#!/bin/bash
set -e
cd /home/site/wwwroot

echo "=== OGADE startup ==="

# Oryx's startup script finds a stale node_modules.tar.gz, extracts
# broken modules to /node_modules, moves our real node_modules to
# _del_node_modules, and creates a symlink. Undo all of that.
if [ -L node_modules ] && [ -d _del_node_modules ]; then
  echo "Undoing Oryx: restoring real node_modules..."
  rm -f node_modules
  mv _del_node_modules node_modules
fi

# Delete stale Oryx files so this doesn't happen on next restart
rm -f node_modules.tar.gz oryx-manifest.toml 2>/dev/null || true
rm -rf _del_node_modules 2>/dev/null || true

# Verify prisma CLI exists
if [ ! -f node_modules/.bin/prisma ]; then
  echo "FATAL: node_modules/.bin/prisma not found"
  echo "Contents of wwwroot:"
  ls -la
  echo "node_modules/.bin/ contents:"
  ls node_modules/.bin/ 2>/dev/null | head -20 || echo "directory missing"
  exit 1
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
echo "Starting NestJS on port ${PORT:-8080}..."
exec node apps/api/dist/main.js
