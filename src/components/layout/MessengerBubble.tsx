"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Bell,
  BellOff,
  Check,
  Download,
  File as FileIcon,
  LogOut,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { askAi, type AiChatMessage } from "@/server/actions/ai-chat";
import { cn, initials } from "@/lib/utils";
import {
  acceptChatRequest,
  deleteMessage,
  loadConversation,
  rejectChatRequest,
  sendMessage,
  type ConversationPayload,
} from "@/server/actions/chat";
import {
  blockUser,
  getModerationState,
  muteUser,
  unblockUser,
  unmuteUser,
  type ModerationState,
} from "@/server/actions/moderation";
import { EmojiPicker } from "./chat/EmojiPicker";
import { AttachmentMenu } from "./chat/AttachmentMenu";
import type { AttachmentType } from "@/schemas/chat";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  searchUsers,
  sendFriendRequest,
} from "@/server/actions/friends";
import {
  addChatGroupMember,
  createChatGroup,
  leaveChatGroup,
  loadChatGroupConversation,
  removeChatGroupMember,
  renameChatGroup,
  sendChatGroupMessage,
  type ChatGroupConversationPayload,
} from "@/server/actions/chat-groups";
import { useToast } from "@/components/common/Toast";

export type BubbleContact = {
  id: number;
  name: string;
  role: "STUDENT" | "LECTURER" | "ADMIN";
  matricNum: string | null;
  unread: number;
  isFriend: boolean;
  relationship: "friend" | "enrolled-lecturer" | "taught-student" | "dm-history";
  lastMessageAt: string | null;
};

export type BubbleFriendRequest = {
  id: number;
  sender: { id: number; name: string; role: "STUDENT" | "LECTURER" | "ADMIN"; matricNum: string | null };
};

export type BubbleChatGroup = {
  id: number;
  name: string;
  memberCount: number;
  unread: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastSenderName: string | null;
  isAdmin: boolean;
};

type Props = {
  currentUserId: number;
  initialContacts: BubbleContact[];
  initialUnreadTotal: number;
  initialFriendRequests: BubbleFriendRequest[];
  initialChatGroups: BubbleChatGroup[];
};

type View =
  | "list"
  | "search"
  | "conversation"
  | "createGroup"
  | "groupConversation"
  | "groupSettings"
  | "aiConversation";
type SearchHit = { id: number; name: string; role: "STUDENT" | "LECTURER" | "ADMIN"; matricNum: string | null };

const RELATIONSHIP_LABEL: Record<BubbleContact["relationship"], string> = {
  friend: "Rakan",
  "enrolled-lecturer": "Pensyarah",
  "taught-student": "Pelajar",
  "dm-history": "Mesej",
};

export function MessengerBubble({
  currentUserId,
  initialContacts,
  initialUnreadTotal,
  initialFriendRequests,
  initialChatGroups,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [conversation, setConversation] = useState<ConversationPayload | null>(null);
  const [groupConversation, setGroupConversation] =
    useState<ChatGroupConversationPayload | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<
    | { file: File; type: AttachmentType; previewUrl: string }
    | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [pending, startTransition] = useTransition();

  const clearPendingAttachment = () => {
    if (pendingAttachment) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
  };

  const onPickAttachment = (file: File, type: AttachmentType) => {
    // Replace any prior selection (only one attachment per message for now).
    if (pendingAttachment) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment({ file, type, previewUrl: URL.createObjectURL(file) });
  };

  // Moderation state for the open DM partner (blocks + mutes).
  const [moderation, setModeration] = useState<ModerationState>({
    blocked: false,
    blockedMe: false,
    muted: false,
  });
  const [contactMenuOpen, setContactMenuOpen] = useState(false);

  // AI chat state
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [aiPending, setAiPending] = useState(false);

  // Top-of-chatbox tab filter for the list view
  type ListTab = "all" | "friends" | "lecturers" | "groups" | "ai";
  const [listTab, setListTab] = useState<ListTab>("all");

  // Create-group dialog state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState<SearchHit[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchHits, setMemberSearchHits] = useState<SearchHit[]>([]);

  const messageListRef = useRef<HTMLDivElement>(null);
  const requestCount = initialFriendRequests.length;
  const totalBadge = initialUnreadTotal + requestCount;

  // Auto-scroll to bottom when conversation messages change.
  useEffect(() => {
    if (
      (view !== "conversation" &&
        view !== "groupConversation" &&
        view !== "aiConversation") ||
      !messageListRef.current
    )
      return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [
    view,
    conversation?.messages.length,
    groupConversation?.messages.length,
    aiMessages.length,
    aiPending,
  ]);

  // Cross-component deep-link: listen for `ukmfolio:open-chat-group` and open
  // that conversation in the bubble. Other pages dispatch this after ensuring
  // the chat group exists.
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ chatGroupId: number }>).detail;
      if (!detail?.chatGroupId) return;
      setOpen(true);
      startTransition(async () => {
        const res = await loadChatGroupConversation(detail.chatGroupId);
        if (!res.ok) {
          toast.push({ kind: "error", message: res.error });
          return;
        }
        setGroupConversation(res.data);
        setView("groupConversation");
        router.refresh();
      });
    }
    window.addEventListener("ukmfolio:open-chat-group", onOpen);
    return () => window.removeEventListener("ukmfolio:open-chat-group", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-component deep-link: listen for `ukmfolio:open-dm` and open a 1:1
  // conversation with the given userId. Used by the lecturer hover card on
  // Kursus Saya to give students one-click access to message the lecturer.
  useEffect(() => {
    function onOpenDm(e: Event) {
      const detail = (e as CustomEvent<{ userId: number }>).detail;
      if (!detail?.userId) return;
      setOpen(true);
      startTransition(async () => {
        const res = await loadConversation(detail.userId);
        if (!res.ok) {
          toast.push({ kind: "error", message: res.error });
          return;
        }
        setConversation(res.data);
        setView("conversation");
        router.refresh();
      });
    }
    window.addEventListener("ukmfolio:open-dm", onOpenDm);
    return () => window.removeEventListener("ukmfolio:open-dm", onOpenDm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates from /api/messages/stream — auto-open the conversation when
  // a message lands (unless muted), and flip deleted bubbles in real time.
  useEffect(() => {
    function onNewMessage(e: Event) {
      const detail = (e as CustomEvent<{
        senderId: number;
        senderName: string;
        messageId: number;
        content: string;
        preview: string;
        timestamp: string;
        silent?: boolean;
      }>).detail;
      if (!detail) return;

      // If the existing conversation with this sender is already open,
      // append the new message in place so the user sees it without a refresh.
      if (
        view === "conversation" &&
        conversation?.partner.id === detail.senderId
      ) {
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    id: detail.messageId,
                    senderId: detail.senderId,
                    receiverId: currentUserId,
                    content: detail.content,
                    timestamp: detail.timestamp,
                    isRead: true,
                    deletedAt: null,
                    attachmentPath: null,
                    attachmentType: null,
                    attachmentName: null,
                    attachmentSize: null,
                  },
                ],
              }
            : prev,
        );
        return;
      }

      // Otherwise open the bubble + load the conversation with the sender.
      // Skip auto-open for muted contacts — they only get a silent unread bump.
      if (detail.silent) {
        router.refresh();
        return;
      }
      setOpen(true);
      startTransition(async () => {
        const res = await loadConversation(detail.senderId);
        if (res.ok) {
          setConversation(res.data);
          setView("conversation");
        }
        router.refresh();
      });
    }

    function onMessageDeleted(e: Event) {
      const detail = (e as CustomEvent<{ messageId: number }>).detail;
      if (!detail) return;
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === detail.messageId
                  ? {
                      ...m,
                      content: "",
                      deletedAt: new Date().toISOString(),
                      attachmentPath: null,
                      attachmentType: null,
                    }
                  : m,
              ),
            }
          : prev,
      );
      router.refresh();
    }

    window.addEventListener("ukmfolio:new-message", onNewMessage);
    window.addEventListener("ukmfolio:message-deleted", onMessageDeleted);
    return () => {
      window.removeEventListener("ukmfolio:new-message", onNewMessage);
      window.removeEventListener("ukmfolio:message-deleted", onMessageDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, conversation?.partner.id, currentUserId]);

  // Reload moderation flags whenever the active partner changes.
  useEffect(() => {
    if (view !== "conversation" || !conversation) return;
    let cancelled = false;
    (async () => {
      const res = await getModerationState(conversation.partner.id);
      if (!cancelled && res.ok) setModeration(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [view, conversation?.partner.id]);

  // Debounce friend search.
  useEffect(() => {
    if (view !== "search") return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchHits([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await searchUsers(q);
        if (res.ok) setSearchHits(res.data);
      });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, view]);

  // Debounce member search inside create-group dialog.
  useEffect(() => {
    if (view !== "createGroup" && view !== "groupSettings") return;
    const q = memberSearchQuery.trim();
    if (q.length < 2) {
      setMemberSearchHits([]);
      return;
    }
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await searchUsers(q);
        if (res.ok) setMemberSearchHits(res.data);
      });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberSearchQuery, view]);

  const openAiChat = () => {
    setView("aiConversation");
  };

  const onSendAi = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || aiPending) return;
    const next: AiChatMessage[] = [...aiMessages, { role: "user", content }];
    setAiMessages(next);
    setDraft("");
    setAiPending(true);
    (async () => {
      const res = await askAi(next);
      setAiPending(false);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setAiMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    })();
  };

  const onAiQuickPrompt = (prompt: string) => {
    if (aiPending) return;
    const next: AiChatMessage[] = [...aiMessages, { role: "user", content: prompt }];
    setAiMessages(next);
    setAiPending(true);
    (async () => {
      const res = await askAi(next);
      setAiPending(false);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setAiMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    })();
  };

  const onClearAi = () => {
    if (aiMessages.length === 0) return;
    if (!confirm("Padam semua perbualan dengan FolioBot AI?")) return;
    setAiMessages([]);
  };

  const onDeleteMessage = (messageId: number) => {
    if (!confirm("Padam mesej ini? Tindakan tidak boleh dipulihkan.")) return;
    startTransition(async () => {
      const res = await deleteMessage(messageId);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === messageId
                  ? {
                      ...m,
                      content: "",
                      deletedAt: new Date().toISOString(),
                      attachmentPath: null,
                      attachmentType: null,
                    }
                  : m,
              ),
            }
          : prev,
      );
      router.refresh();
    });
  };

  const onToggleMute = () => {
    if (!conversation) return;
    const partnerId = conversation.partner.id;
    startTransition(async () => {
      const res = moderation.muted
        ? await unmuteUser(partnerId)
        : await muteUser(partnerId);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setModeration((m) => ({ ...m, muted: !m.muted }));
      toast.push({
        kind: "success",
        message: moderation.muted ? "Notifikasi dipulihkan." : "Notifikasi disenyapkan.",
      });
      router.refresh();
    });
  };

  const onToggleBlock = () => {
    if (!conversation) return;
    const partnerId = conversation.partner.id;
    if (!moderation.blocked) {
      if (!confirm(`Blok ${conversation.partner.name}? Anda dan dia tidak akan dapat menghantar mesej.`)) return;
    }
    startTransition(async () => {
      const res = moderation.blocked
        ? await unblockUser(partnerId)
        : await blockUser(partnerId);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setModeration((m) => ({ ...m, blocked: !m.blocked }));
      toast.push({
        kind: "success",
        message: moderation.blocked ? "Blok dibuka." : "Pengguna diblok.",
      });
      router.refresh();
    });
  };

  const onAcceptChatRequest = () => {
    if (!conversation) return;
    startTransition(async () => {
      const res = await acceptChatRequest(conversation.partner.id);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      // Flip local snapshot so the input renders without reloading.
      setConversation((prev) =>
        prev ? { ...prev, requestStatus: "open" } : prev,
      );
      toast.push({ kind: "success", message: "Permintaan chat diterima." });
      router.refresh();
    });
  };

  const onRejectChatRequest = () => {
    if (!conversation) return;
    if (!confirm("Tolak permintaan chat ini? Mesej akan dipadam.")) return;
    startTransition(async () => {
      const res = await rejectChatRequest(conversation.partner.id);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Permintaan ditolak." });
      setConversation(null);
      setView("list");
      router.refresh();
    });
  };

  const openContact = (contact: BubbleContact) => {
    startTransition(async () => {
      const res = await loadConversation(contact.id);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setConversation(res.data);
      setView("conversation");
      router.refresh();
    });
  };

  const onSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!conversation) return;
    const content = draft.trim();
    if (!content && !pendingAttachment) return;

    const fd = new FormData();
    fd.set("receiverId", String(conversation.partner.id));
    fd.set("content", content);
    if (pendingAttachment) {
      fd.set("attachment", pendingAttachment.file);
      fd.set("attachmentType", pendingAttachment.type);
    }

    startTransition(async () => {
      const res = await sendMessage(fd);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: res.data.id,
                  senderId: res.data.senderId,
                  receiverId: conversation.partner.id,
                  content: res.data.content,
                  timestamp: new Date(res.data.timestamp as unknown as string).toISOString(),
                  isRead: res.data.isRead,
                  deletedAt: null,
                  attachmentPath: res.data.attachmentPath,
                  attachmentType: res.data.attachmentType,
                  attachmentName: res.data.attachmentName,
                  attachmentSize: res.data.attachmentSize,
                },
              ],
            }
          : prev,
      );
      setDraft("");
      clearPendingAttachment();
      router.refresh();
    });
  };

  const onAccept = (friendshipId: number) => {
    startTransition(async () => {
      const res = await acceptFriendRequest({ friendshipId });
      if (!res.ok) toast.push({ kind: "error", message: res.error });
      else router.refresh();
    });
  };

  const onReject = (friendshipId: number) => {
    startTransition(async () => {
      const res = await rejectFriendRequest({ friendshipId });
      if (!res.ok) toast.push({ kind: "error", message: res.error });
      else router.refresh();
    });
  };

  const onSendFriendRequest = (toId: number) => {
    startTransition(async () => {
      const res = await sendFriendRequest({ to: toId });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Permintaan rakan dihantar." });
      setSearchHits((prev) => prev.filter((h) => h.id !== toId));
    });
  };

  const openChatGroup = (chatGroupId: number) => {
    startTransition(async () => {
      const res = await loadChatGroupConversation(chatGroupId);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setGroupConversation(res.data);
      setView("groupConversation");
      router.refresh();
    });
  };

  const onSendGroup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!groupConversation) return;
    const content = draft.trim();
    if (!content && !pendingAttachment) return;

    const fd = new FormData();
    fd.set("chatGroupId", String(groupConversation.group.id));
    fd.set("content", content);
    if (pendingAttachment) {
      fd.set("attachment", pendingAttachment.file);
      fd.set("attachmentType", pendingAttachment.type);
    }

    startTransition(async () => {
      const res = await sendChatGroupMessage(fd);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setGroupConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: res.data.id,
                  senderId: res.data.senderId,
                  senderName: "Anda",
                  content: res.data.content,
                  timestamp: new Date(
                    res.data.timestamp as unknown as string,
                  ).toISOString(),
                  attachmentPath: res.data.attachmentPath,
                  attachmentType: res.data.attachmentType,
                  attachmentName: res.data.attachmentName,
                  attachmentSize: res.data.attachmentSize,
                },
              ],
            }
          : prev,
      );
      setDraft("");
      clearPendingAttachment();
      router.refresh();
    });
  };

  const openCreateGroup = () => {
    setNewGroupName("");
    setNewGroupMembers([]);
    setMemberSearchQuery("");
    setMemberSearchHits([]);
    setView("createGroup");
  };

  const onCreateGroup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) {
      toast.push({ kind: "error", message: "Sila masukkan nama kumpulan." });
      return;
    }
    if (newGroupMembers.length === 0) {
      toast.push({ kind: "error", message: "Pilih sekurang-kurangnya seorang ahli." });
      return;
    }
    startTransition(async () => {
      const res = await createChatGroup({
        name,
        memberIds: newGroupMembers.map((m) => m.id),
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Kumpulan chat dicipta." });
      setView("list");
      router.refresh();
      // Auto-open the new group
      openChatGroup(res.data.id);
    });
  };

  const onAddMemberToGroup = (userId: number) => {
    if (!groupConversation) return;
    startTransition(async () => {
      const res = await addChatGroupMember({
        chatGroupId: groupConversation.group.id,
        userId,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Ahli ditambah." });
      // Reload conversation to refresh member list
      const reload = await loadChatGroupConversation(groupConversation.group.id);
      if (reload.ok) setGroupConversation(reload.data);
      setMemberSearchQuery("");
      setMemberSearchHits([]);
      router.refresh();
    });
  };

  const onRemoveMemberFromGroup = (userId: number) => {
    if (!groupConversation) return;
    if (!confirm("Keluarkan ahli ini dari kumpulan?")) return;
    startTransition(async () => {
      const res = await removeChatGroupMember({
        chatGroupId: groupConversation.group.id,
        userId,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Ahli dikeluarkan." });
      const reload = await loadChatGroupConversation(groupConversation.group.id);
      if (reload.ok) setGroupConversation(reload.data);
      router.refresh();
    });
  };

  const onLeaveGroup = () => {
    if (!groupConversation) return;
    if (!confirm(`Keluar dari "${groupConversation.group.name}"?`)) return;
    startTransition(async () => {
      const res = await leaveChatGroup({ chatGroupId: groupConversation.group.id });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Anda telah keluar." });
      setGroupConversation(null);
      setView("list");
      router.refresh();
    });
  };

  const onRenameGroup = () => {
    if (!groupConversation) return;
    const newName = prompt("Nama baharu kumpulan:", groupConversation.group.name);
    if (!newName || newName.trim() === groupConversation.group.name) return;
    startTransition(async () => {
      const res = await renameChatGroup({
        chatGroupId: groupConversation.group.id,
        name: newName.trim(),
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      setGroupConversation((prev) =>
        prev
          ? { ...prev, group: { ...prev.group, name: newName.trim() } }
          : prev,
      );
      router.refresh();
    });
  };

  const groupedContacts = useMemo(() => {
    const friends = initialContacts.filter((c) => c.relationship === "friend");
    const lecturers = initialContacts.filter((c) => c.relationship === "enrolled-lecturer");
    const students = initialContacts.filter((c) => c.relationship === "taught-student");
    const others = initialContacts.filter((c) => c.relationship === "dm-history");
    return { friends, lecturers, students, others };
  }, [initialContacts]);

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setView(conversation ? "conversation" : "list");
        }}
        aria-label="Mesej"
        className={cn(
          "fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-ukm-teal via-sky-500 to-ukm-cyan text-white shadow-[0_10px_25px_rgba(14,165,233,0.45)] transition-all duration-300 ease-spring hover:scale-110 hover:rotate-6 hover:shadow-glow active:scale-95 sm:bottom-6 sm:right-6",
          open && "scale-95 opacity-90 rotate-0",
        )}
      >
        <MessageCircle size={24} />
        {totalBadge > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-[22px] min-w-[22px] animate-pop-in place-items-center rounded-full border-2 border-white bg-ukm-red px-1 text-[11px] font-bold text-white">
            {totalBadge > 99 ? "99+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 bottom-20 top-2 z-40 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_15px_40px_rgba(15,39,68,0.22)] animate-fade-in sm:inset-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[620px] sm:max-h-[calc(100vh-7rem)] sm:w-[420px] sm:max-w-[calc(100vw-2rem)]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/60 px-4 py-3">
            <div className="flex items-center gap-2">
              {view !== "list" ? (
                <button
                  type="button"
                  onClick={() =>
                    setView(view === "groupSettings" ? "groupConversation" : "list")
                  }
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy"
                  aria-label="Kembali"
                >
                  <ArrowLeft size={16} />
                </button>
              ) : null}
              <h3 className="flex items-center gap-1.5 text-base font-bold text-ukm-navy">
                {view === "aiConversation" && (
                  <Sparkles size={14} className="text-ukm-orange" />
                )}
                {view === "conversation"
                  ? conversation?.partner.name
                  : view === "groupConversation"
                    ? groupConversation?.group.name
                    : view === "groupSettings"
                      ? "Tetapan Kumpulan"
                      : view === "search"
                        ? "Cari Rakan"
                        : view === "createGroup"
                          ? "Kumpulan Chat Baharu"
                          : view === "aiConversation"
                            ? "FolioBot AI"
                            : "Mesej"}
              </h3>
              {view === "groupConversation" && groupConversation && (
                <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                  {groupConversation.group.members.length} ahli
                </span>
              )}
              {view === "aiConversation" && (
                <span className="rounded-full bg-gradient-to-r from-ukm-orange to-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  BETA
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {view === "list" && (
                <>
                  <button
                    type="button"
                    onClick={openCreateGroup}
                    aria-label="Cipta kumpulan chat"
                    title="Cipta kumpulan chat"
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchHits([]);
                      setView("search");
                    }}
                    aria-label="Cari rakan"
                    title="Cari rakan"
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy"
                  >
                    <UserPlus size={16} />
                  </button>
                </>
              )}
              {view === "groupConversation" && (
                <button
                  type="button"
                  onClick={() => setView("groupSettings")}
                  aria-label="Tetapan kumpulan"
                  title="Tetapan kumpulan"
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy"
                >
                  <Settings size={16} />
                </button>
              )}
              {view === "aiConversation" && aiMessages.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAi}
                  aria-label="Mulakan perbualan baharu"
                  title="Mulakan perbualan baharu"
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-ukm-orange"
                >
                  <Plus size={16} />
                </button>
              )}
              {view === "conversation" && conversation && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setContactMenuOpen((v) => !v)}
                    aria-label="Pilihan chat"
                    title="Pilihan chat"
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {contactMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setContactMenuOpen(false)}
                        aria-hidden
                      />
                      <div className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            setContactMenuOpen(false);
                            onToggleMute();
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {moderation.muted ? (
                            <>
                              <Bell size={14} className="text-emerald-600" />
                              Pulihkan notifikasi
                            </>
                          ) : (
                            <>
                              <BellOff size={14} className="text-slate-500" />
                              Senyapkan notifikasi
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setContactMenuOpen(false);
                            onToggleBlock();
                          }}
                          className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm text-ukm-red hover:bg-red-50"
                        >
                          <Ban size={14} />
                          {moderation.blocked ? "Buka blok" : "Blok pengguna"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {view === "list" && (
            <div className="flex flex-1 flex-col overflow-hidden bg-white">
              {/* Tab strip — switch between sections */}
              <div className="flex gap-1 border-b border-slate-200 bg-slate-50/80 px-2 py-2">
                {(
                  [
                    { id: "all", label: "Semua", icon: MessageCircle, tint: "from-ukm-teal to-sky-600" },
                    { id: "friends", label: "Rakan", icon: UserPlus, tint: "from-ukm-pink to-rose-500" },
                    { id: "groups", label: "Kumpulan", icon: Users, tint: "from-emerald-500 to-teal-600" },
                    { id: "ai", label: "AI", icon: Sparkles, tint: "from-ukm-orange to-amber-500" },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = listTab === tab.id;
                  const count =
                    tab.id === "friends"
                      ? groupedContacts.friends.length
                      : tab.id === "groups"
                        ? initialChatGroups.length
                        : 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setListTab(tab.id)}
                      className={cn(
                        "group relative flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-bold transition-all duration-200 ease-spring",
                        active
                          ? `bg-gradient-to-br ${tab.tint} text-white shadow-soft`
                          : "text-slate-500 hover:bg-white hover:text-ukm-navy",
                      )}
                    >
                      <Icon size={16} className={active ? "" : "group-hover:scale-110 transition-transform"} />
                      <span className="leading-none">{tab.label}</span>
                      {count > 0 && !active && (
                        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-ukm-orange px-1 text-[9px] font-bold text-white">
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto">
              {/* FolioBot AI — pinned virtual contact (shown when tab is All or AI) */}
              {(listTab === "all" || listTab === "ai") && (
              <button
                type="button"
                onClick={openAiChat}
                className="group flex w-full items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-orange-50 via-amber-50 to-sky-50 px-4 py-3.5 text-left transition hover:from-orange-100 hover:via-amber-100 hover:to-sky-100"
              >
                <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ukm-orange via-amber-500 to-ukm-teal text-white shadow-glow-orange transition group-hover:scale-110 group-hover:rotate-6">
                  <Sparkles size={20} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-base font-bold text-ukm-navy">FolioBot AI</p>
                    <span className="rounded-full bg-gradient-to-r from-ukm-orange to-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      AI
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    Pembantu pintar untuk bantu anda belajar
                  </p>
                </div>
              </button>
              )}

              {listTab === "ai" && aiMessages.length === 0 && (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-ukm-navy">Pembantu Belajar AI ✨</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tekan FolioBot AI di atas untuk mula bertanya.
                  </p>
                </div>
              )}

              {(listTab === "all" || listTab === "friends") && requestCount > 0 && (
                <section className="border-b border-slate-100 bg-orange-50 px-4 py-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ukm-orange">
                    Permintaan Rakan ({requestCount})
                  </p>
                  <ul className="space-y-2">
                    {initialFriendRequests.map((fr) => (
                      <li
                        key={fr.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"
                      >
                        <Avatar name={fr.sender.name} role={fr.sender.role} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ukm-navy">{fr.sender.name}</p>
                          <p className="truncate text-[10px] text-slate-500">
                            {fr.sender.matricNum ?? fr.sender.role}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAccept(fr.id)}
                          disabled={pending}
                          className="rounded-md bg-emerald-100 p-1.5 text-emerald-700 hover:bg-emerald-200 disabled:opacity-40"
                          aria-label="Terima"
                          title="Terima"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(fr.id)}
                          disabled={pending}
                          className="rounded-md bg-red-100 p-1.5 text-red-700 hover:bg-red-200 disabled:opacity-40"
                          aria-label="Tolak"
                          title="Tolak"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(listTab === "all" || listTab === "groups") && initialChatGroups.length > 0 && (
                <ChatGroupSection groups={initialChatGroups} onOpen={openChatGroup} />
              )}

              {listTab === "groups" && initialChatGroups.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
                    <Users className="text-emerald-600" size={26} />
                  </div>
                  <p className="text-base font-bold text-ukm-navy">Tiada kumpulan lagi</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Tekan + di atas untuk cipta kumpulan chat baharu.
                  </p>
                </div>
              )}

              {listTab === "friends" && groupedContacts.friends.length === 0 && requestCount === 0 && (
                <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100">
                    <UserPlus className="text-ukm-pink" size={26} />
                  </div>
                  <p className="text-base font-bold text-ukm-navy">Tiada rakan lagi</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Cari rakan dengan butang tambah-rakan di atas.
                  </p>
                </div>
              )}

              {listTab === "all" && initialContacts.length === 0 && initialChatGroups.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                  <MessageCircle className="mb-3 text-slate-300" size={32} />
                  <p className="text-base font-bold text-ukm-navy">Tiada perbualan lagi</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Tekan + untuk cipta kumpulan chat, atau ikon tambah-rakan untuk cari rakan.
                  </p>
                </div>
              ) : (
                <>
                  {(listTab === "all" || listTab === "friends") &&
                    groupedContacts.friends.length > 0 && (
                      <ContactGroup
                        title="Rakan"
                        contacts={groupedContacts.friends}
                        onClick={openContact}
                      />
                    )}
                  {listTab === "all" && groupedContacts.lecturers.length > 0 && (
                    <ContactGroup
                      title="Pensyarah Kursus"
                      contacts={groupedContacts.lecturers}
                      onClick={openContact}
                    />
                  )}
                  {listTab === "all" && groupedContacts.students.length > 0 && (
                    <ContactGroup
                      title="Pelajar Kursus"
                      contacts={groupedContacts.students}
                      onClick={openContact}
                    />
                  )}
                  {listTab === "all" && groupedContacts.others.length > 0 && (
                    <ContactGroup
                      title="Sejarah Mesej"
                      contacts={groupedContacts.others}
                      onClick={openContact}
                    />
                  )}
                </>
              )}
              </div>
            </div>
          )}

          {view === "search" && (
            <div className="flex flex-1 flex-col bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-ukm-teal focus-within:bg-white">
                  <Search size={14} className="text-slate-400" />
                  <input
                    autoFocus
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau no. matrik…"
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Sekurang-kurangnya 2 aksara.</p>
              </div>
              <ul className="flex-1 overflow-y-auto">
                {searchHits.length === 0 ? (
                  <li className="px-4 py-10 text-center text-sm text-slate-400">
                    {searchQuery.trim().length < 2
                      ? "Mula menaip untuk mencari…"
                      : pending
                        ? "Mencari…"
                        : "Tiada hasil"}
                  </li>
                ) : (
                  searchHits.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 last:border-b-0 hover:bg-slate-50"
                    >
                      <Avatar name={u.name} role={u.role} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ukm-navy">{u.name}</p>
                        <p className="truncate text-[10px] text-slate-500">
                          {u.matricNum ?? u.role}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSendFriendRequest(u.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 text-xs font-semibold text-ukm-orange hover:bg-orange-200 disabled:opacity-40"
                      >
                        <UserPlus size={12} /> Tambah
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {view === "conversation" && conversation && (
            <>
              {conversation.requestStatus === "outgoing-pending" && (
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-800">
                  <p className="font-semibold">Permintaan chat dihantar</p>
                  <p className="text-[10px] text-amber-700">
                    {conversation.partner.name} perlu menerima permintaan ini
                    sebelum melihat mesej anda dalam senarai chat biasa.
                  </p>
                </div>
              )}
              {conversation.requestStatus === "incoming-pending" && (
                <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-[11px] text-sky-800">
                  <p className="font-semibold">
                    {conversation.partner.name} ingin memulakan chat
                  </p>
                  <p className="text-[10px] text-sky-700">
                    Terima untuk mula membalas, atau tolak untuk memadam mesej
                    ini.
                  </p>
                </div>
              )}
              <div
                ref={messageListRef}
                className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-3"
              >
                {conversation.messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    Mulakan perbualan dengan menghantar mesej pertama.
                  </p>
                ) : (
                  conversation.messages.map((m) => {
                    const mine = m.senderId === currentUserId;
                    const isDeleted = m.deletedAt !== null;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "group/msg flex items-center gap-1.5",
                          mine ? "justify-end" : "justify-start",
                        )}
                      >
                        {mine && !isDeleted && (
                          <button
                            type="button"
                            onClick={() => onDeleteMessage(m.id)}
                            disabled={pending}
                            title="Padam mesej"
                            aria-label="Padam mesej"
                            className="opacity-0 transition group-hover/msg:opacity-100 rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-ukm-red disabled:opacity-40"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                            isDeleted
                              ? "bg-slate-100 italic text-slate-500 border border-slate-200"
                              : mine
                                ? "bg-gradient-to-br from-ukm-teal to-sky-600 text-white"
                                : "bg-white text-slate-700 border border-slate-200",
                          )}
                        >
                          {isDeleted ? (
                            <p className="whitespace-pre-wrap break-words">Mesej dipadam</p>
                          ) : (
                            <>
                              {m.attachmentPath && (
                                <MessageAttachment
                                  path={m.attachmentPath}
                                  type={m.attachmentType}
                                  name={m.attachmentName}
                                  size={m.attachmentSize}
                                  mine={mine}
                                />
                              )}
                              {m.content && (
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                              )}
                            </>
                          )}
                          <p
                            className={cn(
                              "mt-1 text-[10px]",
                              mine && !isDeleted ? "text-slate-700" : "text-slate-400",
                            )}
                          >
                            {new Date(m.timestamp).toLocaleTimeString("ms-MY", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {moderation.blocked || moderation.blockedMe ? (
                <div className="border-t border-slate-200 bg-red-50 px-4 py-3 text-center text-xs text-ukm-red">
                  {moderation.blocked
                    ? "Anda telah blok pengguna ini. Buka blok melalui menu untuk membalas."
                    : "Anda tidak boleh menghantar mesej kepada pengguna ini."}
                </div>
              ) : conversation.requestStatus === "incoming-pending" ? (
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-3 py-3">
                  <button
                    type="button"
                    onClick={onRejectChatRequest}
                    disabled={pending}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-ukm-red hover:bg-red-50 hover:text-ukm-red disabled:opacity-50"
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={onAcceptChatRequest}
                    disabled={pending}
                    className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? "Menerima…" : "Terima Chat"}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={onSend}
                  className="space-y-2 border-t border-slate-200 bg-white px-3 py-2"
                >
                  {pendingAttachment && (
                    <AttachmentPreview
                      attachment={pendingAttachment}
                      onRemove={clearPendingAttachment}
                    />
                  )}
                  <div className="flex items-center gap-1">
                    <AttachmentMenu onPick={onPickAttachment} disabled={pending} />
                    <EmojiPicker onPick={(e) => setDraft((d) => d + e)} />
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={
                        conversation.requestStatus === "outgoing-pending"
                          ? "Taip mesej (menunggu jawapan)…"
                          : "Taip mesej…"
                      }
                      maxLength={2000}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-ukm-teal focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={pending || (!draft.trim() && !pendingAttachment)}
                      className="grid h-9 w-9 place-items-center rounded-lg bg-ukm-teal text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Hantar"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {view === "createGroup" && (
            <form onSubmit={onCreateGroup} className="flex flex-1 flex-col bg-white">
              <div className="space-y-3 border-b border-slate-200 px-4 py-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ukm-navy">
                    Nama Kumpulan
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    maxLength={80}
                    placeholder="Contoh: Kumpulan FYP Alpha"
                    className="input-base"
                  />
                </div>
                {newGroupMembers.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-ukm-navy">
                      Ahli Dipilih ({newGroupMembers.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {newGroupMembers.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700"
                        >
                          {m.name}
                          <button
                            type="button"
                            onClick={() =>
                              setNewGroupMembers((prev) =>
                                prev.filter((x) => x.id !== m.id),
                              )
                            }
                            className="rounded-full hover:bg-sky-200"
                            aria-label="Buang"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ukm-navy">
                    Tambah Ahli
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-ukm-teal focus-within:bg-white">
                    <Search size={14} className="text-slate-400" />
                    <input
                      type="search"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Cari nama atau no. matrik…"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
              <ul className="flex-1 overflow-y-auto">
                {memberSearchQuery.trim().length < 2 ? (
                  <li className="px-4 py-6 text-center text-xs text-slate-400">
                    Taip sekurang-kurangnya 2 aksara untuk cari ahli.
                  </li>
                ) : memberSearchHits.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-slate-400">
                    {pending ? "Mencari…" : "Tiada hasil"}
                  </li>
                ) : (
                  memberSearchHits
                    .filter((u) => u.id !== currentUserId)
                    .map((u) => {
                      const already = newGroupMembers.some((m) => m.id === u.id);
                      return (
                        <li
                          key={u.id}
                          className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 last:border-b-0 hover:bg-slate-50"
                        >
                          <Avatar name={u.name} role={u.role} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ukm-navy">
                              {u.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">
                              {u.matricNum ?? u.role}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={already}
                            onClick={() =>
                              setNewGroupMembers((prev) => [...prev, u])
                            }
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                              already
                                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                : "bg-ukm-teal text-white hover:bg-sky-600",
                            )}
                          >
                            {already ? "Dipilih" : "Pilih"}
                          </button>
                        </li>
                      );
                    })
                )}
              </ul>
              <footer className="border-t border-slate-200 bg-slate-50 px-3 py-2">
                <button
                  type="submit"
                  disabled={
                    pending || !newGroupName.trim() || newGroupMembers.length === 0
                  }
                  className="btn-primary w-full"
                >
                  <Users size={14} /> Cipta Kumpulan ({newGroupMembers.length + 1} ahli)
                </button>
              </footer>
            </form>
          )}

          {view === "groupConversation" && groupConversation && (
            <>
              <div
                ref={messageListRef}
                className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-3"
              >
                {groupConversation.messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    Mulakan perbualan dengan menghantar mesej pertama.
                  </p>
                ) : (
                  groupConversation.messages.map((m, i) => {
                    const mine = m.senderId === currentUserId;
                    const prev = groupConversation.messages[i - 1];
                    const showAuthor = !mine && (!prev || prev.senderId !== m.senderId);
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div className="max-w-[80%]">
                          {showAuthor && (
                            <p className="mb-0.5 ml-1 text-[10px] font-semibold text-ukm-navy">
                              {m.senderName}
                            </p>
                          )}
                          <div
                            className={cn(
                              "rounded-2xl px-3 py-2 text-sm shadow-sm",
                              mine
                                ? "bg-gradient-to-br from-ukm-teal to-sky-600 text-white"
                                : "border border-slate-200 bg-white text-slate-700",
                            )}
                          >
                            {m.attachmentPath && (
                              <MessageAttachment
                                path={m.attachmentPath}
                                type={m.attachmentType}
                                name={m.attachmentName}
                                size={m.attachmentSize}
                                mine={mine}
                              />
                            )}
                            {m.content && (
                              <p className="whitespace-pre-wrap break-words">{m.content}</p>
                            )}
                            <p
                              className={cn(
                                "mt-1 text-[10px]",
                                mine ? "text-white/80" : "text-slate-400",
                              )}
                            >
                              {new Date(m.timestamp).toLocaleTimeString("ms-MY", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form
                onSubmit={onSendGroup}
                className="space-y-2 border-t border-slate-200 bg-white px-3 py-2"
              >
                {pendingAttachment && (
                  <AttachmentPreview
                    attachment={pendingAttachment}
                    onRemove={clearPendingAttachment}
                  />
                )}
                <div className="flex items-center gap-1">
                  <AttachmentMenu onPick={onPickAttachment} disabled={pending} />
                  <EmojiPicker onPick={(e) => setDraft((d) => d + e)} />
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Mesej ke ${groupConversation.group.name}…`}
                    maxLength={2000}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-ukm-teal focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={pending || (!draft.trim() && !pendingAttachment)}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-ukm-teal text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Hantar"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          )}

          {view === "aiConversation" && (
            <>
              <div
                ref={messageListRef}
                className="flex-1 space-y-2 overflow-y-auto bg-gradient-to-b from-orange-50/40 via-white to-sky-50/40 px-4 py-3"
              >
                {aiMessages.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="mb-3 grid h-14 w-14 animate-float-y place-items-center rounded-2xl bg-gradient-to-br from-ukm-orange via-amber-500 to-ukm-teal text-white shadow-glow-orange">
                      <Sparkles size={26} />
                    </div>
                    <p className="text-sm font-bold text-ukm-navy">
                      Hai! Saya FolioBot AI 👋
                    </p>
                    <p className="mt-1 max-w-[260px] text-xs text-slate-500">
                      Tanya saya apa-apa tentang kursus, tugasan, atau coding.
                      Saya di sini untuk bantu anda faham, bukan buat tugasan.
                    </p>
                    <div className="mt-4 flex w-full flex-col gap-1.5">
                      {[
                        "Terangkan konsep OOP dalam Java secara ringkas",
                        "Beri tips belajar struktur data",
                        "Apa beza SQL JOIN dan UNION?",
                      ].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => onAiQuickPrompt(q)}
                          className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:-translate-y-0.5 hover:border-ukm-orange hover:bg-orange-50 hover:text-ukm-navy hover:shadow-soft"
                        >
                          <span className="mr-1">💡</span>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  aiMessages.map((m, i) => {
                    const mine = m.role === "user";
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex animate-fade-in",
                          mine ? "justify-end" : "justify-start gap-2",
                        )}
                      >
                        {!mine && (
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ukm-orange to-amber-500 text-white shadow-sm">
                            <Sparkles size={14} />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                            mine
                              ? "bg-gradient-to-br from-ukm-teal to-sky-600 text-white"
                              : "border border-orange-100 bg-white text-slate-700",
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {m.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {aiPending && (
                  <div className="flex animate-fade-in items-end gap-2">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ukm-orange to-amber-500 text-white shadow-sm">
                      <Sparkles size={14} />
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-3 py-2.5 shadow-sm">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-ukm-orange [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-ukm-teal" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <form
                onSubmit={onSendAi}
                className="border-t border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Tanya FolioBot AI..."
                    maxLength={2000}
                    disabled={aiPending}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-ukm-orange focus:bg-white disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={aiPending || !draft.trim()}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-ukm-orange to-amber-500 text-white shadow-glow-orange transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Hantar"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <p className="mt-1 px-1 text-[10px] text-slate-400">
                  ✨ Dijana oleh Gemini. Jawapan mungkin tidak tepat — sahkan
                  semula dengan pensyarah.
                </p>
              </form>
            </>
          )}

          {view === "groupSettings" && groupConversation && (
            <div className="flex flex-1 flex-col bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Nama Kumpulan
                    </p>
                    <p className="text-base font-semibold text-ukm-navy">
                      {groupConversation.group.name}
                    </p>
                  </div>
                  {groupConversation.group.isAdmin && (
                    <button
                      type="button"
                      onClick={onRenameGroup}
                      className="btn-secondary text-xs"
                    >
                      Tukar Nama
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <p className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Ahli ({groupConversation.group.members.length})
                </p>
                <ul>
                  {groupConversation.group.members.map((m) => {
                    const isMe = m.id === currentUserId;
                    return (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 last:border-b-0"
                      >
                        <Avatar name={m.name} role={m.role} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-ukm-navy">
                              {m.name}
                            </p>
                            {isMe && (
                              <span className="rounded-full bg-ukm-orange px-2 py-0.5 text-[10px] font-semibold text-white">
                                Anda
                              </span>
                            )}
                            {m.isAdmin && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[10px] text-slate-500">
                            {m.matricNum ?? m.role}
                          </p>
                        </div>
                        {groupConversation.group.isAdmin && !isMe && (
                          <button
                            type="button"
                            onClick={() => onRemoveMemberFromGroup(m.id)}
                            disabled={pending}
                            title="Keluarkan ahli"
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-ukm-red"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {groupConversation.group.isAdmin && (
                  <div className="border-t border-slate-200 px-4 py-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Tambah Ahli
                    </p>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-ukm-teal focus-within:bg-white">
                      <Search size={14} className="text-slate-400" />
                      <input
                        type="search"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder="Cari pengguna…"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>
                    {memberSearchQuery.trim().length >= 2 && (
                      <ul className="mt-2">
                        {memberSearchHits
                          .filter(
                            (u) =>
                              u.id !== currentUserId &&
                              !groupConversation.group.members.some((m) => m.id === u.id),
                          )
                          .map((u) => (
                            <li
                              key={u.id}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                            >
                              <Avatar name={u.name} role={u.role} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-ukm-navy">
                                  {u.name}
                                </p>
                                <p className="truncate text-[10px] text-slate-500">
                                  {u.matricNum ?? u.role}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onAddMemberToGroup(u.id)}
                                disabled={pending}
                                className="rounded-md bg-ukm-teal px-2 py-1 text-xs font-semibold text-white hover:bg-sky-600 disabled:opacity-40"
                              >
                                <UserPlus size={12} className="inline" /> Tambah
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <footer className="border-t border-slate-200 bg-slate-50 px-3 py-2">
                <button type="button" onClick={onLeaveGroup} className="btn-danger w-full">
                  <LogOut size={14} /> Keluar Kumpulan
                </button>
              </footer>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ContactGroup({
  title,
  contacts,
  onClick,
}: {
  title: string;
  contacts: BubbleContact[];
  onClick: (c: BubbleContact) => void;
}) {
  return (
    <section className="border-b border-slate-100 last:border-b-0">
      <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <ul>
        {contacts.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onClick(c)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-sky-50/60"
            >
              <Avatar name={c.name} role={c.role} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[15px] font-semibold text-ukm-navy">{c.name}</p>
                  {c.unread > 0 && (
                    <span className="grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-gradient-to-br from-ukm-orange to-amber-500 px-1.5 text-[11px] font-bold text-white shadow-soft">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500">
                  {c.matricNum ?? RELATIONSHIP_LABEL[c.relationship]}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Avatar({
  name,
  role,
}: {
  name: string;
  role: "STUDENT" | "LECTURER" | "ADMIN";
}) {
  const tint =
    role === "LECTURER"
      ? "bg-gradient-to-br from-purple-100 to-fuchsia-100 text-purple-700"
      : role === "ADMIN"
        ? "bg-gradient-to-br from-pink-100 to-rose-100 text-pink-700"
        : "bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700";
  return (
    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold shadow-sm", tint)}>
      {initials(name)}
    </div>
  );
}

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: { file: File; type: AttachmentType; previewUrl: string };
  onRemove: () => void;
}) {
  const sizeMb = (attachment.file.size / 1024 / 1024).toFixed(1);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      {attachment.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.previewUrl}
          alt=""
          className="h-12 w-12 rounded object-cover"
        />
      ) : attachment.type === "video" ? (
        <video
          src={attachment.previewUrl}
          className="h-12 w-12 rounded bg-black object-cover"
          muted
        />
      ) : (
        <div className="grid h-12 w-12 place-items-center rounded bg-orange-50 text-ukm-orange">
          <FileIcon size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-ukm-navy">
          {attachment.file.name}
        </p>
        <p className="text-[10px] text-slate-500">
          {sizeMb} MB · {attachment.type === "image" ? "Imej" : attachment.type === "video" ? "Video" : "Fail"}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Buang lampiran"
        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-ukm-red"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function MessageAttachment({
  path,
  type,
  name,
  size,
  mine,
}: {
  path: string;
  type: string | null;
  name: string | null;
  size: string | null;
  mine: boolean;
}) {
  if (type === "image") {
    return (
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-1 block overflow-hidden rounded-lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={path}
          alt={name ?? ""}
          loading="lazy"
          className="max-h-60 w-full max-w-[240px] object-cover"
        />
      </a>
    );
  }
  if (type === "video") {
    return (
      <video
        src={path}
        controls
        playsInline
        preload="metadata"
        className="mb-1 max-h-60 w-full max-w-[240px] rounded-lg bg-black"
      />
    );
  }
  // Generic file: show pill with download.
  return (
    <a
      href={path}
      target="_blank"
      rel="noopener noreferrer"
      download={name ?? undefined}
      className={cn(
        "mb-1 flex max-w-[260px] items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition",
        mine
          ? "border-white/30 bg-white/10 text-white hover:bg-white/15"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
      )}
    >
      <FileIcon size={16} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name ?? "Fail"}</p>
        {size && (
          <p className={cn("text-[10px]", mine ? "text-white/70" : "text-slate-500")}>
            {size}
          </p>
        )}
      </div>
      <Download size={12} className="shrink-0" />
    </a>
  );
}

function ChatGroupSection({
  groups,
  onOpen,
}: {
  groups: BubbleChatGroup[];
  onOpen: (id: number) => void;
}) {
  return (
    <section className="border-b border-slate-100">
      <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Kumpulan Chat
      </p>
      <ul>
        {groups.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => onOpen(g.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-emerald-50/40"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <Users size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[15px] font-semibold text-ukm-navy">{g.name}</p>
                  {g.unread > 0 && (
                    <span className="grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-gradient-to-br from-ukm-orange to-amber-500 px-1.5 text-[11px] font-bold text-white shadow-soft">
                      {g.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500">
                  {g.lastMessagePreview
                    ? `${g.lastSenderName ?? ""}${g.lastSenderName ? ": " : ""}${g.lastMessagePreview}`
                    : `${g.memberCount} ahli`}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
