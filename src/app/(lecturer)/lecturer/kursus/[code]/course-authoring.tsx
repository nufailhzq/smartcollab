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
              onSubmit={(values, type) =>
                startTransition(async () => {
                  const res = await createCourseContent({
                    courseId,
                    type,
                    title: values.title,
                    content: values.content,
                    fileName: values.fileName,
                  });
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
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [type, setType] = useState<"GENERAL" | "NOTES" | "ANNOUNCEMENT" | "FILE" | "FORUM">(
    defaultType,
  );

  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content, fileName }, type);
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
        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">
            Nama Fail (opsyenal)
          </label>
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            maxLength={200}
            className="input-base"
            placeholder="contoh: Bab1_Pengenalan.pdf"
          />
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
    dueDate: string;
    maxGrade: number;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"INDIVIDUAL" | "GROUP">("INDIVIDUAL");
  const [dueDate, setDueDate] = useState("");
  const [maxGrade, setMaxGrade] = useState(100);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, type, dueDate, maxGrade });
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
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          Cipta Tugasan
        </button>
      </div>
    </form>
  );
}
