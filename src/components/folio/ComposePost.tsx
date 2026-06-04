"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Globe2, ImagePlus, Loader2, Send, Users, UsersRound, X } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { createFolioPost } from "@/server/actions/folio";
import {
  POST_MAX_IMAGES,
  POST_MAX_LENGTH,
  type PostVisibilityValue,
} from "@/schemas/folio";

type Props = {
  userId: number;
  userName: string;
  userMatric: string | null;
  avatarPath: string | null;
};

const VIS_OPTIONS: Array<{
  value: PostVisibilityValue;
  label: string;
  hint: string;
  Icon: typeof Globe2;
}> = [
  { value: "PUBLIC", label: "Awam", hint: "Semua pelajar boleh lihat.", Icon: Globe2 },
  { value: "FACULTY", label: "Fakulti", hint: "Pelajar fakulti yang sama sahaja.", Icon: Users },
  { value: "FRIENDS", label: "Rakan", hint: "Hanya rakan yang diterima.", Icon: UsersRound },
];

export function ComposePost({ userId: _userId, userName, userMatric, avatarPath }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibilityValue>("PUBLIC");
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const remaining = POST_MAX_LENGTH - content.length;
  const overLimit = remaining < 0;
  const canSubmit = !isPending && !overLimit && (content.trim().length > 0 || previews.length > 0);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...previews];
    for (const file of Array.from(list)) {
      if (next.length >= POST_MAX_IMAGES) break;
      next.push({ url: URL.createObjectURL(file), file });
    }
    setPreviews(next);
  }

  function removeImage(idx: number) {
    setPreviews((arr) => {
      const removed = arr[idx];
      if (removed) URL.revokeObjectURL(removed.url);
      return arr.filter((_, i) => i !== idx);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const fd = new FormData();
    fd.set("content", content);
    fd.set("visibility", visibility);
    for (const p of previews) fd.append("images", p.file);

    startTransition(async () => {
      setError(null);
      const res = await createFolioPost(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setContent("");
      for (const p of previews) URL.revokeObjectURL(p.url);
      setPreviews([]);
      router.refresh();
    });
  }

  function insertMentionShortcut() {
    setContent((c) => (c.endsWith(" ") || c.length === 0 ? c + "@" : c + " @"));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card animate-fade-in space-y-3 p-4 sm:p-5"
    >
      <div className="flex gap-3">
        <Avatar name={userName} avatarPath={avatarPath} size="md" ring />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ukm-navy">{userName}</p>
          <p className="font-mono text-[11px] text-slate-500">
            @{userMatric?.toLowerCase() ?? "—"}
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Apa yang dalam fikiran anda? Tag rakan dengan @a201762"
            rows={3}
            maxLength={POST_MAX_LENGTH + 100}
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed placeholder:text-slate-400 outline-none focus:border-ukm-teal focus:ring-4 focus:ring-sky-500/15"
          />
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {previews.map((p, i) => (
            <div
              key={p.url}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="h-28 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white shadow-soft transition hover:bg-black/80"
                aria-label="Buang imej"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={previews.length >= POST_MAX_IMAGES}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-ukm-teal transition hover:bg-sky-50 disabled:opacity-40"
          >
            <ImagePlus size={16} /> Imej
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={insertMentionShortcut}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-ukm-teal"
          >
            <AtSign size={16} /> Tag
          </button>

          <div className="ml-1 flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5">
            {VIS_OPTIONS.map((opt) => {
              const Icon = opt.Icon;
              const active = visibility === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.hint}
                  onClick={() => setVisibility(opt.value)}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-white text-ukm-navy shadow-soft"
                      : "text-slate-500 hover:text-ukm-navy"
                  }`}
                >
                  <Icon size={12} /> {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs tabular-nums ${
              overLimit
                ? "font-semibold text-ukm-red"
                : remaining < 40
                  ? "text-amber-600"
                  : "text-slate-400"
            }`}
          >
            {remaining}
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Hantar
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-ukm-red">{error}</p>
      )}
    </form>
  );
}
