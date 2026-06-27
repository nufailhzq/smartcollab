"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, FileText, ClipboardList, Plus } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import {
  createAssignment,
  createCourseContent,
} from "@/server/actions/content";

type Mode = "content" | "notes" | "assignment";

type GroupingMode = "INHERIT" | "CUSTOM" | "OPEN" | "RANDOM" | "INDIVIDUAL";

type Props = {
  courseId: number;
  mode: Mode;
};

export function CourseAuthoring({ courseId, mode }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="card-elevated">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ukm-navy">
          {mode === "content" && <Megaphone className="text-ukm-orange" size={18} />}
          {mode === "notes" && <FileText className="text-ukm-teal" size={18} />}
          {mode === "assignment" && <ClipboardList className="text-purple-600" size={18} />}
          <span>
            {mode === "content"
              ? "Catat Pengumuman / Pos Umum"
              : mode === "notes"
                ? "Muat Naik Nota / Bahan"
                : "Cipta Tugasan Baharu"}
          </span>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-secondary text-xs">
          <Plus size={14} /> {open ? "Tutup" : "Tambah"}
        </button>
      </header>

      {open && (
        <div className="mt-4">
          {mode === "content" && (
            <ContentForm
              courseId={courseId}
              kindLabel="Pengumuman / Umum"
              defaultType="ANNOUNCEMENT"
              showFileName={false}
              pending={pending}
              onSubmit={(values, type) =>
                startTransition(async () => {
                  const res = await createCourseContent({
                    courseId,
                    type,
                    title: values.title,
                    content: values.content,
                  });
                  if (!res.ok) {
                    toast.push({ kind: "error", message: res.error });
                    return;
                  }
                  toast.push({ kind: "success", message: "Berjaya disiarkan." });
                  setOpen(false);
                  router.refresh();
                })
              }
            />
          )}
          {mode === "notes" && (
            <ContentForm
              courseId={courseId}
              kindLabel="Nota / Bahan"
              defaultType="NOTES"
              showFileName={true}
              pending={pending}
              onSubmit={(values, type, file) =>
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("courseId", String(courseId));
                  fd.set("type", type);
                  fd.set("title", values.title);
                  fd.set("content", values.content);
                  if (values.fileName) fd.set("fileName", values.fileName);
                  if (file) fd.set("file", file);
                  const res = await createCourseContent(fd);
                  if (!res.ok) {
                    toast.push({ kind: "error", message: res.error });
                    return;
                  }
                  toast.push({ kind: "success", message: "Berjaya dimuat naik." });
                  setOpen(false);
                  router.refresh();
                })
              }
            />
          )}
          {mode === "assignment" && (
            <AssignmentForm
              courseId={courseId}
              pending={pending}
              onSubmit={(values) =>
                startTransition(async () => {
                  const res = await createAssignment({
                    courseId,
                    title: values.title,
                    description: values.description,
                    type: values.type,
                    groupingMode: values.groupingMode,
                    groupSize: values.groupSize,
                    joinCloseAt: values.joinCloseAt,
                    openGroupCount: values.openGroupCount,
                    openGroupSize: values.openGroupSize,
                    dueDate: values.dueDate,
                    maxGrade: values.maxGrade,
                  });
                  if (!res.ok) {
                    toast.push({ kind: "error", message: res.error });
                    return;
                  }
                  toast.push({ kind: "success", message: "Tugasan dicipta." });
                  setOpen(false);
                  router.refresh();
                })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function ContentForm({
  defaultType,
  kindLabel,
  showFileName,
  pending,
  onSubmit,
}: {
  courseId: number;
  defaultType: "GENERAL" | "NOTES" | "ANNOUNCEMENT" | "FILE" | "FORUM";
  kindLabel: string;
  showFileName: boolean;
  pending: boolean;
  onSubmit: (
    values: { title: string; content: string; fileName?: string },
    type: "GENERAL" | "NOTES" | "ANNOUNCEMENT" | "FILE" | "FORUM",
    file: File | null,
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<"GENERAL" | "NOTES" | "ANNOUNCEMENT" | "FILE" | "FORUM">(
    defaultType,
  );

  const handle = (e: FormEvent) => {
    e.preventDefault();
    // Auto-fill label from real file when both are empty
    const label = fileName || file?.name || "";
    onSubmit({ title, content, fileName: label }, type, file);
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">Jenis</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="input-base"
          >
            {showFileName ? (
              <>
                <option value="NOTES">Nota</option>
                <option value="FILE">Fail</option>
              </>
            ) : (
              <>
                <option value="ANNOUNCEMENT">Pengumuman</option>
                <option value="GENERAL">Umum</option>
                <option value="FORUM">Forum</option>
              </>
            )}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">
            Tajuk {kindLabel}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder={`Contoh: Notis Cuti Pertengahan Semester`}
            className="input-base"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ukm-navy">Kandungan</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={10000}
          className="input-base resize-y"
          placeholder="Tulis penerangan atau ringkasan…"
        />
      </div>
      {showFileName && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Fail (PDF / DOC / DOCX, maks 25MB)
            </label>
            <input
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !fileName) setFileName(f.name);
              }}
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ukm-teal file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-600"
            />
            {file && (
              <p className="mt-1 text-[10px] text-slate-500">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Nama paparan (opsyenal — diisi automatik dari nama fail)
            </label>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              maxLength={200}
              className="input-base"
              placeholder="contoh: Bab1_Pengenalan.pdf"
            />
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          Hantar
        </button>
      </div>
    </form>
  );
}

function AssignmentForm({
  pending,
  onSubmit,
}: {
  courseId: number;
  pending: boolean;
  onSubmit: (values: {
    title: string;
    description: string;
    type: "INDIVIDUAL" | "GROUP";
    groupingMode: GroupingMode;
    groupSize?: number;
    joinCloseAt?: string;
    openGroupCount?: number;
    openGroupSize?: number;
    dueDate: string;
    maxGrade: number;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"INDIVIDUAL" | "GROUP">("INDIVIDUAL");
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("INHERIT");
  const [groupSize, setGroupSize] = useState(4);
  const [joinCloseAt, setJoinCloseAt] = useState("");
  const [openGroupCount, setOpenGroupCount] = useState(5);
  const [openGroupSize, setOpenGroupSize] = useState(4);
  const [dueDate, setDueDate] = useState("");
  const [maxGrade, setMaxGrade] = useState(100);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      type,
      groupingMode,
      groupSize: groupingMode === "RANDOM" ? groupSize : undefined,
      joinCloseAt: groupingMode === "OPEN" ? joinCloseAt : undefined,
      openGroupCount: groupingMode === "OPEN" ? openGroupCount : undefined,
      openGroupSize: groupingMode === "OPEN" ? openGroupSize : undefined,
      dueDate,
      maxGrade,
    });
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ukm-navy">Tajuk Tugasan</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="input-base"
          placeholder="Contoh: Laporan Cadangan Projek"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ukm-navy">Penerangan</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={10000}
          className="input-base resize-y"
          placeholder="Penerangan, syarat, format penghantaran…"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">Jenis</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "INDIVIDUAL" | "GROUP")}
            className="input-base"
          >
            <option value="INDIVIDUAL">Individu</option>
            <option value="GROUP">Kumpulan</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">Tarikh Akhir</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="input-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">Markah Penuh</label>
          <input
            type="number"
            min={1}
            max={100}
            value={maxGrade}
            onChange={(e) => setMaxGrade(Number(e.target.value))}
            className="input-base"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">
            Mod Pengumpulan
          </label>
          <select
            value={groupingMode}
            onChange={(e) => setGroupingMode(e.target.value as GroupingMode)}
            className="input-base"
          >
            <option value="INHERIT">Ikut kumpulan kursus</option>
            <option value="INDIVIDUAL">Individu (tiada kumpulan)</option>
            <option value="RANDOM">Rawak (auto-bahagi)</option>
            <option value="CUSTOM">Pelajar bentuk sendiri (perlu kelulusan)</option>
            <option value="OPEN">Kumpulan terbuka (pelajar sertai sendiri)</option>
          </select>
        </div>
        {groupingMode === "RANDOM" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-ukm-navy">
              Saiz Kumpulan
            </label>
            <input
              type="number"
              min={2}
              max={20}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="input-base"
            />
          </div>
        )}
        {groupingMode === "OPEN" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ukm-navy">
                Bilangan kumpulan kosong
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={openGroupCount}
                onChange={(e) => setOpenGroupCount(Number(e.target.value))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ukm-navy">
                Saiz setiap kumpulan
              </label>
              <input
                type="number"
                min={2}
                max={20}
                value={openGroupSize}
                onChange={(e) => setOpenGroupSize(Number(e.target.value))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ukm-navy">
                Tutup penyertaan (pilihan)
              </label>
              <input
                type="datetime-local"
                value={joinCloseAt}
                onChange={(e) => setJoinCloseAt(e.target.value)}
                className="input-base"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Selepas masa ini, pelajar tidak boleh sertai/jemput lagi.
              </p>
            </div>
          </>
        )}
      </div>
      {(groupingMode === "CUSTOM" || groupingMode === "OPEN") && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-800">
          {groupingMode === "CUSTOM"
            ? "Pelajar akan membentuk kumpulan sendiri di halaman tugasan; setiap kumpulan memerlukan kelulusan anda di Pengurusan Kumpulan."
            : "Buka kumpulan kosong di halaman tugasan selepas mencipta; pelajar menyertai sendiri dan boleh menjemput rakan (auto-sertai)."}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          Cipta Tugasan
        </button>
      </div>
    </form>
  );
}
