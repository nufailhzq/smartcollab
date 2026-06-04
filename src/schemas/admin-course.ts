import { z } from "zod";
import { idSchema } from "./common";

const baseCourseFields = {
  code: z
    .string()
    .trim()
    .min(3, "Kod kursus mesti sekurang-kurangnya 3 aksara.")
    .max(20)
    .regex(/^[A-Za-z0-9]+$/, "Kod kursus hanya boleh mengandungi huruf dan nombor.")
    .transform((v) => v.toUpperCase()),
  title: z.string().trim().min(2, "Tajuk kursus diperlukan.").max(160),
  description: z
    .string()
    .trim()
    .max(2000)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  semester: z
    .string()
    .trim()
    .max(40)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  creditHours: z.coerce.number().int().min(0).max(10).nullable().default(3),
  lecturerId: z.coerce.number().int().positive().nullable().optional(),
};

export const createCourseSchema = z.object(baseCourseFields);

export const updateCourseSchema = z.object({
  courseId: idSchema,
  ...baseCourseFields,
});

export const deleteCourseSchema = z.object({ courseId: idSchema });

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
