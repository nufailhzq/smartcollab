import { z } from "zod";
import { idSchema } from "./common";

export const contentTypeSchema = z.enum([
  "GENERAL",
  "NOTES",
  "ANNOUNCEMENT",
  "FORUM",
  "FILE",
]);

export const createCourseContentSchema = z.object({
  courseId: idSchema,
  type: contentTypeSchema,
  title: z.string().trim().min(1, "Tajuk diperlukan.").max(200),
  content: z.string().trim().max(10_000).optional().or(z.literal("")),
  fileName: z.string().trim().max(200).optional().or(z.literal("")),
});

export const deleteCourseContentSchema = z.object({ contentId: idSchema });

// Edit an existing note / announcement / general content (title + body text).
export const updateCourseContentSchema = z.object({
  contentId: idSchema,
  title: z.string().trim().min(1, "Tajuk diperlukan.").max(200),
  content: z.string().trim().max(10_000).optional().or(z.literal("")),
});

export const createAssignmentSchema = z.object({
  courseId: idSchema,
  title: z.string().trim().min(1, "Tajuk diperlukan.").max(200),
  description: z.string().trim().max(10_000).optional().or(z.literal("")),
  type: z.enum(["INDIVIDUAL", "GROUP"]),
  groupingMode: z
    .enum(["INHERIT", "CUSTOM", "OPEN", "RANDOM", "INDIVIDUAL"])
    .default("INHERIT"),
  /** OPEN mode only: when set, joining/inviting locks after this datetime. */
  joinCloseAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Tarikh tidak sah."),
  groups: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Nama kumpulan diperlukan."),
        memberIds: z.array(idSchema).min(1),
      }),
    )
    .optional(),
  groupSize: z.coerce.number().int().min(2).max(20).optional(),
  /** OPEN mode: how many empty self-join groups to open, and their capacity. */
  openGroupCount: z.coerce.number().int().min(1).max(50).optional(),
  openGroupSize: z.coerce.number().int().min(2).max(20).optional(),
  dueDate: z
    .string()
    .trim()
    .min(1, "Tarikh akhir diperlukan.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Tarikh tidak sah."),
  maxGrade: z.coerce.number().int().min(1).max(100).default(100),
});

export const deleteAssignmentSchema = z.object({ assignmentId: idSchema });

// Edit an existing assignment's details. Grouping mode is intentionally NOT
// editable (changing it would break existing groups/submissions). A datetime
// string (or "") for dueDate / submissionCloseAt; submissionClose null clears it.
export const updateAssignmentSchema = z.object({
  assignmentId: idSchema,
  title: z.string().trim().min(1, "Tajuk diperlukan.").max(200),
  description: z.string().trim().max(10_000).optional().or(z.literal("")),
  dueDate: z
    .string()
    .trim()
    .min(1, "Tarikh akhir diperlukan.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Tarikh tidak sah."),
  maxGrade: z.coerce.number().int().min(1).max(100).default(100),
  /** Hard submission cutoff. "" / omitted = open (cleared). A datetime = closed at/after. */
  submissionCloseAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Tarikh tidak sah."),
});

export type CreateCourseContentInput = z.infer<typeof createCourseContentSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateCourseContentInput = z.infer<typeof updateCourseContentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
