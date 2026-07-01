import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// OPEN (Manual) mode — post-deadline auto-assign sweep.
//
// When the formation deadline (Assignment.joinCloseAt) passes, any student who
// never joined a group is randomly assigned. Triggered lazily on board access
// (no cron in this app), and guarded by Assignment.autoAssignDone so it runs
// exactly once. Strategy: fill existing open groups that still have room, then
// create additional groups for any overflow.
//
// The whole thing runs in one transaction with a re-check of the guard inside,
// so two concurrent page loads can't both sweep.
// ─────────────────────────────────────────────────────────────────────────────

/** mulberry32 — tiny deterministic PRNG so a sweep is reproducible/auditable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(ids: number[], seed: number): number[] {
  const out = [...ids];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/**
 * Run the one-time auto-assign sweep for an OPEN assignment whose deadline has
 * passed. Idempotent and concurrency-safe: returns the number of students
 * placed (0 if nothing to do or already swept). Never throws to the caller's
 * render path — failures are swallowed and logged.
 */
export async function maybeAutoAssignOpenGroups(assignmentId: number): Promise<number> {
  try {
    // Cheap pre-check outside the tx to avoid a transaction on every board load.
    const a = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        courseId: true,
        groupingMode: true,
        joinCloseAt: true,
        autoAssignDone: true,
      },
    });
    if (
      !a ||
      a.groupingMode !== "OPEN" ||
      a.autoAssignDone ||
      a.joinCloseAt === null ||
      a.joinCloseAt.getTime() > Date.now()
    ) {
      return 0;
    }

    return await prisma.$transaction(async (tx) => {
      // Re-read the guard inside the tx; bail if another request already swept.
      const fresh = await tx.assignment.findUnique({
        where: { id: assignmentId },
        select: { autoAssignDone: true, joinCloseAt: true, groupingMode: true, courseId: true },
      });
      if (
        !fresh ||
        fresh.autoAssignDone ||
        fresh.groupingMode !== "OPEN" ||
        fresh.joinCloseAt === null ||
        fresh.joinCloseAt.getTime() > Date.now()
      ) {
        return 0;
      }

      const [roster, groups] = await Promise.all([
        tx.classEnrollment.findMany({
          where: { courseId: fresh.courseId },
          select: { studentId: true },
        }),
        tx.projectGroup.findMany({
          where: { assignmentId },
          select: { id: true, maxMembers: true, _count: { select: { members: true } } },
          orderBy: { id: "asc" },
        }),
      ]);

      const groupedIds = new Set(
        (
          await tx.groupMember.findMany({
            where: { group: { assignmentId } },
            select: { studentId: true },
          })
        ).map((m) => m.studentId),
      );

      const ungrouped = roster
        .map((e) => e.studentId)
        .filter((id) => !groupedIds.has(id));

      // Always claim the guard, even when there's nobody to place, so the sweep
      // is a true one-shot.
      if (ungrouped.length === 0) {
        await tx.assignment.update({
          where: { id: assignmentId },
          data: { autoAssignDone: true },
        });
        return 0;
      }

      const seed = (assignmentId * 2654435761) >>> 0; // stable per-assignment seed
      const queue = shuffled(ungrouped, seed);
      // Default new-group size = the size the lecturer opened groups at (they're
      // uniform), falling back to 4.
      const groupSize = groups[0]?.maxMembers ?? 4;

      // 1) Fill existing groups with remaining capacity.
      const slots = groups.map((g) => ({
        id: g.id,
        free: Math.max(0, g.maxMembers - g._count.members),
      }));
      let qi = 0;
      for (const slot of slots) {
        while (slot.free > 0 && qi < queue.length) {
          await tx.groupMember.create({
            data: { groupId: slot.id, studentId: queue[qi]!, role: "MEMBER" },
          });
          slot.free -= 1;
          qi += 1;
        }
      }

      // 2) Overflow → create new groups.
      let newIndex = groups.length;
      while (qi < queue.length) {
        newIndex += 1;
        const chunk = queue.slice(qi, qi + groupSize);
        await tx.projectGroup.create({
          data: {
            courseId: fresh.courseId,
            name: `Kumpulan ${newIndex}`,
            maxMembers: groupSize,
            status: "APPROVED",
            assignmentId,
            members: {
              create: chunk.map((studentId, i) => ({
                studentId,
                role: i === 0 ? "LEADER" : "MEMBER",
              })),
            },
          },
        });
        qi += chunk.length;
      }

      await tx.assignment.update({
        where: { id: assignmentId },
        data: { autoAssignDone: true },
      });

      return queue.length;
    });
  } catch (err) {
    console.error(`Auto-assign sweep failed for assignment ${assignmentId}:`, err);
    return 0;
  }
}
