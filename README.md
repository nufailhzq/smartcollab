# UKMFolio (SMARTCOLLAB)

Faculty of Information Science and Technology (FTSM), Universiti Kebangsaan Malaysia — Learning
Management System rebuilt on Next.js 14 + TypeScript + Prisma + MySQL.

> Replaces the legacy XAMPP setup at `../smartcollab/` (multi-thousand-line `student.html` /
> `lecturer.html` / `admin.html` driven by browser-Babel + PHP/mysqli endpoints).

---

## Status

This branch is the **foundation slice**:

- [x] Project skeleton (Next.js 14 App Router, strict TypeScript, Tailwind, ESLint, Prettier)
- [x] Prisma schema with all 14 domain models + NextAuth tables (`@map` aligned with legacy `fld_*`
      columns so the import script can shovel old rows in)
- [x] Idempotent seed (`prisma/seed.ts`) — 45 users, 12 courses, ≥100 enrollments, 30 groups,
      ≥48 assignments, ≥80 submissions, ≥30 friendships, ≥50 messages, 20 calendar events,
      20 notifications for the primary test student
- [x] NextAuth v5 with Credentials + JWT session strategy (refresh-stable via signed HTTP-only
      cookie — see note below on why JWT not database sessions)
- [x] `/login` page with eye toggle + quick-login chips for demo
- [x] Role-grouped route layouts under `(student)`, `(lecturer)`, `(admin)` with server-side
      `RoleGuard`
- [x] Placeholder dashboards for each role (real KPIs from Prisma — no mock data)
- [x] i18n scaffold (`next-intl`, `ms` default, `en` toggle later)
- [x] Tailwind design tokens (`--ukm-navy`, `--ukm-orange`, `--ukm-teal`, `--ukm-cyan`,
      `--ukm-dark`)

Subsequent slices will add the full student / lecturer / admin features per `§9` of the spec
(course views, group management, assignment submission/grading, calendar, messenger, notifications,
realtime SSE, and the e2e refresh-stable test set).

---

## Prerequisites

- **Node.js 20+** (24 also works)
- **MySQL 8** or **MariaDB 10.11** (XAMPP's bundled MySQL is fine)
- **pnpm** recommended:
  ```sh
  npm install -g pnpm
  ```
  (npm works too; the spec just prefers pnpm.)

## Setup

```sh
# 1. Install
pnpm install                        # or: npm install

# 2. Configure
cp .env.example .env.local
#   then set:
#   DATABASE_URL="mysql://root:@localhost:3306/ukm_lms_new"
#   AUTH_SECRET="<openssl rand -base64 32>"

# 3. Create the database (XAMPP)
#   In phpMyAdmin or `mysql -u root`:
#     CREATE DATABASE IF NOT EXISTS ukm_lms_new;

# 4. Run migrations + seed
pnpm db:migrate                     # prisma migrate dev (initial migration)
pnpm db:seed                        # populate realistic data

# 5. Start dev server
pnpm dev
# → http://localhost:3000
```

## Login credentials

| Role     | Matric    | Password      | Notes                                                 |
| -------- | --------- | ------------- | ----------------------------------------------------- |
| Student  | `A201762` | `Student123`  | Primary test student "Siti Sarah" — rich seeded data |
| Lecturer | `K012345` | `Lecturer123` | Dr. Azman Abdullah — owns TTTK3000 + TTTK3413        |
| Lecturer | `K234567` | `Lecturer123` | Dr. Faridah Mohd Saman — owns TTTK3813 + TTCS3064    |
| Admin    | `admin`   | `admin`       | System Admin                                          |

The login page also exposes one-click quick-login chips for these four accounts (demo only).

## Useful scripts

| Command            | What it does                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `pnpm dev`         | Next.js dev server on port 3000                                    |
| `pnpm build`       | Production build                                                   |
| `pnpm start`       | Run production build                                               |
| `pnpm lint`        | ESLint (Next config + strict TS rules)                             |
| `pnpm typecheck`   | `tsc --noEmit`                                                     |
| `pnpm db:migrate`  | `prisma migrate dev` — create + apply a new migration              |
| `pnpm db:deploy`   | `prisma migrate deploy` — apply existing migrations (CI/prod)      |
| `pnpm db:seed`     | Run `prisma/seed.ts`                                               |
| `pnpm db:reset`    | Drop, re-migrate, re-seed (dev only — wipes data)                  |
| `pnpm test`        | Vitest                                                             |
| `pnpm test:e2e`    | Playwright (refresh-stable suite — see §11 of the rebuild spec)   |

## Project structure

```
src/
├── app/                      Next.js App Router
│   ├── (auth)/login          Sign-in page + Server Action
│   ├── (auth)/logout         POST → signOut
│   ├── (student)/student     Student dashboard + (future) routes
│   ├── (lecturer)/lecturer   Lecturer dashboard + (future) routes
│   ├── (admin)/admin         Admin dashboard + (future) routes
│   ├── api/auth/[...nextauth]  NextAuth handlers
│   └── layout.tsx, page.tsx  Root layout + role-aware redirect
├── components/layout         Navbar, RoleGuard
├── lib/                      auth, prisma client, permissions, i18n, utils
├── types/                    NextAuth module augmentation
└── styles/                   Design tokens
prisma/
├── schema.prisma             14 models, NextAuth tables, fld_* @map
└── seed.ts                   Idempotent seed
messages/                     ms.json (default), en.json
```

## Architectural rules (from spec §0 — non-negotiable)

1. **The DB is the only source of truth** — no user-mutable state lives only in React state /
   `localStorage` / `sessionStorage`.
2. **Optimistic UI is allowed but never authoritative** — every optimistic update has a paired
   server mutation that rolls back on failure.
3. **Type safety end-to-end** — no `any`, no untyped fetch; Zod schemas drive both validation and
   inferred types.
4. **Server-side authorization on every endpoint** — never trust IDs from the client beyond what
   the role check allows.
5. **No mock-success branches** — failed writes return structured 4xx, never `{ ok: true }`.
6. **Migrations replace self-healing schema** — `schema.prisma` + `prisma migrate` are the only
   source of DDL.

## Troubleshooting

- **Prisma can't connect**: confirm XAMPP MySQL is running on 3306; check `DATABASE_URL` host.
- **`AUTH_SECRET` warning**: generate one with `openssl rand -base64 32` and put it in
  `.env.local`.
- **Login fails for a known matric**: passwords are now bcrypt-hashed. The seed re-hashes them; if
  you imported legacy plaintext rows, the auth path falls back to plaintext compare — but rerun
  the seed (or the import script's hash pass) to migrate them.

## A note on JWT vs database sessions

The rebuild spec calls for "database-backed sessions". In Auth.js v5, the Credentials provider
**does not write to the adapter's `Session` table** (there is no OAuth callback to invoke), so
`strategy: "database"` paired with credentials doesn't actually persist sessions — it just fails
silently. We use `strategy: "jwt"` instead. The session token is in an HTTP-only signed cookie
named `authjs.session-token`; refreshing the page does not invalidate it, which is the property
the spec is actually asking for. The Prisma adapter is still wired up so we can plug in an OAuth
provider (e.g. UKM SSO) later without schema changes.

## See also

- `docs/MIGRATION.md` — step-by-step lift from the legacy `ukm_lms` database into the new schema.
- `../smartcollab/` — original XAMPP/PHP source (kept as reference, not modified).
