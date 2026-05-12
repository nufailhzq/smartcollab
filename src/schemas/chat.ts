import { z } from "zod";
import { idSchema } from "./common";

export const sendMessageSchema = z.object({
  receiverId: idSchema,
  content: z.string().trim().min(1, "Mesej tidak boleh kosong.").max(2000, "Mesej terlalu panjang."),
});

export const markReadSchema = z.object({ fromUserId: idSchema });

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
