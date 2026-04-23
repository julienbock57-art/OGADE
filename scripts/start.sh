#!/bin/bash
set -e
cd /home/site/wwwroot

echo "=== OGADE startup ==="

# Undo Oryx's node_modules swap if it happened
if [ -L node_modules ] && [ -d _del_node_modules ]; then
  echo "Undoing Oryx: restoring real node_modules..."
  rm -f node_modules
  mv _del_node_modules node_modules
fi

# Delete stale Oryx files to prevent interference on next restart
rm -f node_modules.tar.gz oryx-manifest.toml 2>/dev/null || true
rm -rf _del_node_modules 2>/dev/null || true

# Run Prisma migrations using the .bin binary (wasm files copied alongside it in CI)
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
echo "Starting NestJS on port ${PORT:-8080}..."
exec node apps/api/dist/main.js
