import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { OnboardingTour, type TourStep } from "./OnboardingTour";

// ─────────────────────────────────────────────────────────────────────────────
// Server gate for the first-time tour. Reads hasCompletedTutorial; renders the
// client tour only when it's false. Mounted on each role dashboard. Steps target
// elements by `data-tour` keys present in the shared layout (sidebar/topbar) and
// the dashboard, so a missing target on a given role is skipped gracefully.
// ─────────────────────────────────────────────────────────────────────────────

const COMMON_TAIL: TourStep[] = [
  {
    target: "folio-connect",
    title: "Folio Connect",
    body: "Ikon ini membuka Folio Connect — ruang sosial untuk berkongsi dan berhubung dengan rakan.",
  },
  {
    target: "notification-bell",
    title: "Notifikasi",
    body: "Loceng ini memaparkan pemberitahuan terkini. Klik untuk melihat dan terus ke konteks berkaitan.",
  },
  {
    target: "calendar-pin",
    title: "Kalendar",
    body: "Akses kalendar acara dan tarikh akhir anda di sini, dipinkan di bahagian bawah bar sisi.",
  },
  {
    target: "profile-link",
    title: "Profil Anda",
    body: "Buka profil anda untuk kemas kini maklumat, tema, dan tetapan akaun.",
  },
];

const STEPS_BY_ROLE: Record<Role, TourStep[]> = {
  STUDENT: [
    {
      target: "dashboard-logo",
      title: "Selamat datang ke SmartCollab",
      body: "Mari kita lihat sekeliling. Klik logo pada bila-bila masa untuk kembali ke papan pemuka.",
    },
    {
      target: "nav-kursus",
      title: "Kursus Saya",
      body: "Semua kursus yang anda daftar berada di sini — nota, tugasan, dan kandungan.",
    },
    {
      target: "nav-tugasan",
      title: "Tugasan",
      body: "Lihat dan hantar tugasan, serta sertai kumpulan untuk tugasan berkumpulan.",
    },
    {
      target: "nav-kumpulan",
      title: "Kumpulan Saya",
      body: "Urus keahlian kumpulan kursus anda di sini.",
    },
    ...COMMON_TAIL,
  ],
  LECTURER: [
    {
      target: "dashboard-logo",
      title: "Selamat datang ke SmartCollab",
      body: "Mari kita lihat sekeliling. Klik logo pada bila-bila masa untuk kembali ke papan pemuka.",
    },
    {
      target: "nav-penghantaran",
      title: "Penghantaran Pelajar",
      body: "Semak dan beri markah penghantaran pelajar di sini.",
    },
    {
      target: "nav-pengurusan-kumpulan",
      title: "Urus Kumpulan",
      body: "Cipta, luluskan, dan urus kumpulan pelajar — kursus anda tersenarai di bawahnya.",
    },
    {
      target: "nav-pemantauan",
      title: "Pemantauan Kemajuan",
      body: "Pantau kemajuan dan kenal pasti pelajar berisiko.",
    },
    ...COMMON_TAIL,
  ],
  ADMIN: [
    {
      target: "dashboard-logo",
      title: "Selamat datang ke SmartCollab",
      body: "Mari kita lihat sekeliling. Klik logo pada bila-bila masa untuk kembali ke papan pemuka.",
    },
    {
      target: "nav-pengguna",
      title: "Pengurusan Pengguna",
      body: "Cipta dan urus akaun pengguna di sini.",
    },
    {
      target: "notification-bell",
      title: "Notifikasi",
      body: "Loceng ini memaparkan pemberitahuan sistem terkini.",
    },
    {
      target: "profile-link",
      title: "Profil Anda",
      body: "Buka profil anda untuk tetapan akaun.",
    },
  ],
};

export async function OnboardingGate() {
  const session = await auth();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasCompletedTutorial: true },
  });
  if (!user || user.hasCompletedTutorial) return null;

  return <OnboardingTour steps={STEPS_BY_ROLE[session.user.role]} />;
}
