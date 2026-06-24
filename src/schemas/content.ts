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

export const createAssignmentSchema = z.object({
  courseId: idSchema,
  title: z.string().trim().min(1, "Tajuk diperlukan.").max(200),
  description: z.string().trim().max(10_000).optional().or(z.literal("")),
  type: z.enum(["INDIVIDUAL", "GROUP"]),
  groupingMode: z
    .enum(["INHERIT", "CUSTOM", "RANDOM", "INDIVIDUAL"])
    .default("INHERIT"),
  groups: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Nama kumpulan diperlukan."),
        memberIds: z.array(idSchema).min(1),
      }),
    )
    .optional(),
  groupSize: z.coerce.number().int().min(2).max(20).optional(),
  dueDate: z
    .string()
    .trim()
    .min(1, "Tarikh akhir diperlukan.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Tarikh tidak sah."),
  maxGrade: z.coerce.number().int().min(1).max(100).default(100),
});

export const deleteAssignmentSchema = z.object({ assignmentId: idSchema });

export type CreateCourseContentInput = z.infer<typeof createCourseContentSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
