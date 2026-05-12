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
  Check,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import {
  loadConversation,
  sendMessage,
  type ConversationPayload,
} from "@/server/actions/chat";
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
  | "groupSettings";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [pending, startTransition] = useTransition();

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
      (view !== "conversation" && view !== "groupConversation") ||
      !messageListRef.current
    )
      return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [view, conversation?.messages.length, groupConversation?.messages.length]);

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
    if (!content) return;
    startTransition(async () => {
      const res = await sendMessage({ receiverId: conversation.partner.id, content });
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
                },
              ],
            }
          : prev,
      );
      setDraft("");
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
    if (!content) return;
    startTransition(async () => {
      const res = await sendChatGroupMessage({
        chatGroupId: groupConversation.group.id,
        content,
      });
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
                },
              ],
            }
          : prev,
      );
      setDraft("");
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
          "fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-ukm-teal to-ukm-cyan text-white shadow-[0_10px_25px_rgba(14,165,233,0.4)] transition hover:scale-105",
          open && "scale-95 opacity-90",
        )}
      >
        <MessageCircle size={24} />
        {totalBadge > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-[22px] min-w-[22px] place-items-center rounded-full border-2 border-white bg-ukm-red px-1 text-[11px] font-bold text-white">
            {totalBadge > 99 ? "99+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[560px] max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,39,68,0.18)] animate-fade-in">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
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
              <h3 className="text-sm font-semibold text-ukm-navy">
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
                          : "Mesej"}
              </h3>
              {view === "groupConversation" && groupConversation && (
                <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                  {groupConversation.group.members.length} ahli
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
            <div className="flex-1 overflow-y-auto bg-white">
              {requestCount > 0 && (
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

              {initialChatGroups.length > 0 && (
                <ChatGroupSection groups={initialChatGroups} onOpen={openChatGroup} />
              )}

              {initialContacts.length === 0 && initialChatGroups.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
                  <MessageCircle className="mb-3 text-slate-300" size={32} />
                  <p className="text-sm font-semibold text-ukm-navy">Tiada perbualan lagi</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tekan + untuk cipta kumpulan chat, atau ikon tambah-rakan untuk cari rakan.
                  </p>
                </div>
              ) : (
                <>
                  {groupedContacts.friends.length > 0 && (
                    <ContactGroup
                      title="Rakan"
                      contacts={groupedContacts.friends}
                      onClick={openContact}
                    />
                  )}
                  {groupedContacts.lecturers.length > 0 && (
                    <ContactGroup
                      title="Pensyarah Kursus"
                      contacts={groupedContacts.lecturers}
                      onClick={openContact}
                    />
                  )}
                  {groupedContacts.students.length > 0 && (
                    <ContactGroup
                      title="Pelajar Kursus"
                      contacts={groupedContacts.students}
                      onClick={openContact}
                    />
                  )}
                  {groupedContacts.others.length > 0 && (
                    <ContactGroup
                      title="Sejarah Mesej"
                      contacts={groupedContacts.others}
                      onClick={openContact}
                    />
                  )}
                </>
              )}
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
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                            mine
                              ? "bg-gradient-to-br from-ukm-teal to-sky-600 text-white"
                              : "bg-white text-slate-700 border border-slate-200",
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p
                            className={cn(
                              "mt-1 text-[10px]",
                              mine ? "text-slate-700" : "text-slate-400",
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
              <form
                onSubmit={onSend}
                className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Taip mesej…"
                  maxLength={2000}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-ukm-teal focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={pending || !draft.trim()}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-ukm-teal text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Hantar"
                >
                  <Send size={16} />
                </button>
              </form>
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
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
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
                className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2"
              >
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
                  disabled={pending || !draft.trim()}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-ukm-teal text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Hantar"
                >
                  <Send size={16} />
                </button>
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
      <p className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <ul>
        {contacts.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onClick(c)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-slate-50"
            >
              <Avatar name={c.name} role={c.role} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ukm-navy">{c.name}</p>
                  {c.unread > 0 && (
                    <span className="grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-ukm-orange px-1 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-[10px] text-slate-500">
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
      ? "bg-purple-100 text-purple-700"
      : role === "ADMIN"
        ? "bg-pink-100 text-pink-700"
        : "bg-sky-100 text-sky-700";
  return (
    <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold", tint)}>
      {initials(name)}
    </div>
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
      <p className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Kumpulan Chat
      </p>
      <ul>
        {groups.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => onOpen(g.id)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-slate-50"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ukm-teal to-ukm-cyan text-xs font-bold text-white">
                <Users size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ukm-navy">{g.name}</p>
                  {g.unread > 0 && (
                    <span className="grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-ukm-orange px-1 text-[10px] font-bold text-white">
                      {g.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-slate-500">
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
