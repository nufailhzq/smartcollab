"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Megaphone,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import {
  createBulletin,
  deleteBulletin,
  toggleBulletinFlag,
  updateBulletin,
} from "@/server/actions/admin-bulletins";

type BulletinVM = {
  id: number;
  title: string;
  body: string;
  imagePath: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  isActive: boolean;
  isPinned: boolean;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  title: string;
  body: string;
  linkUrl: string;
  linkLabel: string;
  isActive: boolean;
  isPinned: boolean;
  image: File | null;
  removeImage: boolean;
};

const blankForm: FormState = {
  title: "",
  body: "",
  linkUrl: "",
  linkLabel: "",
  isActive: true,
  isPinned: false,
  image: null,
  removeImage: false,
};

export function BulletinManager({ bulletins }: { bulletins: BulletinVM[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<BulletinVM | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);

  const openCreate = () => {
    setForm(blankForm);
    setCreateOpen(true);
  };

  const openEdit = (b: BulletinVM) => {
    setForm({
      title: b.title,
      body: b.body,
      linkUrl: b.linkUrl ?? "",
      linkLabel: b.linkLabel ?? "",
      isActive: b.isActive,
      isPinned: b.isPinned,
      image: null,
      removeImage: false,
    });
    setEditing(b);
  };

  const buildFormData = (mode: "create" | "update", bulletinId?: number) => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("body", form.body);
    fd.append("linkUrl", form.linkUrl);
    fd.append("linkLabel", form.linkLabel);
    fd.append("isActive", String(form.isActive));
    fd.append("isPinned", String(form.isPinned));
    if (form.image) fd.append("image", form.image);
    if (mode === "update" && bulletinId !== undefined) {
      fd.append("bulletinId", String(bulletinId));
      fd.append("keepImage", String(!form.removeImage));
    }
    return fd;
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createBulletin(buildFormData("create"));
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Buletin dicipta." });
      setCreateOpen(false);
      setForm(blankForm);
      router.refresh();
    });
  };

  const onUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      const res = await updateBulletin(buildFormData("update", editing.id));
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Buletin dikemaskini." });
      setEditing(null);
      router.refresh();
    });
  };

  const onDelete = (b: BulletinVM) => {
    if (!confirm(`Padam buletin "${b.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteBulletin({ bulletinId: b.id });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({ kind: "success", message: "Buletin dipadam." });
      router.refresh();
    });
  };

  const onToggle = (b: BulletinVM, field: "isActive" | "isPinned") => {
    const next = !b[field];
    startTransition(async () => {
      const res = await toggleBulletinFlag({ bulletinId: b.id, field, value: next });
      if (!res.ok) return toast.push({ kind: "error", message: res.error });
      toast.push({
        kind: "success",
        message:
          field === "isActive"
            ? next
              ? "Buletin diaktifkan."
              : "Buletin disembunyikan."
            : next
              ? "Buletin disematkan."
              : "Sematan ditanggalkan.",
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="card-elevated flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ukm-navy">Senarai Buletin</h2>
          <p className="text-xs text-slate-500">
            {bulletins.filter((b) => b.isActive).length} aktif daripada {bulletins.length} jumlah.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary gap-2">
          <Plus size={16} /> Cipta Buletin
        </button>
      </div>

      {bulletins.length === 0 ? (
        <EmptyState
          title="Tiada buletin"
          description="Buletin akan muncul di papan pemuka pelajar dan pensyarah."
          Icon={Megaphone}
          action={
            <button type="button" onClick={openCreate} className="btn-primary gap-2">
              <Plus size={14} /> Cipta Buletin
            </button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {bulletins.map((b) => (
            <li
              key={b.id}
              className={`card overflow-hidden p-0 ${
                b.isActive ? "" : "opacity-60"
              } ${b.isPinned ? "border-l-4 border-l-ukm-orange" : ""}`}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                {b.imagePath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.imagePath}
                    alt={b.title}
                    className="h-20 w-32 shrink-0 rounded-lg border border-slate-200 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {b.isPinned && (
                      <Pin size={12} className="shrink-0 text-ukm-orange" aria-label="Disematkan" />
                    )}
                    <h3 className="truncate text-sm font-bold text-ukm-navy">{b.title}</h3>
                    <span
                      className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        b.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {b.isActive ? "Aktif" : "Tersembunyi"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{b.body}</p>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Dicipta oleh {b.createdByName} ·{" "}
                    {new Date(b.createdAt).toLocaleString("ms-MY")}
                    {b.linkUrl && (
                      <>
                        {" · "}
                        <a
                          href={b.linkUrl}
                          target={b.linkUrl.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="text-ukm-teal hover:underline"
                        >
                          {b.linkLabel ?? b.linkUrl}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    title={b.isPinned ? "Tanggalkan sematan" : "Sematkan"}
                    onClick={() => onToggle(b, "isPinned")}
                    disabled={pending}
                    className="rounded p-1.5 text-slate-500 hover:bg-orange-50 hover:text-ukm-orange disabled:opacity-40"
                  >
                    {b.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button
                    type="button"
                    title={b.isActive ? "Sembunyikan" : "Aktifkan"}
                    onClick={() => onToggle(b, "isActive")}
                    disabled={pending}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy disabled:opacity-40"
                  >
                    {b.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    title="Kemaskini"
                    onClick={() => openEdit(b)}
                    disabled={pending}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ukm-navy disabled:opacity-40"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Padam"
                    onClick={() => onDelete(b)}
                    disabled={pending}
                    className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-ukm-red disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Cipta Buletin">
        <BulletinForm
          form={form}
          setForm={setForm}
          mode="create"
          existingImagePath={null}
          pending={pending}
          onSubmit={onCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Kemaskini: ${editing.title}` : "Kemaskini Buletin"}
      >
        <BulletinForm
          form={form}
          setForm={setForm}
          mode="update"
          existingImagePath={editing?.imagePath ?? null}
          pending={pending}
          onSubmit={onUpdate}
          onCancel={() => setEditing(null)}
        />
      </Modal>
    </div>
  );
}

function BulletinForm({
  form,
  setForm,
  mode,
  existingImagePath,
  pending,
  onSubmit,
  onCancel,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  mode: "create" | "update";
  existingImagePath: string | null;
  pending: boolean;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3" encType="multipart/form-data">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ukm-navy">
          Tajuk <span className="text-ukm-red">*</span>
        </label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          maxLength={160}
          placeholder="BULETIN PENGAJARAN-UKM"
          className="input-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-ukm-navy">
          Kandungan <span className="text-ukm-red">*</span>
        </label>
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          required
          rows={5}
          maxLength={4000}
          placeholder="Tulis isi pengumuman di sini..."
          className="input-base resize-none"
        />
        <p className="mt-1 text-[10px] text-slate-500">
          Garis kosong akan dikekalkan sebagai perenggan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">URL Pautan</label>
          <input
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            maxLength={500}
            placeholder="https://example.com/survey atau /student/kursus/TTTK3413"
            className="input-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ukm-navy">Label Pautan</label>
          <input
            value={form.linkLabel}
            onChange={(e) => setForm({ ...form, linkLabel: e.target.value })}
            maxLength={80}
            placeholder="Sertai survey"
            className="input-base"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-ukm-navy">
          Imej (PNG/JPG/WEBP, max 5MB)
        </label>
        {existingImagePath && !form.image && !form.removeImage && (
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={existingImagePath}
              alt="Semasa"
              className="h-12 w-20 rounded object-cover"
            />
            <span className="text-xs text-slate-600">Imej semasa</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, removeImage: true })}
              className="ml-auto text-xs text-ukm-red hover:underline"
            >
              Buang imej
            </button>
          </div>
        )}
        {form.removeImage && (
          <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            Imej semasa akan dipadam selepas simpan.
            <button
              type="button"
              onClick={() => setForm({ ...form, removeImage: false })}
              className="ml-2 underline"
            >
              Batal
            </button>
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 hover:border-ukm-teal hover:bg-sky-50">
          <ImagePlus size={16} />
          <span className="flex-1">
            {form.image ? form.image.name : "Pilih imej…"}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) =>
              setForm({ ...form, image: e.target.files?.[0] ?? null, removeImage: false })
            }
            className="hidden"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <span className="text-slate-700">Aktif (papar kepada pengguna)</span>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={form.isPinned}
            onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
          />
          <span className="text-slate-700">Sematkan di atas senarai</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {mode === "create" ? "Cipta" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
