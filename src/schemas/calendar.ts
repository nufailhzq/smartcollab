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
});

export const deleteEventSchema = z.object({ eventId: idSchema });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type DeleteEventInput = z.infer<typeof deleteEventSchema>;
