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
    }
  | {
      kind: "message:deleted";
      receiverId: number;
      senderId: number;
      messageId: number;
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
