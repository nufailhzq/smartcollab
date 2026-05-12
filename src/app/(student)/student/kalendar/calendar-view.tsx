"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, Bell } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  createCalendarEvent,
  deleteCalendarEvent,
} from "@/server/actions/calendar";
import { formatDate } from "@/lib/utils";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember",
];
const DAY_HEADERS = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  date: string;
  time: string;
  courseCode: string | null;
  groupName: string | null;
  createdById: number;
  createdByName: string;
  isMine: boolean;
  reminder: boolean;
};

type AssignmentItem = {
  id: number;
  title: string;
  dueDate: string;
  courseCode: string;
};

type Props = {
  year: number;
  monthIndex: number; // 0-11
  events: EventItem[];
  assignments: AssignmentItem[];
  courses: { id: number; code: string; title: string }[];
};

export function CalendarView({ year, monthIndex, events, assignments, courses }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [openCreate, setOpenCreate] = useState(false);
  const [createDateISO, setCreateDateISO] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const monthGrid = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, EventItem[]>();
    for (const e of events) {
      const key = e.date.slice(0, 10);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return m;
  }, [events]);

  const deadlinesByDay = useMemo(() => {
    const m = new Map<string, AssignmentItem[]>();
    for (const a of assignments) {
      const key = a.dueDate.slice(0, 10);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(a);
    }
    return m;
  }, [assignments]);

  function changeMonth(delta: number) {
    const next = new Date(year, monthIndex + delta, 1);
    router.push(`${pathname}?y=${next.getFullYear()}&m=${next.getMonth()}`);
  }

  function onCreate(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "00:00");
    const courseRaw = String(formData.get("courseId") ?? "");
    const courseId = courseRaw ? Number(courseRaw) : null;
    const reminder = formData.get("reminder") === "on";

    startTransition(async () => {
      const res = await createCalendarEvent({
        title,
        description,
        date,
        time: time.length === 5 ? `${time}:00` : time,
        courseId,
        reminder,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Acara ditambah." });
      setOpenCreate(false);
      router.refresh();
    });
  }

  function onDelete(eventId: number) {
    startTransition(async () => {
      const res = await deleteCalendarEvent({ eventId });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Acara dipadam." });
      router.refresh();
    });
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="rounded-md p-2 hover:bg-slate-100"
            aria-label="Bulan sebelum"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold">
            {MONTH_NAMES[monthIndex]} {year}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="rounded-md p-2 hover:bg-slate-100"
            aria-label="Bulan seterusnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => {
            const today = new Date();
            const k =
              today.getFullYear() === year && today.getMonth() === monthIndex
                ? today.toISOString().slice(0, 10)
                : new Date(year, monthIndex, 1).toISOString().slice(0, 10);
            setCreateDateISO(k);
            setOpenCreate(true);
          }}
          className="btn-primary inline-flex items-center gap-1 text-sm"
        >
          <Plus size={14} /> Tambah Acara
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs uppercase tracking-wider text-slate-500">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthGrid.map((cell, i) => {
            const key = cell.date.toISOString().slice(0, 10);
            const dayEvents = eventsByDay.get(key) ?? [];
            const dayDeadlines = deadlinesByDay.get(key) ?? [];
            const isToday = key === new Date().toISOString().slice(0, 10);
            const isCurrentMonth = cell.date.getMonth() === monthIndex;
            return (
              <button
                key={i}
                onClick={() => {
                  setCreateDateISO(key);
                  setOpenCreate(true);
                }}
                className={`flex min-h-20 flex-col items-start gap-1 border-b border-r border-slate-100 p-1.5 text-left text-xs transition hover:bg-slate-50 ${
                  isCurrentMonth ? "" : "opacity-40"
                } ${isToday ? "bg-ukm-cyan/10" : ""}`}
              >
                <span
                  className={`text-[11px] font-semibold ${
                    isToday ? "text-ukm-teal" : "text-slate-600"
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                <div className="flex w-full flex-col gap-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className="truncate rounded bg-ukm-teal/20 px-1 py-0.5 text-[10px] text-ukm-teal"
                    >
                      {e.title}
                    </span>
                  ))}
                  {dayDeadlines.slice(0, 2).map((a) => (
                    <span
                      key={`a-${a.id}`}
                      className="truncate rounded bg-ukm-orange/20 px-1 py-0.5 text-[10px] text-ukm-orange"
                    >
                      â° {a.courseCode}
                    </span>
                  ))}
                  {dayEvents.length + dayDeadlines.length > 4 && (
                    <span className="text-[9px] text-slate-400">
                      +{dayEvents.length + dayDeadlines.length - 4} lagi
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Acara Akan Datang</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-slate-500">Tiada acara akan datang.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.courseCode && (
                      <span className="rounded bg-ukm-orange/15 px-1.5 py-0.5 font-mono text-[10px] text-ukm-orange">
                        {e.courseCode}
                      </span>
                    )}
                    {e.reminder && <Bell size={11} className="text-ukm-teal" />}
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDate(e.date)} · {e.time.slice(0, 5)}
                  </p>
                  {e.description && (
                    <p className="mt-1 text-xs text-slate-500">{e.description}</p>
                  )}
                </div>
                {e.isMine && (
                  <button
                    onClick={() => onDelete(e.id)}
                    disabled={isPending}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-red-300"
                    aria-label="Padam acara"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Tambah Acara"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpenCreate(false)} className="btn-secondary text-sm">
              Batal
            </button>
            <button
              type="submit"
              form="create-event-form"
              disabled={isPending}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              {isPending && <LoadingSpinner />}
              Simpan
            </button>
          </div>
        }
      >
        <form
          id="create-event-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(new FormData(e.currentTarget));
          }}
        >
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Tajuk
            </label>
            <input name="title" required className="input-base" maxLength={255} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                Tarikh
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={createDateISO ?? ""}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                Masa
              </label>
              <input name="time" type="time" defaultValue="14:00" className="input-base" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Kursus (pilihan)
            </label>
            <select name="courseId" className="input-base" defaultValue="">
              <option value="">Acara peribadi</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Penerangan (pilihan)
            </label>
            <textarea name="description" rows={3} className="input-base" maxLength={1000} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="reminder" /> Hantar peringatan
          </label>
        </form>
      </Modal>
    </div>
  );
}

function buildMonthGrid(year: number, monthIndex: number): { date: Date }[] {
  const first = new Date(year, monthIndex, 1);
  const startDay = first.getDay();
  const start = new Date(year, monthIndex, 1 - startDay);
  const cells: { date: Date }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d });
  }
  return cells;
}
