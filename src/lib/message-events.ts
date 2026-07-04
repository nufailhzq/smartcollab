import { EventEmitter } from "events";

export type MessageEvent =
  | {
      kind: "message:new";
      receiverId: number;
      senderId: number;
      senderName: string;
      messageId: number;
      content: string;
      preview: string;
      timestamp: string;
      hasAttachment: boolean;
      // Full attachment payload so a picture/file renders live in an already-open
      // conversation without needing a reload. Null when text-only.
      attachmentPath: string | null;
      attachmentType: string | null;
      attachmentName: string | null;
      attachmentSize: string | null;
    }
  | {
      kind: "message:deleted";
      receiverId: number;
      senderId: number;
      messageId: number;
    }
  | {
      // Generic "something changed for this user" signal. The client reacts by
      // calling router.refresh() so the current page's Server Components
      // re-fetch from the DB — no payload needed beyond the target user.
      kind: "refresh";
      receiverId: number;
      /** Optional hint for what changed (telemetry/debug only). */
      reason?: string;
    };

/**
 * Process-wide pub-sub for chat events. SSE handlers subscribe per-user and
 * forward matching events down EventSource connections.
 *
 * This works because the Next.js runtime is a single Node process — server
 * actions and route handlers share the same module instance, so an in-memory
 * EventEmitter is enough. If we ever shard across multiple containers, swap
 * this out for Redis pub/sub without changing the call sites.
 */
declare global {
  // eslint-disable-next-line no-var
  var __ukmfolioMessageBus: EventEmitter | undefined;
}

export const messageBus: EventEmitter = (() => {
  if (!globalThis.__ukmfolioMessageBus) {
    const bus = new EventEmitter();
    bus.setMaxListeners(500); // 1 listener per active SSE client
    globalThis.__ukmfolioMessageBus = bus;
  }
  return globalThis.__ukmfolioMessageBus;
})();

export function emitMessageEvent(event: MessageEvent) {
  messageBus.emit("event", event);
}

/**
 * Push a live "refresh" signal to one or more users. Each connected client
 * reacts by calling router.refresh(), so whatever page they're on re-fetches
 * its server data. De-duplicates user IDs so a single change emits once per
 * user even if helpers overlap.
 */
export function emitRefresh(userIds: number | number[], reason?: string) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  for (const id of new Set(ids)) {
    if (id > 0) messageBus.emit("event", { kind: "refresh", receiverId: id, reason });
  }
}
