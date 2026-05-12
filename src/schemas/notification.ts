import { z } from "zod";
import { idSchema } from "./common";

export const markNotificationReadSchema = z.object({ id: idSchema });

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
