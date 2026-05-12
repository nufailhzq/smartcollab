# Migration — legacy `ukm_lms` → new UKMFolio (Prisma)

This document covers lifting data from the legacy XAMPP MySQL database (in `../smartcollab/`,
schema in `database.sql`) into the new Prisma-managed `ukm_lms_new` database.

## Prerequisites

- Both databases reachable from the machine running the migration script.
- The new schema has been migrated (`pnpm db:migrate`) — empty target tables.
- A backup of the legacy DB exists (`mysqldump ukm_lms > backup.sql`).

## Field mapping

The Prisma schema uses `@map("fld_*")` on every column to match legacy names. The mapping is 1:1
for the core entities:

| Legacy table         | Prisma model           | Notes                                           |
| -------------------- | ---------------------- | ----------------------------------------------- |
| `users`              | `User`                 | `fld_role` enum lowercase → uppercase enum     |
| `courses`            | `Course`               | direct                                          |
| `class_enrollments`  | `ClassEnrollment`      | direct                                          |
| `assignments`        | `Assignment`           | adds `fld_type` (default `INDIVIDUAL`)         |
| `submissions`        | `Submission`           | `fld_status` lowercase → uppercase enum        |
| `project_groups`     | `ProjectGroup`         | `fld_name_id` → `name`                         |
| `group_members`      | `GroupMember`          | `fld_role` enum lowercase → uppercase          |
| `private_messages`   | `Message`              | direct                                          |
| `friendships`        | `Friendship`           | `fld_student_id1/2` → `senderId/receiverId`    |
| `notifications`      | `Notification`         | direct                                          |
| `calendar_events`    | `CalendarEvent`        | `fld_time` stored as `String` (`HH:mm:ss`)     |
| `announcements`      | `CourseContent`        | mapped to `type=ANNOUNCEMENT`                  |

Tables introduced new in the rebuild (no legacy source — created empty):

- `course_content` (covers GENERAL/NOTES/FORUM/FILE; legacy `announcements` lifts into here)
- `assignment_attachments`
- `submission_feedback`
- `auth_accounts`, `auth_sessions`, `auth_verification_tokens` (NextAuth)

## Run order

```sh
# 0. From smartcollab1/, ensure new schema exists and target DB is empty
DATABASE_URL="mysql://root:@localhost:3306/ukm_lms_new" pnpm db:deploy

# 1. Run import (planned for next slice — script not yet implemented)
LEGACY_DB_URL="mysql://root:@localhost:3306/ukm_lms" \
DATABASE_URL="mysql://root:@localhost:3306/ukm_lms_new" \
  pnpm tsx scripts/import-from-legacy-mysql.ts

# 2. Verify
pnpm tsx scripts/verify-migration.ts

# 3. Switch app to new DB (already pointing at ukm_lms_new in .env.local)
pnpm dev
```

## What the import script will do (next slice)

1. Open both connections (legacy via `mysql2`, new via Prisma).
2. For each table, stream rows with `LIMIT/OFFSET` paging.
3. Bcrypt-hash any plaintext passwords on the fly (legacy stores them raw).
4. Map enum casing (`student` → `STUDENT`, etc.).
5. Upsert into the new schema, preserving primary keys so foreign-key references stay valid.
6. Write a `migration-report.md` listing rows imported / skipped (unique violations) / failed (FK
   misses).

## Rollback

If the import fails partway through, drop and recreate the target DB:

```sh
mysql -u root -e "DROP DATABASE ukm_lms_new; CREATE DATABASE ukm_lms_new;"
DATABASE_URL="mysql://root:@localhost:3306/ukm_lms_new" pnpm db:deploy
```

The legacy `ukm_lms` is read-only during import — nothing can corrupt it.

## Self-host vs. cloud

- **Same XAMPP machine**: easiest — `pnpm build && pnpm start` behind nginx (or `pm2 start npm
  -- start`), reusing the existing MySQL.
- **Vercel + PlanetScale**: spec recommends; needs `prisma migrate deploy` in CI and Vercel env
  vars. Note that PlanetScale doesn't support FKs (schema FKs become application-level constraints
  via Prisma's `relationMode = "prisma"`).
