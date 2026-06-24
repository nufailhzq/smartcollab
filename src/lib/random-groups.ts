/**
 * Partition a roster into ad-hoc groups for a RANDOM assignment.
 *
 * Uses an unbiased Fisher–Yates shuffle. Remainder handling is explicit: rather
 * than leaving a tiny leftover group (e.g. 13 ÷ 4 -> 4,4,4,1), the remainder
 * students are distributed one-per-group across the earliest groups, so sizes
 * differ by at most one (13 ÷ 4 -> 4,3,3,3). The shuffle can be seeded so a
 * given assignment's grouping is reproducible/auditable.
 */
export type RandomGroup = { name: string; memberIds: number[] };

/** Tiny deterministic PRNG (mulberry32) so a logged seed reproduces a shuffle. */
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

/**
 * Returns the groups AND the seed used, so the caller can log it. A logged seed
 * + this pure function makes the grouping reproducible and therefore auditable:
 * re-running with the same seed yields the same groups.
 */
export function randomGroupsWithSeed(
  roster: number[],
  targetSize: number,
  titlePrefix: string,
  seed: number = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
): { seed: number; groups: RandomGroup[] } {
  return { seed, groups: randomGroups(roster, targetSize, titlePrefix, seed) };
}

export function randomGroups(
  roster: number[],
  targetSize: number,
  titlePrefix: string,
  seed: number = Date.now(),
): RandomGroup[] {
  const ids = [...roster];
  const rand = mulberry32(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = ids[i]!;
    ids[i] = ids[j]!;
    ids[j] = tmp;
  }

  if (ids.length === 0) return [];

  // Choose the group COUNT from the target size, then spread members as evenly
  // as possible so the remainder never forms an undersized leftover group.
  const groupCount = Math.max(1, Math.round(ids.length / targetSize));
  const groups: RandomGroup[] = Array.from({ length: groupCount }, (_, i) => ({
    name: `${titlePrefix} — Kumpulan ${i + 1}`,
    memberIds: [],
  }));
  ids.forEach((id, i) => groups[i % groupCount]!.memberIds.push(id));

  return groups;
}
