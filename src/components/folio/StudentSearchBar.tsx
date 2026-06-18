"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search, Sparkles, UserPlus, X, Check } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import {
  getFriendSuggestions,
  sendFriendRequest,
  type FriendSuggestion,
} from "@/server/actions/friends";
import { useToast } from "@/components/common/Toast";

type Hit = {
  id: number;
  name: string;
  role: "STUDENT" | "LECTURER";
  matricNum: string | null;
  faculty: string | null;
  program: string | null;
  avatarPath: string | null;
};

function RoleBadge({ role }: { role: "STUDENT" | "LECTURER" }) {
  if (role === "LECTURER") {
    return (
      <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-700">
        Pensyarah
      </span>
    );
  }
  return (
    <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700">
      Pelajar
    </span>
  );
}

/**
 * Global student search + friend suggestions.
 * - Empty input + focus: shows friend suggestions (with "Tambah" button)
 * - Typing: live search to /api/folio/search
 * - Sending a friend request removes that user and backfills with more suggestions
 */
export function StudentSearchBar() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoadedAt, setSuggestionsLoadedAt] = useState(0);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const showingSuggestions = open && query.trim().length === 0;

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const loadSuggestions = useCallback(
    async (excludeIds: number[] = []) => {
      setSuggestionsLoading(true);
      try {
        const res = await getFriendSuggestions(8, excludeIds);
        if (res.ok) {
          setSuggestions(res.data);
          setSuggestionsLoadedAt(Date.now());
        }
      } finally {
        setSuggestionsLoading(false);
      }
    },
    [],
  );

  // Lazy-load suggestions the first time the dropdown opens with an empty query.
  useEffect(() => {
    if (!showingSuggestions) return;
    if (suggestionsLoadedAt > 0) return;
    void loadSuggestions();
  }, [showingSuggestions, suggestionsLoadedAt, loadSuggestions]);

  // Debounced fetch for keyword search.
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/folio/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { hits: Hit[] };
        setHits(data.hits ?? []);
      } catch {
        /* aborted or network — ignore */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/folio/cari?q=${encodeURIComponent(q)}`);
  }

  function onAddFriend(userId: number) {
    if (sentIds.has(userId) || pending) return;
    startTransition(async () => {
      const res = await sendFriendRequest({ to: userId });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Permintaan rakan dihantar." });
      setSentIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      // Backfill with fresh suggestions excluding everyone we've sent to.
      const excluded = [...sentIds, userId];
      void loadSuggestions(excluded);
      router.refresh();
    });
  }

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <form onSubmit={onSubmit} className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Cari pelajar / pensyarah atau cadangan rakan…"
          aria-label="Cari pelajar atau pensyarah"
          className="w-64 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-sm outline-none transition focus:w-80 focus:border-ukm-teal focus:bg-white focus:ring-4 focus:ring-sky-500/15"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setHits([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-700"
            aria-label="Kosongkan"
          >
            <X size={12} />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          {/* Suggestions panel (shown when input is empty) */}
          {showingSuggestions && (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-orange-50 via-amber-50 to-sky-50 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-ukm-orange" />
                  <p className="text-xs font-bold uppercase tracking-wider text-ukm-navy">
                    Cadangan Rakan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadSuggestions([...sentIds])}
                  disabled={suggestionsLoading}
                  className="text-[11px] font-semibold text-ukm-teal hover:underline disabled:opacity-50"
                >
                  Muat semula
                </button>
              </div>

              {suggestionsLoading && suggestions.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-500">
                  Memuatkan cadangan…
                </p>
              ) : suggestions.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-500">
                  Tiada cadangan buat masa ini.
                </p>
              ) : (
                <ul className="max-h-96 overflow-y-auto py-1">
                  {suggestions.map((s) => {
                    const sent = sentIds.has(s.id);
                    return (
                      <li
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50"
                      >
                        <Link
                          href={`/folio/u/${s.matricNum?.toLowerCase() ?? ""}`}
                          onClick={() => setOpen(false)}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <Avatar name={s.name} avatarPath={s.avatarPath} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-ukm-navy">
                                {s.name}
                              </p>
                              <RoleBadge role={s.role} />
                              {s.sharedProgram && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                                  Program
                                </span>
                              )}
                              {!s.sharedProgram && s.sharedFaculty && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                                  Fakulti
                                </span>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-slate-500">
                              <span className="font-mono">
                                @{s.matricNum?.toLowerCase()}
                              </span>
                              {s.program ? ` · ${s.program}` : ""}
                            </p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => onAddFriend(s.id)}
                          disabled={sent || pending}
                          className={
                            sent
                              ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                              : "inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-ukm-orange to-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow-orange disabled:opacity-50"
                          }
                        >
                          {sent ? (
                            <>
                              <Check size={11} /> Dihantar
                            </>
                          ) : (
                            <>
                              <UserPlus size={11} /> Tambah
                            </>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* Live search results (shown when input has text) */}
          {!showingSuggestions && (
            <>
              {loading && (
                <p className="px-3 py-3 text-xs text-slate-500">Mencari…</p>
              )}
              {!loading && hits.length === 0 && (
                <p className="px-3 py-3 text-xs text-slate-500">
                  Tiada pelajar dijumpai.
                </p>
              )}
              {!loading && hits.length > 0 && (
                <ul className="max-h-80 overflow-y-auto py-1">
                  {hits.map((h) => (
                    <li key={h.id}>
                      <Link
                        href={`/folio/u/${h.matricNum?.toLowerCase() ?? ""}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 transition hover:bg-slate-50"
                      >
                        <Avatar name={h.name} avatarPath={h.avatarPath} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-ukm-navy">
                              {h.name}
                            </p>
                            <RoleBadge role={h.role} />
                          </div>
                          <p className="truncate text-[11px] text-slate-500">
                            <span className="font-mono">
                              @{h.matricNum?.toLowerCase()}
                            </span>
                            {h.program ? ` · ${h.program}` : ""}
                            {h.faculty ? ` · ${h.faculty}` : ""}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/folio/cari?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="block border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-ukm-teal hover:bg-slate-100"
              >
                Lihat semua hasil →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
