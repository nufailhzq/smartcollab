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

PRISMA="node node_modules/prisma/build/index.js"

echo "Applying database migrations ..."
# Call the Prisma CLI's JS entry directly — the standalone bundle doesn't ship
# node_modules/.bin symlinks, so `npx prisma` would fail to resolve.
#
# Self-heal for P3009: if a migration is recorded as failed but its DDL actually
# ran (e.g. a migration file that once had trailing junk after valid CREATEs, so
# the tables already exist yet Prisma marked the migration failed), a plain
# `migrate deploy` crash-loops forever. Here we detect the failed migration,
# mark it resolved (--applied, since the objects exist), then retry once.
run_migrations() {
  set +e
  out=$($PRISMA migrate deploy 2>&1)
  code=$?
  printf '%s\n' "$out"
  set -e

  if [ "$code" -eq 0 ]; then
    return 0
  fi

  # P3009 = "migrate found failed migrations". Auto-resolve + retry once.
  if printf '%s' "$out" | grep -q "P3009"; then
    failed=$(printf '%s' "$out" | sed -n "s/.*\`\([0-9][0-9_a-zA-Z]*\)\` migration.*/\1/p" | head -n1)
    if [ -n "$failed" ]; then
      echo "Detected failed migration '$failed' — marking it applied and retrying ..."
      $PRISMA migrate resolve --applied "$failed" || true
      $PRISMA migrate deploy
      return $?
    fi
  fi

  echo "Migration failed and could not be auto-resolved." >&2
  return "$code"
}

run_migrations

echo "Starting Next.js ..."
exec "$@"
