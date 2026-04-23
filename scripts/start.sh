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

if [ ! -f node_modules/.bin/prisma ]; then
  echo "FATAL: node_modules/.bin/prisma not found. Ensure SCM_DO_BUILD_DURING_DEPLOYMENT=false is set."
  ls -la node_modules/.bin/ 2>/dev/null || echo "node_modules/.bin/ does not exist"
  exit 1
fi

# Run Prisma migrations
./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Start the app
exec node apps/api/dist/main.js
