#!/bin/bash
set -e
cd /home/site/wwwroot

# If Oryx moved our node_modules, restore it
if [ -d _del_node_modules ]; then
  rm -rf node_modules
  mv _del_node_modules node_modules
fi

# If Oryx replaced node_modules with a symlink, remove it
if [ -L node_modules ]; then
  rm -f node_modules
fi

# Clean Oryx artifacts
rm -f node_modules.tar.gz oryx-manifest.toml

# Install dependencies if node_modules is missing or incomplete
if [ ! -f node_modules/.bin/prisma ]; then
  echo "node_modules missing or incomplete — installing dependencies..."
  npm install --omit=dev
  echo "Generating Prisma client..."
  npx prisma generate --schema=apps/api/prisma/schema.prisma
  # Copy shared package into node_modules
  mkdir -p node_modules/@ogade/shared
  cp -r packages/shared/dist node_modules/@ogade/shared/
  cp packages/shared/package.json node_modules/@ogade/shared/
  echo "Dependencies installed."
fi

# Run Prisma migrations
./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
exec node apps/api/dist/main.js
