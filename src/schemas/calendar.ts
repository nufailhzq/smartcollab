import { z } from "zod";
import { idSchema } from "./common";

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Tajuk diperlukan.").max(255),
  description: z.string().max(1000).optional().nullable(),
  date: z.coerce.date(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Format masa tidak sah.")
    .default("00:00:00"),
  courseId: idSchema.optional().nullable(),
  groupId: idSchema.optional().nullable(),
  reminder: z.boolean().default(false),
  /// 0 = no advance reminder, 60 = 1h, 1440 = 1d, 10080 = 1w
  notifyBeforeMinutes: z.number().int().min(0).max(60 * 24 * 30).optional().nullable(),
});

export const deleteEventSchema = z.object({ eventId: idSchema });

export const updateEventSchema = z.object({
  eventId: idSchema,
  title: z.string().trim().min(1, "Tajuk diperlukan.").max(255),
  description: z.string().max(1000).optional().nullable(),
  date: z.coerce.date(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Format masa tidak sah.")
    .default("00:00:00"),
});

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createTimetableEntrySchema = z
  .object({
    title: z.string().trim().min(1, "Tajuk diperlukan.").max(120),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(HHMM, "Format masa tidak sah (HH:MM)."),
    endTime: z.string().regex(HHMM, "Format masa tidak sah (HH:MM)."),
    location: z.string().trim().max(120).optional().nullable(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Format warna tidak sah.")
      .optional()
      .nullable(),
  })
  .refine((v) => v.startTime < v.endTime, {
    path: ["endTime"],
    message: "Masa tamat mesti selepas masa mula.",
  });

export const deleteTimetableEntrySchema = z.object({ entryId: idSchema });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type DeleteEventInput = z.infer<typeof deleteEventSchema>;
export type CreateTimetableInput = z.infer<typeof createTimetableEntrySchema>;
