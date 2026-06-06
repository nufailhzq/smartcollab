"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/common/Toast";

type StreamEvent =
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
 * Subscribes the current user to /api/messages/stream and broadcasts incoming
 * events as `ukmfolio:new-message` / `ukmfolio:message-deleted` window events.
 * MessengerBubble listens for those events to play the chime, open the chat,
 * or flip a deleted message's bubble to "Mesej dipadam".
 *
 * Muted senders (passed in via initialMutedIds, refreshed on every router
 * navigation by the server) get silenced — no sound, no auto-open. They still
 * show as unread in the contact list.
 */
export function MessageStream({
  currentUserId,
  mutedIds,
  notificationsMuted = false,
}: {
  currentUserId: number;
  mutedIds: number[];
  /** Master mute — when true: no sound, no toast, no auto-open. */
  notificationsMuted?: boolean;
}) {
  const toast = useToast();
  const mutedRef = useRef(new Set(mutedIds));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const muteAllRef = useRef(notificationsMuted);

  // Refresh muted set if the prop changes (e.g. user just toggled mute).
  useEffect(() => {
    mutedRef.current = new Set(mutedIds);
  }, [mutedIds]);
  useEffect(() => {
    muteAllRef.current = notificationsMuted;
  }, [notificationsMuted]);

  useEffect(() => {
    if (currentUserId <= 0) return;
    const es = new EventSource("/api/messages/stream");

    es.onmessage = (e) => {
      let payload: StreamEvent;
      try {
        payload = JSON.parse(e.data) as StreamEvent;
      } catch {
        return;
      }
      if (payload.receiverId !== currentUserId) return;

      if (payload.kind === "message:deleted") {
        window.dispatchEvent(
          new CustomEvent("ukmfolio:message-deleted", { detail: payload }),
        );
        return;
      }

      // New message — play sound + dispatch (unless per-contact, all muted,
      // or the receiver is already looking at this DM right now).
      const activePartner =
        typeof window !== "undefined"
          ? Number(
              (window as unknown as { __ukmfolioActivePartner?: number })
                .__ukmfolioActivePartner ?? 0,
            )
          : 0;
      const viewingThisChat = activePartner === payload.senderId;

      const muted =
        viewingThisChat ||
        mutedRef.current.has(payload.senderId) ||
        muteAllRef.current;
      if (!muted) {
        playTing();
        toast.push({
          kind: "success",
          message: `${payload.senderName}: ${payload.preview}`,
        });
      }
      window.dispatchEvent(
        new CustomEvent("ukmfolio:new-message", {
          detail: { ...payload, silent: muted },
        }),
      );
    };

    es.onerror = () => {
      // Browser's EventSource auto-reconnects with exponential backoff —
      // nothing to do here. The next route navigation also re-mounts us.
    };

    return () => {
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  function playTing() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();

      // Two-note sine ping — close to the SmartBiz welcome chime.
      const notes = [
        { f: 1318.5, t: 0 },   // E6
        { f: 1760.0, t: 0.13 }, // A6
      ];
      const now = ctx.currentTime;
      for (const n of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = n.f;
        const start = now + n.t;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.28, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      }
    } catch {
      /* audio may be blocked by browser autoplay policy until first click */
    }
  }

  return null;
}
