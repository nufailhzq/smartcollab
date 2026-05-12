import {
  PrismaClient,
  Role,
  AssignmentType,
  SubmissionStatus,
  FriendshipStatus,
  GroupRole,
  ContentType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Deterministic password hashes — computed once per run, reused everywhere.
const STUDENT_PW = "Student123";
const LECTURER_PW = "Lecturer123";
const ADMIN_PW = "admin";

type SeedUser = {
  matric: string;
  name: string;
  role: Role;
  email: string;
  password: string;
};

const ADMIN: SeedUser = {
  matric: "admin",
  name: "System Admin",
  role: "ADMIN",
  email: "admin@ukm.edu.my",
  password: ADMIN_PW,
};

const LECTURERS: SeedUser[] = [
  ["K012345", "Dr. Azman Abdullah", "azman@ukm.edu.my"],
  ["K234567", "Dr. Faridah Mohd Saman", "faridah@ukm.edu.my"],
  ["K345678", "Dr. Farid Hassan", "farid.hassan@ukm.edu.my"],
  ["K456789", "Pn. Nurul Huda", "nurul.huda@ukm.edu.my"],
  ["K567890", "Dr. Maya Sofea", "maya.sofea@ukm.edu.my"],
  ["K678901", "En. Azlan Rahman", "azlan.rahman@ukm.edu.my"],
  ["K789012", "Dr. Liyana Ismail", "liyana.ismail@ukm.edu.my"],
  ["K890123", "Dr. Hisham Othman", "hisham.othman@ukm.edu.my"],
].map(([matric, name, email]) => ({
  matric: matric!,
  name: name!,
  email: email!,
  role: "LECTURER" as const,
  password: LECTURER_PW,
}));

// 36 students. Realistic Malaysian names (Malay/Chinese/Indian/Bumiputra mix).
const STUDENT_NAMES = [
  "Siti Sarah",
  "Aiman Hakimi",
  "Nur Alya",
  "Danish Iqbal",
  "Siti Maisarah",
  "Farhan Zikri",
  "Nurin Batrisya",
  "Adam Rayyan",
  "Sofia Iman",
  "Wong Wei Ming",
  "Ahmad Faiz",
  "Amirah Zulkifli",
  "Razif Mohd Noor",
  "Hafiz Hakim",
  "Nurul Aisyah",
  "Iman Aqil",
  "Lisa Tan",
  "Priya Devi",
  "Ravinder Singh",
  "Muhammad Hakim",
  "Nor Liyana",
  "Daniel Lim",
  "Aaron Tan",
  "Khairul Anwar",
  "Aminah Yusof",
  "Rohaizad Salleh",
  "Tasya Rahman",
  "Yusuf Ismail",
  "Zaim Iskandar",
  "Lim Wei Jie",
  "Tan Mei Ling",
  "Suresh Kumar",
  "Kamala Devi",
  "Faridah Yusop",
  "Iskandar Zulkarnain",
  "Hakimi Idris",
];

// Primary test student must be A201762 / Siti Sarah (matches user's matric).
const STUDENTS: SeedUser[] = STUDENT_NAMES.map((name, i) => {
  const matric = i === 0 ? "A201762" : `A22${(1000 + i).toString().padStart(4, "0")}`;
  const handle = matric.toLowerCase();
  return {
    matric,
    name,
    email: `${handle}@siswa.ukm.edu.my`,
    role: "STUDENT" as const,
    password: STUDENT_PW,
  };
});

type SeedCourse = {
  code: string;
  title: string;
  lecturerMatric: string;
  semester: string;
  credits: number;
  description: string;
};

const COURSES: SeedCourse[] = [
  {
    code: "TTTK3000",
    title: "Projek Tahun Akhir",
    lecturerMatric: "K012345",
    semester: "Sem 1 26/27",
    credits: 3,
    description: "Projek penyelidikan dan pembangunan akhir tahun bagi pelajar tahun 3.",
  },
  {
    code: "TTTK3413",
    title: "Pembangunan Aplikasi Web",
    lecturerMatric: "K012345",
    semester: "Sem 1 26/27",
    credits: 3,
    description: "Pengenalan kepada pembangunan web moden menggunakan rangka kerja terkini.",
  },
  {
    code: "TTTK3813",
    title: "Realiti Maya",
    lecturerMatric: "K234567",
    semester: "Sem 1 26/27",
    credits: 3,
    description: "Pembangunan aplikasi VR/AR dan pengalaman immersif.",
  },
  {
    code: "TTCS3064",
    title: "Pentadbiran Sistem",
    lecturerMatric: "K234567",
    semester: "Sem 2 26/27",
    credits: 3,
    description: "Pentadbiran pelayan dan rangkaian dalam persekitaran pengeluaran.",
  },
  {
    code: "TTCS2043",
    title: "Komputer Etika dan Sosial",
    lecturerMatric: "K456789",
    semester: "Sem 2 26/27",
    credits: 2,
    description: "Isu etika, sosial, dan profesional dalam bidang teknologi maklumat.",
  },
  {
    code: "TTTK2113",
    title: "Struktur Data dan Algoritma",
    lecturerMatric: "K345678",
    semester: "Sem 1 26/27",
    credits: 3,
    description: "Pengenalan kepada struktur data klasik dan analisis algoritma.",
  },
  {
    code: "TTMK3133",
    title: "Pembangunan Mudah Alih",
    lecturerMatric: "K890123",
    semester: "Sem 2 26/27",
    credits: 3,
    description: "Pembangunan aplikasi mudah alih merentas platform.",
  },
  {
    code: "TTCS3023",
    title: "Kecerdasan Buatan",
    lecturerMatric: "K567890",
    semester: "Sem 1 26/27",
    credits: 3,
    description: "Asas kecerdasan buatan, pencarian, dan pembelajaran mesin.",
  },
  {
    code: "TTTK3163",
    title: "Pangkalan Data",
    lecturerMatric: "K678901",
    semester: "Sem 1 26/27",
    credits: 3,
    description: "Reka bentuk pangkalan data hubungan dan SQL lanjutan.",
  },
  {
    code: "TTCS3043",
    title: "Interaksi Manusia-Komputer",
    lecturerMatric: "K789012",
    semester: "Sem 2 26/27",
    credits: 3,
    description: "Prinsip reka bentuk antara muka pengguna dan kebolehgunaan.",
  },
  {
    code: "TTTK3133",
    title: "Keselamatan Komputer",
    lecturerMatric: "K345678",
    semester: "Sem 2 26/27",
    credits: 3,
    description: "Asas keselamatan sistem, kriptografi, dan analisis ancaman.",
  },
  {
    code: "TTMK3013",
    title: "Pembelajaran Mesin",
    lecturerMatric: "K567890",
    semester: "Sem 2 26/27",
    credits: 3,
    description: "Algoritma pembelajaran mesin diselia dan tidak diselia.",
  },
];

// Deterministic RNG so seed output is stable across runs.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
const rand = rng(20260510);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const pickN = <T>(arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
};

async function main() {
  console.warn("Seeding UKMFolio database...");

  const adminHash = await bcrypt.hash(ADMIN.password, 12);
  const lecturerHash = await bcrypt.hash(LECTURER_PW, 12);
  const studentHash = await bcrypt.hash(STUDENT_PW, 12);

  // Users
  await prisma.user.upsert({
    where: { matricNum: ADMIN.matric },
    update: { name: ADMIN.name, email: ADMIN.email, role: ADMIN.role, isActive: true },
    create: {
      matricNum: ADMIN.matric,
      name: ADMIN.name,
      email: ADMIN.email,
      role: ADMIN.role,
      passwordHash: adminHash,
      faculty: "FTSM",
    },
  });

  for (const l of LECTURERS) {
    await prisma.user.upsert({
      where: { matricNum: l.matric },
      update: { name: l.name, email: l.email, role: l.role, isActive: true },
      create: {
        matricNum: l.matric,
        name: l.name,
        email: l.email,
        role: l.role,
        passwordHash: lecturerHash,
        faculty: "FTSM",
      },
    });
  }

  for (const s of STUDENTS) {
    await prisma.user.upsert({
      where: { matricNum: s.matric },
      update: { name: s.name, email: s.email, role: s.role, isActive: true },
      create: {
        matricNum: s.matric,
        name: s.name,
        email: s.email,
        role: s.role,
        passwordHash: studentHash,
        faculty: "FTSM",
      },
    });
  }
  console.warn(`✓ Users: ${1 + LECTURERS.length + STUDENTS.length}`);

  const lecturerByMatric = new Map<string, number>();
  for (const l of LECTURERS) {
    const u = await prisma.user.findUniqueOrThrow({ where: { matricNum: l.matric } });
    lecturerByMatric.set(l.matric, u.id);
  }
  const studentByMatric = new Map<string, number>();
  for (const s of STUDENTS) {
    const u = await prisma.user.findUniqueOrThrow({ where: { matricNum: s.matric } });
    studentByMatric.set(s.matric, u.id);
  }
  const studentIds = [...studentByMatric.values()];
  const sarahId = studentByMatric.get("A201762")!;

  // Courses
  for (const c of COURSES) {
    await prisma.course.upsert({
      where: { code: c.code },
      update: {
        title: c.title,
        semester: c.semester,
        creditHours: c.credits,
        description: c.description,
        lecturerId: lecturerByMatric.get(c.lecturerMatric) ?? null,
      },
      create: {
        code: c.code,
        title: c.title,
        semester: c.semester,
        creditHours: c.credits,
        description: c.description,
        lecturerId: lecturerByMatric.get(c.lecturerMatric) ?? null,
      },
    });
  }
  console.warn(`✓ Courses: ${COURSES.length}`);

  const courseByCode = new Map<string, number>();
  for (const c of COURSES) {
    const row = await prisma.course.findUniqueOrThrow({ where: { code: c.code } });
    courseByCode.set(c.code, row.id);
  }

  // Enrollments — Sarah (A201762) gets the same 3 hero courses as legacy + 1 extra.
  // Every other student gets 3-5 random courses. Aim for ≥100 rows total.
  const HERO_COURSES = ["TTTK3000", "TTTK3413", "TTTK3813", "TTCS3023"];
  for (const code of HERO_COURSES) {
    await prisma.classEnrollment.upsert({
      where: {
        courseId_studentId: { courseId: courseByCode.get(code)!, studentId: sarahId },
      },
      update: {},
      create: { courseId: courseByCode.get(code)!, studentId: sarahId },
    });
  }

  let enrollmentCount = HERO_COURSES.length;
  for (const sId of studentIds) {
    if (sId === sarahId) continue;
    const courseCount = 3 + Math.floor(rand() * 3); // 3..5
    const codes = pickN(COURSES, courseCount);
    for (const c of codes) {
      try {
        await prisma.classEnrollment.upsert({
          where: {
            courseId_studentId: { courseId: courseByCode.get(c.code)!, studentId: sId },
          },
          update: {},
          create: { courseId: courseByCode.get(c.code)!, studentId: sId },
        });
        enrollmentCount++;
      } catch {
        // unique violation — already enrolled, skip
      }
    }
  }
  console.warn(`✓ Enrollments: ${enrollmentCount}`);

  // Course content — every course gets 1 GENERAL, 4 NOTES, 2 ANNOUNCEMENT = 7 rows.
  // Skip the whole block if any content already exists (idempotent re-run).
  const existingContentCount = await prisma.courseContent.count();
  let contentCount = existingContentCount;
  if (existingContentCount === 0) {
    for (const c of COURSES) {
      const courseId = courseByCode.get(c.code)!;
      const lecturerId = lecturerByMatric.get(c.lecturerMatric)!;

      await prisma.courseContent.create({
        data: {
          courseId,
          type: "GENERAL",
          title: `Selamat datang ke ${c.code}`,
          content: `Selamat datang ke ${c.title}. Semakan silibus dan jadual akan dimuat naik di sini.`,
          postedById: lecturerId,
        },
      });

      for (let week = 1; week <= 4; week++) {
        await prisma.courseContent.create({
          data: {
            courseId,
            type: "NOTES",
            title: `Minggu ${week}: Topik ${week}`,
            content: `Nota kuliah untuk Minggu ${week}.`,
            fileName: `minggu-${week}.pdf`,
            fileSize: `${(rand() * 5 + 1).toFixed(1)} MB`,
            postedById: lecturerId,
          },
        });
      }

      for (let a = 1; a <= 2; a++) {
        await prisma.courseContent.create({
          data: {
            courseId,
            type: "ANNOUNCEMENT",
            title: `Pengumuman ${a}: ${c.code}`,
            content: `Pengumuman penting berkenaan ${c.title}.`,
            postedById: lecturerId,
          },
        });
      }
      contentCount += 7;
    }
  }
  console.warn(`✓ Course content: ${contentCount}`);

  // Project groups — 3 groups per course in first 10 courses = 30 groups.
  let groupRows = 0;
  for (const c of COURSES.slice(0, 10)) {
    const courseId = courseByCode.get(c.code)!;
    const greekLetters = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    const groupNames = greekLetters.slice(0, 3);
    for (const letter of groupNames) {
      const existing = await prisma.projectGroup.findFirst({
        where: { courseId, name: `Kumpulan ${letter} (${c.code})` },
      });
      if (!existing) {
        await prisma.projectGroup.create({
          data: {
            courseId,
            name: `Kumpulan ${letter} (${c.code})`,
            maxMembers: 4 + Math.floor(rand() * 2),
          },
        });
      }
      groupRows++;
    }
  }
  console.warn(`✓ Project groups: ${groupRows}`);

  // Group memberships — for each group, enroll 2-4 students who are enrolled in that course.
  const allGroups = await prisma.projectGroup.findMany();
  let memberCount = 0;
  for (const g of allGroups) {
    const enrolled = await prisma.classEnrollment.findMany({
      where: { courseId: g.courseId },
      select: { studentId: true },
    });
    const candidates = enrolled.map((e) => e.studentId);
    const target = Math.min(g.maxMembers - 1, 2 + Math.floor(rand() * 3));
    const chosen = pickN(candidates, target);
    for (let i = 0; i < chosen.length; i++) {
      try {
        await prisma.groupMember.upsert({
          where: { groupId_studentId: { groupId: g.id, studentId: chosen[i]! } },
          update: {},
          create: {
            groupId: g.id,
            studentId: chosen[i]!,
            role: i === 0 ? "LEADER" : "MEMBER",
          },
        });
        memberCount++;
      } catch {
        /* unique conflict */
      }
    }
  }
  console.warn(`✓ Group memberships: ${memberCount}`);

  // Assignments — 4 per course (mix of past/present/future, individual/group).
  const existingAssignmentCount = await prisma.assignment.count();
  let allAssignments: { id: number; courseId: number; type: AssignmentType }[] = [];
  if (existingAssignmentCount === 0) {
    for (const c of COURSES) {
      const courseId = courseByCode.get(c.code)!;
      const offsets = [-21, -7, 7, 21]; // days from today
      const types: AssignmentType[] = ["INDIVIDUAL", "INDIVIDUAL", "GROUP", "INDIVIDUAL"];
      for (let i = 0; i < 4; i++) {
        const due = new Date();
        due.setDate(due.getDate() + offsets[i]!);
        const created = await prisma.assignment.create({
          data: {
            courseId,
            title: `Tugasan ${i + 1}: ${c.code}`,
            description: `Penerangan tugasan ${i + 1} untuk ${c.title}.`,
            type: types[i]!,
            dueDate: due,
            maxGrade: 100,
          },
        });
        allAssignments.push({ id: created.id, courseId, type: types[i]! });
      }
    }
  } else {
    const rows = await prisma.assignment.findMany({
      select: { id: true, courseId: true, type: true },
    });
    allAssignments = rows;
  }
  console.warn(`✓ Assignments: ${allAssignments.length}`);

  // Submissions — for each past-deadline assignment, 60-80% of enrolled students submit.
  const STATUS_MIX: SubmissionStatus[] = ["SUBMITTED", "SUBMITTED", "GRADED", "GRADED", "LATE"];
  let submissionCount = 0;
  for (const a of allAssignments) {
    const enrolled = await prisma.classEnrollment.findMany({
      where: { courseId: a.courseId },
      select: { studentId: true },
    });
    const submitters = pickN(enrolled.map((e) => e.studentId), Math.ceil(enrolled.length * 0.7));
    for (const studentId of submitters) {
      const status = pick(STATUS_MIX);
      const grade = status === "GRADED" ? 60 + Math.floor(rand() * 41) : null;
      try {
        await prisma.submission.upsert({
          where: {
            assignmentId_studentId: { assignmentId: a.id, studentId },
          },
          update: {},
          create: {
            assignmentId: a.id,
            studentId,
            filePath: `/uploads/sub-${a.id}-${studentId}.pdf`,
            status,
            grade,
          },
        });
        submissionCount++;
      } catch {
        /* skip */
      }
    }
  }
  console.warn(`✓ Submissions: ${submissionCount}`);

  // Friendships — Sarah befriends 8 students (some accepted, some pending).
  const otherStudentIds = studentIds.filter((id) => id !== sarahId);
  const friends = pickN(otherStudentIds, 8);
  let friendCount = 0;
  for (let i = 0; i < friends.length; i++) {
    const status: FriendshipStatus = i < 5 ? "ACCEPTED" : "PENDING";
    const senderId = i % 2 === 0 ? sarahId : friends[i]!;
    const receiverId = i % 2 === 0 ? friends[i]! : sarahId;
    try {
      await prisma.friendship.upsert({
        where: { senderId_receiverId: { senderId, receiverId } },
        update: { status },
        create: { senderId, receiverId, status },
      });
      friendCount++;
    } catch {
      /* skip */
    }
  }
  // Plus ~25 random friendships among other students
  for (let i = 0; i < 25; i++) {
    const [a, b] = pickN(otherStudentIds, 2);
    if (!a || !b) continue;
    try {
      await prisma.friendship.upsert({
        where: { senderId_receiverId: { senderId: a, receiverId: b } },
        update: {},
        create: { senderId: a, receiverId: b, status: "ACCEPTED" },
      });
      friendCount++;
    } catch {
      /* skip */
    }
  }
  console.warn(`✓ Friendships: ${friendCount}`);

  // Messages — 50 between Sarah and her accepted friends.
  const sarahFriends = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: sarahId }, { receiverId: sarahId }],
    },
  });
  const sarahFriendIds = sarahFriends.map((f) =>
    f.senderId === sarahId ? f.receiverId : f.senderId,
  );
  const sampleTexts = [
    "Hai, awak buat tugasan TTTK3413 dah?",
    "Boleh tolong saya semak laporan?",
    "Jumpa di perpustakaan jam 3?",
    "Terima kasih banyak!",
    "Saya tak faham bahagian ni, awak ada masa?",
    "Ok, saya hantar fail tu nanti.",
    "Class esok dibatalkan.",
    "Selamat hari raya!",
    "Ada quiz minggu depan, jangan lupa.",
    "Saya dah hantar tugasan kumpulan kita.",
  ];
  const existingMessageCount = await prisma.message.count();
  let messageCount = existingMessageCount;
  if (existingMessageCount === 0) {
    for (let i = 0; i < 50 && sarahFriendIds.length > 0; i++) {
      const friendId = sarahFriendIds[i % sarahFriendIds.length]!;
      const fromSarah = i % 2 === 0;
      await prisma.message.create({
        data: {
          senderId: fromSarah ? sarahId : friendId,
          receiverId: fromSarah ? friendId : sarahId,
          content: sampleTexts[i % sampleTexts.length]!,
          isRead: i < 40,
          timestamp: new Date(Date.now() - (50 - i) * 60_000 * 30),
        },
      });
      messageCount++;
    }
  }
  console.warn(`✓ Messages: ${messageCount}`);

  // Calendar events — 20 spread across courses & groups.
  const existingEventCount = await prisma.calendarEvent.count();
  let eventCount = existingEventCount;
  if (existingEventCount === 0) {
    for (let i = 0; i < 20; i++) {
      const c = pick(COURSES);
      const courseId = courseByCode.get(c.code)!;
      const lecturerId = lecturerByMatric.get(c.lecturerMatric)!;
      const date = new Date();
      date.setDate(date.getDate() + Math.floor(rand() * 30) - 5);
      await prisma.calendarEvent.create({
        data: {
          title: `Acara ${c.code} #${i + 1}`,
          description: `Mesyuarat / kuliah / peperiksaan untuk ${c.title}.`,
          date,
          time: "14:00:00",
          courseId,
          createdById: lecturerId,
          reminder: i % 3 === 0,
        },
      });
      eventCount++;
    }
  }
  console.warn(`✓ Calendar events: ${eventCount}`);

  // Notifications — 20 for Sarah so the bell shows immediately.
  const notifTitles = [
    ["Pengumuman Baharu (TTTK3413)", "Pensyarah anda telah memuat naik pengumuman baharu.", "course"],
    ["Tugasan Baharu (TTTK3000)", "Tugasan baharu telah ditambah ke kursus anda.", "course"],
    ["Markah Diterima", "Anda telah menerima markah untuk tugasan terbaru.", "submissions"],
    ["Mesej Baharu", "Anda mempunyai mesej peribadi baharu.", "chat"],
    ["Permintaan Rakan Diterima", "Permintaan rakan anda telah diterima.", "chat"],
    ["Sertai Kumpulan", "Anda kini ahli Kumpulan Alpha (TTTK3000).", "groups"],
    ["Peringatan Acara", "Mesyuarat kumpulan esok jam 2 petang.", "calendar"],
    ["⚠️ AMARAN", "Sila hantar tugasan anda sebelum tarikh akhir.", "submissions"],
  ];
  const existingSarahNotifs = await prisma.notification.count({ where: { userId: sarahId } });
  let notifCount = existingSarahNotifs;
  if (existingSarahNotifs === 0) {
    for (let i = 0; i < 20; i++) {
      const t = notifTitles[i % notifTitles.length]!;
      await prisma.notification.create({
        data: {
          userId: sarahId,
          title: t[0]!,
          message: t[1]!,
          link: t[2]!,
          isRead: i >= 15,
          createdAt: new Date(Date.now() - i * 3600_000 * 4),
        },
      });
      notifCount++;
    }
  }
  console.warn(`✓ Notifications: ${notifCount} for A201762`);

  console.warn("Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
