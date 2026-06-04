import { z } from "zod";
import { idSchema } from "./common";

export const MONITORING_NOTE_MAX_LENGTH = 600;

export const saveMonitoringNoteSchema = z.object({
  courseId: idSchema,
  studentId: idSchema,
  note: z.string().max(MONITORING_NOTE_MAX_LENGTH, "Catatan terlalu panjang."),
});

export type SaveMonitoringNoteInput = z.infer<typeof saveMonitoringNoteSchema>;
