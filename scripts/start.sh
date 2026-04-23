#!/bin/bash
set -e
cd /home/site/wwwroot

echo "=== OGADE startup ==="
echo "Listing wwwroot:"
ls -la

# If Oryx moved our node_modules to _del_node_modules, restore it
if [ -d _del_node_modules ]; then
  echo "Restoring node_modules from Oryx backup..."
  rm -rf node_modules
  mv _del_node_modules node_modules
fi

# If Oryx replaced node_modules with a symlink, remove it
if [ -L node_modules ]; then
  echo "Removing Oryx symlink for node_modules..."
  rm -f node_modules
fi

echo "node_modules status:"
ls -la node_modules/.bin/prisma 2>/dev/null && echo "prisma found" || echo "prisma NOT found"

if [ ! -f node_modules/.bin/prisma ]; then
  echo "FATAL: prisma binary missing after all restore attempts."
  echo "Contents of wwwroot:"
  ls -la
  echo "Contents of node_modules (if any):"
  ls node_modules/ 2>/dev/null | head -20
  exit 1
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
echo "Starting NestJS..."
exec node apps/api/dist/main.js
