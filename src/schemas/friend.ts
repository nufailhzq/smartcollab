import { z } from "zod";
import { idSchema } from "./common";

export const sendFriendRequestSchema = z.object({ to: idSchema });
export const respondFriendRequestSchema = z.object({ friendshipId: idSchema });
export const removeFriendSchema = z.object({ friendId: idSchema });

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;
export type RemoveFriendInput = z.infer<typeof removeFriendSchema>;
