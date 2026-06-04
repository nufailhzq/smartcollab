import { z } from "zod";

export const recentAccessTypeEnum = z.enum([
  "COURSE",
  "ASSIGNMENT",
  "GROUP",
  "CONTENT",
  "SUBMISSION",
]);

export const trackAccessSchema = z.object({
  type: recentAccessTypeEnum,
  refId: z.coerce.number().int().positive().nullable(),
  title: z.string().trim().min(1).max(160),
  link: z.string().trim().min(1).max(500),
});

export type TrackAccessInput = z.infer<typeof trackAccessSchema>;
