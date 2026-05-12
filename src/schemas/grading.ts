import { z } from "zod";
import { idSchema } from "./common";

export const gradeSubmissionSchema = z.object({
  submissionId: idSchema,
  grade: z.coerce
    .number()
    .int()
    .min(0, "Markah tidak boleh negatif.")
    .max(100, "Markah maksimum ialah 100."),
  feedback: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
