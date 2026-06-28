"use client";

import { useEffect, useRef, useState } from "react";
import { File as FileIcon, Image as ImageIcon, Paperclip, Video } from "lucide-react";
import type { AttachmentType } from "@/schemas/chat";

type Props = {
  /** Called once the user has chosen a file from disk. */
  onPick: (file: File, type: AttachmentType) => void;
  disabled?: boolean;
};

// Aligned with the server allow-list (schemas/chat.ts). Document uploads are
// limited to PDF/Office formats; images cover JPG/PNG (+ webp/gif).
const ACCEPT: Record<AttachmentType, string> = {
  image: "image/png,image/jpeg,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  file: ".pdf,.doc,.docx,.xls,.xlsx",
};

export function AttachmentMenu({ onPick, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function trigger(type: AttachmentType) {
    setOpen(false);
    const input =
      type === "image" ? imageInput.current : type === "video" ? videoInput.current : fileInput.current;
    input?.click();
  }

  function handleChange(type: AttachmentType, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file twice in a row
    if (!file) return;
    onPick(file, type);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="Lampirkan"
        title="Lampirkan"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ukm-teal disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Paperclip size={18} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_10px_30px_rgba(15,39,68,0.18)]">
          <button
            type="button"
            onClick={() => trigger("image")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-sky-50"
          >
            <ImageIcon size={14} className="text-sky-500" />
            Imej
            <span className="ml-auto text-[10px] text-slate-400">5 MB</span>
          </button>
          <button
            type="button"
            onClick={() => trigger("video")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-purple-50"
          >
            <Video size={14} className="text-purple-500" />
            Video pendek
            <span className="ml-auto text-[10px] text-slate-400">25 MB</span>
          </button>
          <button
            type="button"
            onClick={() => trigger("file")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-orange-50"
          >
            <FileIcon size={14} className="text-ukm-orange" />
            Fail
            <span className="ml-auto text-[10px] text-slate-400">10 MB</span>
          </button>
        </div>
      )}

      <input
        ref={imageInput}
        type="file"
        accept={ACCEPT.image}
        hidden
        onChange={(e) => handleChange("image", e)}
      />
      <input
        ref={videoInput}
        type="file"
        accept={ACCEPT.video}
        hidden
        onChange={(e) => handleChange("video", e)}
      />
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT.file}
        hidden
        onChange={(e) => handleChange("file", e)}
      />
    </div>
  );
}
