import { auth } from "@/lib/auth";
import { messageBus, type MessageEvent } from "@/lib/message-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events stream for live chat updates.
 *
 * The browser opens an EventSource to this route once per session; the
 * connection stays open and we push JSON-encoded MessageEvent payloads
 * whenever the in-process bus emits one for this user.
 *
 * We also send a 15-second heartbeat so reverse-proxies (Caddy/nginx) don't
 * close idle connections. The keep-alive comment is invisible to the client.
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: MessageEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          // Stream closed mid-write — bus listener gets cleaned up below.
        }
      };

      const handler = (event: MessageEvent) => {
        if (event.receiverId === userId) send(event);
      };
      messageBus.on("event", handler);

      // Initial hello so the client EventSource transitions to OPEN even
      // when no messages are pending.
      controller.enqueue(
        encoder.encode(`: connected as ${userId}\n\n`),
      );

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Clean up when the client disconnects.
      const close = () => {
        clearInterval(heartbeat);
        messageBus.off("event", handler);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // ReadableStream doesn't expose an "abort" hook directly — we use the
      // cancel callback below, which fires when the client closes the EventSource.
      (controller as unknown as { _close?: () => void })._close = close;
    },
    cancel() {
      const ctrl = this as unknown as { _close?: () => void };
      ctrl._close?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
