#!/bin/sh
# Block until MySQL accepts connections, run pending migrations, then exec
# the Next.js server. MySQL's healthcheck in docker-compose already gates
# `depends_on`, but a TCP wait here keeps the image safe to use outside compose.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set — refusing to start." >&2
  exit 1
fi

# Parse host:port out of mysql://user:pass@host:port/db so we can poll it.
db_host=$(printf '%s' "$DATABASE_URL" | sed -n 's#.*@\([^:/]*\).*#\1#p')
db_port=$(printf '%s' "$DATABASE_URL" | sed -n 's#.*@[^:]*:\([0-9]*\).*#\1#p')
db_port=${db_port:-3306}

echo "Waiting for MySQL at $db_host:$db_port ..."
for i in $(seq 1 60); do
  if nc -z "$db_host" "$db_port" 2>/dev/null; then
    echo "MySQL is up."
    break
  fi
  sleep 1
  if [ "$i" = "60" ]; then
    echo "MySQL never came online — aborting." >&2
    exit 1
  fi
done

echo "Applying database migrations ..."
# Call the Prisma CLI's JS entry directly — the standalone bundle doesn't ship
# node_modules/.bin symlinks, so `npx prisma` would fail to resolve.
node node_modules/prisma/build/index.js migrate deploy

echo "Starting Next.js ..."
exec "$@"
