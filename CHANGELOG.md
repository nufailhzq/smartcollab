# Changelog

## Slice 3.1 — testfyp2 polish + chat groups — 2026-05-11

### testfyp2 visual polish

- Dashboard heroes (student + lecturer) now use the **teal→cyan→cyan-600**
  `.gradient-hero` band that matches testfyp2's `gradient-hero`, with soft
  white circles overlaid for depth.
- Secondary lecturer pages (`/lecturer/pengurusan-kumpulan`,
  `/lecturer/penghantaran`, `/lecturer/pemantauan`) get the dark
  `.gradient-hero-navy` band so they read as the same family of pages.
- New CSS gradient classes in [globals.css](src/app/globals.css):
  `.gradient-hero`, `.gradient-hero-navy`, `.gradient-hero-orange`,
  `.gradient-group` (green→emerald, used for the active-group banner).

### Student kumpulan rebuilt to match testfyp2

- Navy-gradient hero band ("Kumpulan Saya / Lihat dan urus kumpulan anda…").
- Course tab strip with orange-active / slate-inactive pills.
- **My group** banner uses `.gradient-group`, shows member count and
  a destructive "Keluar Kumpulan" CTA.
- Member chips: large avatar, name + matric, **`Anda`** badge on yourself,
  `Ketua` badge for the group leader, plus two activity proxies:
    - **Sumbangan %**: `(submitted+graded+late)/totalAssignments` for that
      course, computed in the new
      [`getKumpulanContext`](src/server/queries/groups.ts) query.
    - **Aktif hari ini / X hari lalu**: derived from each member's most
      recent message timestamp (green dot < 2 days, amber < 7, red ≥ 7).
- **Kumpulan Lain** grid: every other group in the course is visible (with
  navy header band, capacity bar, member previews and matric numbers),
  so the student can see all peers and other groups even after joining one.
  Join CTA is hidden when the student is already in a group (one-group-per-
  course invariant).

### Group chats in the messenger

- Schema (migration `20260510185215_add_chat_groups`):
    - `ChatGroup` (`id`, `name`, `createdById`).
    - `ChatGroupMember` (`chatGroupId`, `userId`, `isAdmin`, `lastReadAt`,
      `joinedAt`, unique by `(chatGroupId, userId)`).
    - `Message.receiverId` is now nullable; `Message.chatGroupId`
      (nullable FK) added — a row is either a DM (`receiverId` set) or a
      group message (`chatGroupId` set).
- New schemas in [src/schemas/chat-group.ts](src/schemas/chat-group.ts)
  (create / add / remove / leave / rename / send / load).
- New Server Actions in
  [src/server/actions/chat-groups.ts](src/server/actions/chat-groups.ts):
  `createChatGroup` (the creator is auto-admin), `addChatGroupMember`,
  `removeChatGroupMember` (admin-only), `leaveChatGroup` (auto-promotes
  the oldest remaining member to admin, deletes the group when empty),
  `renameChatGroup`, `sendChatGroupMessage`, `loadChatGroupConversation`
  (also marks the conversation read for the caller). Every mutation
  fires `revalidatePath` and the create/add paths fire `notifyMany` to
  affected users.
- New query `getChatGroupsForUser` in
  [src/server/queries/messages.ts](src/server/queries/messages.ts) returns
  every group the user is in, with member count, last message preview,
  last sender name, and per-user unread count (computed against
  `ChatGroupMember.lastReadAt`). `getTotalUnreadForUser` now folds group
  unread into its total so the floating-bubble badge reflects both.
- `MessengerBubble` ([file](src/components/layout/MessengerBubble.tsx))
  gained a **Kumpulan Chat** section above contacts in the list view, a
  **`+`** header button that opens a `createGroup` view (name + searchable
  member picker), a **`groupConversation`** view (per-author bubbles, last
  sender name shown for non-mine consecutive runs), and a
  **`groupSettings`** view reachable via the gear icon (rename, member
  list with role badges, admin-only Add/Remove members, "Keluar Kumpulan"
  for the current user). Empty-state copy updated to point users to both
  the `+` (chat group) and add-friend buttons.

## Slice 3 — Lecturer feature set + testfyp2 light theme — 2026-05-10

Slice 3 ships the entire lecturer surface area and rebases the whole app onto
the **testfyp2** visual language (light gray-50 background, navy / sky-blue /
orange palette, Inter font, white card surfaces with soft shadow, sidebar
navigation pattern). Student and lecturer dashboards now share the same hero
band, stat-card grid, table styles, and badge tints — a single design system.

### Theme

- New design tokens in [src/styles/tokens.css](src/styles/tokens.css): `--ukm-navy`
  (`#1e3a5f`), `--ukm-orange` (`#f97316`), `--ukm-teal` (sky `#0ea5e9`),
  `--ukm-cyan` (`#22d3ee`), `--ukm-red` (`#dc2626`), plus surface/border/text
  scales (`--bg-app`, `--bg-surface`, `--bg-muted`, `--border-soft`, `--text`,
  `--text-muted`, `--text-faint`).
- Body font is now Inter, loaded from Google Fonts.
- [src/app/globals.css](src/app/globals.css) defines reusable component
  classes: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`,
  `.input-base`, `.card`, `.card-elevated`, `.data-table`, `.badge-student`,
  `.badge-lecturer`, `.badge-admin`. Custom scrollbars match the testfyp2 vibe.
- [src/app/(auth)/layout.tsx](src/app/(auth)/layout.tsx) and the login form
  re-themed: navy gradient hero with sky/cyan glow, white card body with
  Inter, orange-tinted UKMFOLIO wordmark.

### Layout

- New [src/components/layout/LeftSidebar.tsx](src/components/layout/LeftSidebar.tsx)
  client component (active-link detection via `usePathname`) +
  [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) server
  wrapper that fetches the user's enrolled / taught courses for the
  "Kursus Saya" sidebar list. Tabs are role-specific (Student / Lecturer /
  Admin).
- All three role layouts now use `<Navbar/>` (top bar) + `<Sidebar/>` + `<main>`.
  The Navbar is now light-themed with role badges in the top-right.
- `NotificationBell` and `MessengerBubble` rebuilt for the light theme
  (white surfaces, slate borders, sky/orange tints, gradient sky launcher).

### Lecturer routes (new)

- `/lecturer` — dashboard with hero band, four KPI cards (kursus, belum
  markah, pelajar, lewat), recent-submissions table with one-click jump to
  grading, shortcut tile to every other lecturer page, plus course cards.
- `/lecturer/kursus` and `/lecturer/kursus/[code]` — course list and
  course detail. The detail page has four tabs: **Umum** (post announcement
  /general /forum), **Nota & Bahan** (upload notes/files), **Tugasan**
  (create assignments + per-assignment submission summary linking into
  grading), **Kumpulan** (group roster preview, deep-links into
  pengurusan-kumpulan). Authoring is inline via
  [`course-authoring.tsx`](src/app/(lecturer)/lecturer/kursus/[code]/course-authoring.tsx).
- `/lecturer/pengurusan-kumpulan` — course tab strip; per-course view shows
  ungrouped students on the left and group cards on the right. Buttons:
  create group, rename + resize via prompt, delete group, assign student to
  group, remove student. All actions are Zod-validated Server Actions and
  notify the affected student.
- `/lecturer/penghantaran` — submission list filterable by course +
  status (`ALL` / `SUBMITTED` / `LATE` / `GRADED`). Each row uses a
  `GradingPanel` client component with inline grade input, optional
  feedback text, and a `gradeSubmission` Server Action that writes
  `Submission.grade`, sets `status=GRADED`, optionally creates a
  `SubmissionFeedback` row, and notifies the student.
- `/lecturer/pemantauan` — progress monitoring per course. For each enrolled
  student we compute `submitted / late / missing / graded / averageGrade /
  lastSubmissionAt` and a red-flag heuristic (`missing ≥ 2`, average < 50,
  ≥ 2 late, or zero submissions). Flagged students sort to the top and get a
  tinted row + reason text.
- `/lecturer/kalendar` — reuses the student `CalendarView` client component
  fed by `getCalendarForLecturer` (taught-course events + assignment
  deadlines).
- `/lecturer/profil` — profile + KPIs (kursus diajar, pelajar, tugasan
  dimarkah).

### Server actions (new)

- [`src/server/actions/grading.ts`](src/server/actions/grading.ts) →
  `gradeSubmission`.
- [`src/server/actions/content.ts`](src/server/actions/content.ts) →
  `createCourseContent`, `deleteCourseContent`, `createAssignment`,
  `deleteAssignment`. Announcements + notes broadcast a notification to
  every enrolled student via `notifyEnrolledStudents`.
- [`src/server/actions/lecturer-groups.ts`](src/server/actions/lecturer-groups.ts) →
  `createGroup`, `updateGroup`, `deleteGroup`, `assignStudentToGroup`
  (enforces "one group per student per course" and capacity), `removeStudentFromGroup`.

Every action: `auth()` → role check → Zod parse → ownership check
(lecturer must own the course the resource belongs to) → mutation →
`revalidatePath` on every affected surface so the student dashboard,
calendar, kumpulan, tugasan, and the lecturer's own pages all rehydrate.

### Server queries (new)

- [`src/server/queries/lecturer.ts`](src/server/queries/lecturer.ts):
  `getTaughtCourses`, `getTaughtCourseByCode`, `getLecturerSubmissions`,
  `getCourseGroups` (groups + ungrouped students), `getMonitoringData`
  (computes per-student stats + flag reason).
- `getCalendarForLecturer` added to
  [`src/server/queries/calendar.ts`](src/server/queries/calendar.ts).

### Notes / follow-ups for the next slice

- Slice 4: Admin CRUD (pengguna, kursus, sistem) — admin layout already
  uses the shared sidebar; only the routes need to be built.
- Slice 5: Realtime chat — SSE first, Pusher swap later.
- Slice 6: Legacy import script + verifier.
- Slice 7: Playwright e2e refresh-stable suite.

## Slice 2 — Student feature set — 2026-05-10

Completes the student-facing surface area on top of the foundation slice.

### Added

- **Routes**: `/student/kursus`, `/student/kursus/[code]` (tabs: Umum / Nota / Tugasan),
  `/student/tugasan` (with course + type filters), `/student/tugasan/[assignmentId]`
  (with `SubmissionForm`), `/student/kumpulan` (with `GroupBrowser`),
  `/student/kalendar` (with `CalendarView`), `/student/profil`. Every route is a
  Server Component that reads directly from Prisma — no `useEffect`+fetch
  hydration, no MOCK constants.
- **Server queries**: `getEnrolledCourses`, `getEnrolledCourseByCode`,
  `getStudentAssignments`, `getAssignmentForStudent`, `getUpcomingAssignments`,
  `getCurrentGroupForStudent`, `getGroupsForStudentInCourse`, `getCalendarForStudent`,
  `getContactsForUser`, `getConversation`, `getTotalUnreadForUser`,
  `getPendingFriendRequests`, `searchUsersForFriend`,
  `getNotificationsForUser`, `getUnreadNotificationCount`.
- **Server actions** (all Zod-validated, `ActionResult<T>`-typed,
  `revalidatePath`-ed): `submitAssignment`, `joinGroup`, `leaveGroup`,
  `createCalendarEvent`, `deleteCalendarEvent`, `sendMessage`,
  `loadConversation`, `markMessagesRead`, `sendFriendRequest`,
  `acceptFriendRequest`, `rejectFriendRequest`, `removeFriend`,
  `searchUsers`, `markNotificationRead`, `markAllNotificationsRead`.
- **Components**:
  - `NotificationBell` (client) — badge + dropdown with mark-one /
    mark-all-read; uses `router.refresh()` after Server Action so the
    server-fetched count rehydrates without losing F5-stability.
  - `MessengerBubble` (client) — floating bubble (bottom-right) with three
    views: contacts list (grouped by Rakan / Pensyarah / Pelajar / Sejarah),
    user-search panel for adding friends, and conversation pane with
    send-message form. Loads each conversation on demand via
    `loadConversation` Server Action (which also marks the partner's
    messages as read).
  - Both components are wired into the shared `Navbar`, so they appear
    consistently across student / lecturer / admin layouts and are
    server-fetched on every navigation — refresh-stable by construction.

### Notes / follow-ups for the next slice

- Slice 3: Lecturer feature set (kursus content authoring, pemantauan,
  pengurusan-kumpulan, penghantaran/grading).
- Realtime: chat is poll-on-open today. SSE swap-in lands in slice 5.

## Foundation slice — 2026-05-10

Initial scaffold of the Next.js 14 + TypeScript + Prisma rebuild of UKMFolio.

### Added

- `package.json` with pinned Next 14, Prisma 5, NextAuth v5 (beta), Tailwind 3, Zod, TanStack
  Query, next-intl, react-hook-form.
- `tsconfig.json` with strict + `noUncheckedIndexedAccess` and `@/*` path alias.
- Tailwind + PostCSS + ESLint + Prettier config.
- `prisma/schema.prisma` — 14 domain models (`User`, `Course`, `ClassEnrollment`, `Assignment`,
  `AssignmentAttachment`, `Submission`, `SubmissionFeedback`, `ProjectGroup`, `GroupMember`,
  `CourseContent`, `Message`, `Friendship`, `Notification`, `CalendarEvent`) + NextAuth tables
  (`Account`, `Session`, `VerificationToken`). Every column `@map`-aligned with legacy `fld_*`
  names so the future import script can lift data straight in.
- `prisma/seed.ts` — idempotent seed: 1 admin + 8 lecturers + 36 students = 45 users; 12 courses
  spanning real FTSM titles; ≥100 enrollments; 30 project groups + memberships; 48 assignments
  with mixed deadlines/types; ≥80 submissions across all four status values; 7 content rows per
  course (1 GENERAL + 4 NOTES + 2 ANNOUNCEMENT); 33 friendships; 50 messages; 20 calendar events;
  20 notifications targeted at the primary test student `A201762`.
- `src/lib/auth.ts` — NextAuth v5 with Credentials provider, Prisma adapter, **JWT session
  strategy** (refresh-stable login via HTTP-only signed cookie — Auth.js v5 doesn't support
  database sessions with the Credentials provider, but JWT in a server-set cookie satisfies the
  same "F5-survives" guarantee). Falls back to plaintext compare for legacy passwords during the
  migration window.
- `src/types/auth.ts` — module augmentation so `session.user` carries `id: number`, `role: Role`,
  `matricNum: string | null`.
- `src/lib/permissions.ts` — `canManageCourse`, `canManageGroup`, `dashboardPathFor` helpers.
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handlers.
- `src/app/(auth)/login` — login page (Server Component shell + client form), Server Action
  (`actions.ts`) that calls `signIn("credentials", ...)` and returns a structured result.
  Quick-login chips for Student / Lecturer / Lecturer 2 / Admin.
- `src/app/(auth)/logout/route.ts` — POST → `signOut` → redirect.
- `src/app/(student|lecturer|admin)/<role>/layout.tsx` — `RoleGuard`-protected layouts with the
  shared `Navbar`.
- Placeholder dashboards for each role with **real KPIs from Prisma** (no mock data).
- `src/lib/i18n.ts` + `messages/{ms,en}.json` — `ms` default, locale via `NEXT_LOCALE` cookie.
- Tailwind design tokens (`--ukm-navy`, `--ukm-orange`, `--ukm-teal`, `--ukm-cyan`,
  `--ukm-dark`).
- README, MIGRATION, .env.example, .gitignore.

### Notes / follow-ups for the next slice

- Slice 2: Student feature set per spec §9.2–§9.8 (course views, kumpulan, kalendar, tugasan
  submission, profil, MessengerBubble, NotificationBell). All mutations go through Server Actions
  with `revalidatePath` so refresh-stability is structural.
- Slice 3: Lecturer feature set (kursus content authoring, pemantauan, pengurusan-kumpulan,
  penghantaran/grading).
- Slice 4: Admin CRUD (pengguna, kursus, sistem).
- Slice 5: Realtime chat — SSE first, Pusher swap-in.
- Slice 6: Legacy import script + verifier (`scripts/import-from-legacy-mysql.ts`).
- Slice 7: e2e refresh-stable test set (Playwright) per spec §11 — the contract tests.
