/**
 * Faculties used to group courses in the admin assignment view.
 * FTSM owns its own courses; FSSK / FST / CITRA are cross-faculty buckets that
 * any student may join.
 */
export const FACULTIES = ["FTSM", "FSSK", "FST", "CITRA"] as const;

export type Faculty = (typeof FACULTIES)[number];

export const DEFAULT_FACULTY: Faculty = "FTSM";

export const FACULTY_LABELS: Record<string, string> = {
  FTSM: "Fakulti Teknologi & Sains Maklumat",
  FSSK: "Fakulti Sains Sosial & Kemanusiaan",
  FST: "Fakulti Sains & Teknologi",
  CITRA: "Pusat Citra Universiti",
};

/** Label used in the picker; falls back to the raw code for any unknown faculty. */
export function facultyLabel(code: string | null | undefined): string {
  if (!code) return "Lain-lain";
  return FACULTY_LABELS[code] ?? code;
}
