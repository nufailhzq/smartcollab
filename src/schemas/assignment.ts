import { z } from "zod";
import { idSchema } from "./common";

export const submitAssignmentSchema = z.object({
  assignmentId: idSchema,
  filePath: z.string().min(1, "Sila lampirkan fail.").max(500),
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
