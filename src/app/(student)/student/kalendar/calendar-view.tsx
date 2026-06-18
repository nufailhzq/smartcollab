"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { SideDrawer } from "@/components/common/SideDrawer";
import { useToast } from "@/components/common/Toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  createCalendarEvent,
  createTimetableEntry,
  deleteCalendarEvent,
  deleteTimetableEntry,
  updateCalendarEvent,
  updateEventReminder,
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
const DAY_LABELS = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];

const NOTIFY_PRESETS: { label: string; minutes: number }[] = [
  { label: "Tiada peringatan", minutes: 0 },
  { label: "30 minit sebelum", minutes: 30 },
  { label: "1 jam sebelum", minutes: 60 },
  { label: "3 jam sebelum", minutes: 60 * 3 },
  { label: "1 hari sebelum", minutes: 60 * 24 },
  { label: "3 hari sebelum", minutes: 60 * 24 * 3 },
  { label: "1 minggu sebelum", minutes: 60 * 24 * 7 },
];

const TIMETABLE_COLORS = [
  "#a855f7",
  "#ec4899",
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
];

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
  notifyBeforeMinutes: number | null;
};

type AssignmentItem = {
  id: number;
  title: string;
  dueDate: string;
  courseCode: string;
};

type TimetableEntryItem = {
  id: number;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  color: string | null;
};

type Props = {
  year: number;
  monthIndex: number;
  events: EventItem[];
  assignments: AssignmentItem[];
  courses: { id: number; code: string; title: string }[];
  timetable: TimetableEntryItem[];
  showTimetable?: boolean;
};

export function CalendarView({
  year,
  monthIndex,
  events,
  assignments,
  courses,
  timetable,
  showTimetable = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [openCreate, setOpenCreate] = useState(false);
  const [openTimetable, setOpenTimetable] = useState(false);
  const [createDateISO, setCreateDateISO] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  // Click-opened day panel. Unlike the hover tooltip, this stays open so the
  // user can comfortably reach the delete buttons (hover popovers closed too
  // fast to click "Padam" in time).
  const [openDayKey, setOpenDayKey] = useState<string | null>(null);

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

  // Index timetable entries by JS day-of-week so the calendar grid can render
  // recurring classes as pseudo-events on every matching weekday.
  const timetableByDay = useMemo(() => {
    const m = new Map<number, TimetableEntryItem[]>();
    for (const t of timetable) {
      if (!m.has(t.dayOfWeek)) m.set(t.dayOfWeek, []);
      m.get(t.dayOfWeek)!.push(t);
    }
    return m;
  }, [timetable]);

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
    const notifyRaw = Number(formData.get("notifyBeforeMinutes") ?? 0);
    const notifyBeforeMinutes = notifyRaw > 0 ? notifyRaw : null;

    startTransition(async () => {
      const res = await createCalendarEvent({
        title,
        description,
        date,
        time: time.length === 5 ? `${time}:00` : time,
        courseId,
        reminder: notifyBeforeMinutes !== null,
        notifyBeforeMinutes,
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
    if (!confirm("Padam acara ini?")) return;
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

  function onEditSubmit(formData: FormData) {
    if (!editing) return;
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "00:00");
    startTransition(async () => {
      const res = await updateCalendarEvent({
        eventId: editing.id,
        title,
        description,
        date,
        time: time.length === 5 ? `${time}:00` : time,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Acara dikemas kini." });
      setEditing(null);
      router.refresh();
    });
  }

  // Inline reminder editor — open one popover at a time, keyed by event id.
  const [reminderOpenFor, setReminderOpenFor] = useState<number | null>(null);
  function onChangeReminder(eventId: number, minutes: number) {
    startTransition(async () => {
      const res = await updateEventReminder(eventId, minutes);
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({
        kind: "success",
        message: minutes > 0 ? "Peringatan dikemas kini." : "Peringatan dipadam.",
      });
      setReminderOpenFor(null);
      router.refresh();
    });
  }

  function onCreateTimetable(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const dayOfWeek = Number(formData.get("dayOfWeek"));
    const startTime = String(formData.get("startTime") ?? "");
    const endTime = String(formData.get("endTime") ?? "");
    const location = String(formData.get("location") ?? "").trim() || null;
    const color = String(formData.get("color") ?? "") || null;
    startTransition(async () => {
      const res = await createTimetableEntry({
        title,
        dayOfWeek,
        startTime,
        endTime,
        location,
        color,
      });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Jadual ditambah." });
      setOpenTimetable(false);
      router.refresh();
    });
  }

  function onDeleteTimetable(entryId: number) {
    if (!confirm("Padam jadual ini?")) return;
    startTransition(async () => {
      const res = await deleteTimetableEntry({ entryId });
      if (!res.ok) {
        toast.push({ kind: "error", message: res.error });
        return;
      }
      toast.push({ kind: "success", message: "Jadual dipadam." });
      router.refresh();
    });
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
    .slice(0, 6);

  // Every event the viewer owns, newest first — so any event (past or future)
  // can be removed, not just the six upcoming ones.
  const myEvents = useMemo(
    () =>
      events
        .filter((e) => e.isMine)
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events],
  );
  const [showAllEvents, setShowAllEvents] = useState(false);

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
        <div className="flex items-center gap-2">
          {showTimetable && (
            <button
              onClick={() => setOpenTimetable(true)}
              className="btn-secondary inline-flex items-center gap-1 text-sm"
            >
              <CalendarDays size={14} /> Jadual Kelas
            </button>
          )}
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
      </div>

      <div className="card overflow-visible p-0">
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
            const dayTimetable = timetableByDay.get(cell.date.getDay()) ?? [];
            const isToday = key === new Date().toISOString().slice(0, 10);
            const isCurrentMonth = cell.date.getMonth() === monthIndex;
            const totalCount =
              dayEvents.length + dayDeadlines.length + dayTimetable.length;
            // Suppress the read-only hover tooltip while the click panel for
            // this day is open, so the two popovers don't overlap.
            const showTooltip =
              hoverKey === key && totalCount > 0 && openDayKey !== key;
            return (
              <div
                key={i}
                className="relative"
                onMouseEnter={() => setHoverKey(key)}
                onMouseLeave={() => setHoverKey((k) => (k === key ? null : k))}
              >
                <button
                  onClick={() => {
                    // Click opens a persistent day panel. If the day has no
                    // entries, jump straight to the create dialog instead.
                    if (totalCount === 0) {
                      setCreateDateISO(key);
                      setOpenCreate(true);
                    } else {
                      setOpenDayKey((k) => (k === key ? null : key));
                    }
                  }}
                  className={`flex min-h-20 w-full flex-col items-start gap-1 border-b border-r border-slate-100 p-1.5 text-left text-xs transition hover:bg-slate-50 ${
                    isCurrentMonth ? "" : "opacity-40"
                  } ${isToday ? "bg-ukm-cyan/10" : ""} ${
                    openDayKey === key ? "ring-2 ring-inset ring-ukm-teal" : ""
                  }`}
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
                    {dayDeadlines.slice(0, 1).map((a) => (
                      <span
                        key={`a-${a.id}`}
                        className="truncate rounded bg-ukm-orange/20 px-1 py-0.5 text-[10px] text-ukm-orange"
                      >
                        {a.courseCode}
                      </span>
                    ))}
                    {dayTimetable.slice(0, 1).map((t) => (
                      <span
                        key={`t-${t.id}`}
                        className="truncate rounded px-1 py-0.5 text-[10px]"
                        style={{
                          background: `${t.color ?? "#a855f7"}26`,
                          color: t.color ?? "#a855f7",
                        }}
                      >
                        {t.title}
                      </span>
                    ))}
                    {totalCount > 4 && (
                      <span className="text-[9px] text-slate-400">
                        +{totalCount - 4} lagi
                      </span>
                    )}
                  </div>
                </button>

                {showTooltip && (
                  <div
                    className="absolute left-1/2 top-full z-20 mt-1 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lift-lg animate-fade-in"
                    role="tooltip"
                  >
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-ukm-navy">
                      {formatDate(cell.date)}
                    </p>
                    <ul className="space-y-1.5">
                      {dayEvents.map((e) => (
                        <li
                          key={`tt-e-${e.id}`}
                          className="text-xs"
                        >
                          <p className="font-semibold text-ukm-teal">
                            {e.time.slice(0, 5)} · {e.title}
                          </p>
                          {e.courseCode && (
                            <p className="text-[10px] text-slate-500">
                              [{e.courseCode}]
                            </p>
                          )}
                          {e.description && (
                            <p className="text-[10px] text-slate-500">
                              {e.description.slice(0, 80)}
                              {e.description.length > 80 ? "…" : ""}
                            </p>
                          )}
                        </li>
                      ))}
                      {dayDeadlines.map((a) => (
                        <li key={`tt-a-${a.id}`} className="text-xs">
                          <p className="flex items-center gap-1 font-semibold text-ukm-orange">
                            <Clock size={11} /> {a.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Tarikh akhir · {a.courseCode}
                          </p>
                        </li>
                      ))}
                      {dayTimetable.map((t) => (
                        <li key={`tt-t-${t.id}`} className="text-xs">
                          <p
                            className="font-semibold"
                            style={{ color: t.color ?? "#a855f7" }}
                          >
                            {t.startTime}–{t.endTime} · {t.title}
                          </p>
                          {t.location && (
                            <p className="flex items-center gap-1 text-[10px] text-slate-500">
                              <MapPin size={10} /> {t.location}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
                      Klik hari untuk urus / padam acara.
                    </p>
                  </div>
                )}

                {/* Click-managed day panel — stays open so delete is reachable. */}
                {openDayKey === key && (
                  <>
                    {/* Backdrop closes the panel on outside click. */}
                    <button
                      type="button"
                      aria-label="Tutup panel hari"
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setOpenDayKey(null)}
                    />
                    <div className="absolute left-1/2 top-full z-40 mt-1 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lift-lg animate-fade-in">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-ukm-navy">
                          {formatDate(cell.date)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setOpenDayKey(null)}
                          aria-label="Tutup"
                          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-ukm-navy"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <ul className="space-y-1.5">
                        {dayEvents.map((e) => (
                          <li
                            key={`dp-e-${e.id}`}
                            className="flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-ukm-teal">
                                {e.time.slice(0, 5)} · {e.title}
                              </p>
                              {e.courseCode && (
                                <p className="text-[10px] text-slate-500">
                                  [{e.courseCode}]
                                </p>
                              )}
                            </div>
                            {e.isMine && (
                              <button
                                type="button"
                                onClick={() => onDelete(e.id)}
                                disabled={isPending}
                                title="Padam acara"
                                aria-label="Padam acara"
                                className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-ukm-red disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </li>
                        ))}
                        {dayDeadlines.map((a) => (
                          <li
                            key={`dp-a-${a.id}`}
                            className="rounded-lg px-2 py-1.5 text-xs"
                          >
                            <p className="flex items-center gap-1 font-semibold text-ukm-orange">
                              <Clock size={11} /> {a.title}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Tarikh akhir · {a.courseCode}
                            </p>
                          </li>
                        ))}
                        {dayTimetable.map((t) => (
                          <li
                            key={`dp-t-${t.id}`}
                            className="rounded-lg px-2 py-1.5 text-xs"
                          >
                            <p
                              className="font-semibold"
                              style={{ color: t.color ?? "#a855f7" }}
                            >
                              {t.startTime}–{t.endTime} · {t.title}
                            </p>
                            {t.location && (
                              <p className="flex items-center gap-1 text-[10px] text-slate-500">
                                <MapPin size={10} /> {t.location}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDayKey(null);
                          setCreateDateISO(key);
                          setOpenCreate(true);
                        }}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ukm-teal/50 py-1.5 text-xs font-semibold text-ukm-teal transition hover:bg-ukm-teal/10"
                      >
                        <Plus size={13} /> Tambah acara
                      </button>
                    </div>
                  </>
                )}
              </div>
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
                className="relative flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.courseCode && (
                      <span className="rounded bg-ukm-orange/15 px-1.5 py-0.5 font-mono text-[10px] text-ukm-orange">
                        {e.courseCode}
                      </span>
                    )}
                    {e.notifyBeforeMinutes != null ? (
                      <span className="inline-flex items-center gap-0.5 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">
                        <Bell size={9} />
                        {formatMinutes(e.notifyBeforeMinutes)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                        Tiada peringatan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDate(e.date)} · {e.time.slice(0, 5)}
                  </p>
                  {e.description && (
                    <p className="mt-1 text-xs text-slate-500">{e.description}</p>
                  )}
                </div>
                {e.isMine && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditing(e)}
                      disabled={isPending}
                      title="Edit acara"
                      aria-label="Edit acara"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-sky-100 hover:text-ukm-teal"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setReminderOpenFor((cur) => (cur === e.id ? null : e.id))
                      }
                      disabled={isPending}
                      title="Set peringatan"
                      aria-label="Set peringatan"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-purple-100 hover:text-purple-700"
                    >
                      <Bell size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(e.id)}
                      disabled={isPending}
                      title="Padam acara"
                      aria-label="Padam acara"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-ukm-red"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {reminderOpenFor === e.id && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setReminderOpenFor(null)}
                      aria-hidden
                    />
                    <div className="absolute right-3 top-full z-40 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift animate-fade-in">
                      <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Set peringatan
                      </p>
                      <ul>
                        {NOTIFY_PRESETS.map((p) => {
                          const isActive =
                            (e.notifyBeforeMinutes ?? 0) === p.minutes;
                          return (
                            <li key={p.minutes}>
                              <button
                                type="button"
                                onClick={() => onChangeReminder(e.id, p.minutes)}
                                disabled={isPending}
                                className={`flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs transition hover:bg-purple-50 ${
                                  isActive
                                    ? "font-bold text-purple-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {isActive && (
                                  <Check size={12} className="text-purple-600" />
                                )}
                                <span>{p.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- All my events: remove any event (past or future) --- */}
      {myEvents.length > 0 && (
        <section className="card">
          <button
            type="button"
            onClick={() => setShowAllEvents((v) => !v)}
            className="flex w-full items-center justify-between gap-2"
          >
            <h2 className="text-lg font-semibold">
              Semua Acara Saya
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {myEvents.length}
              </span>
            </h2>
            {showAllEvents ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>
          {showAllEvents && (
            <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
              {myEvents.map((e) => {
                const isPast =
                  new Date(e.date) < new Date(new Date().toDateString());
                return (
                  <li
                    key={`all-${e.id}`}
                    className={`flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 ${
                      isPast ? "bg-slate-50 opacity-80" : "bg-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{e.title}</p>
                        {e.courseCode && (
                          <span className="rounded bg-ukm-orange/15 px-1.5 py-0.5 font-mono text-[10px] text-ukm-orange">
                            {e.courseCode}
                          </span>
                        )}
                        {isPast && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                            Lepas
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(e.date)} · {e.time.slice(0, 5)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditing(e)}
                        disabled={isPending}
                        title="Edit acara"
                        aria-label="Edit acara"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-sky-100 hover:text-ukm-teal"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(e.id)}
                        disabled={isPending}
                        title="Padam acara"
                        aria-label="Padam acara"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-ukm-red"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* --- Create Event --- */}
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
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500">
              <Bell size={11} /> Peringatan (notifikasi)
            </label>
            <select name="notifyBeforeMinutes" className="input-base" defaultValue="0">
              {NOTIFY_PRESETS.map((p) => (
                <option key={p.minutes} value={p.minutes}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-slate-400">
              Notifikasi akan keluar pada masa yang anda tetapkan sebelum acara.
            </p>
          </div>
        </form>
      </Modal>

      {/* --- Edit existing event --- */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Acara"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="btn-secondary text-sm">
              Batal
            </button>
            <button
              type="submit"
              form="edit-event-form"
              disabled={isPending}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              {isPending && <LoadingSpinner />}
              Simpan
            </button>
          </div>
        }
      >
        {editing && (
          <form
            id="edit-event-form"
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              onEditSubmit(new FormData(e.currentTarget));
            }}
          >
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                Tajuk
              </label>
              <input
                name="title"
                required
                defaultValue={editing.title}
                maxLength={255}
                className="input-base"
              />
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
                  defaultValue={editing.date.slice(0, 10)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                  Masa
                </label>
                <input
                  name="time"
                  type="time"
                  defaultValue={editing.time.slice(0, 5)}
                  className="input-base"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                Penerangan (pilihan)
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={editing.description ?? ""}
                maxLength={1000}
                className="input-base"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* --- Timetable manager (students only) --- */}
      {showTimetable && (
        <Modal
          open={openTimetable}
          onClose={() => setOpenTimetable(false)}
          title="Jadual Kelas Saya"
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenTimetable(false)}
                className="btn-secondary text-sm"
              >
                Tutup
              </button>
              <button
                type="submit"
                form="create-timetable-form"
                disabled={isPending}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                {isPending && <LoadingSpinner />}
                Tambah Jadual
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Jadual ini peribadi — hanya anda yang melihatnya. Setiap entri
              berulang setiap minggu di hari yang sama.
            </p>

            {/* Existing entries grouped by day */}
            {timetable.length > 0 ? (
              <div className="space-y-2">
                {DAY_LABELS.map((label, idx) => {
                  const entries = timetable.filter((t) => t.dayOfWeek === idx);
                  if (entries.length === 0) return null;
                  return (
                    <div key={idx}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {label}
                      </p>
                      <ul className="space-y-1">
                        {entries.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: t.color ?? "#a855f7" }}
                              />
                              <div>
                                <p className="text-sm font-semibold text-ukm-navy">
                                  {t.title}
                                </p>
                                <p className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <Clock size={9} />
                                  {t.startTime}–{t.endTime}
                                  {t.location && (
                                    <>
                                      <MapPin size={9} className="ml-1" />
                                      {t.location}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onDeleteTimetable(t.id)}
                              disabled={isPending}
                              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-ukm-red"
                            >
                              <Trash2 size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">
                Tiada kelas dalam jadual lagi.
              </p>
            )}

            <hr className="border-slate-200" />

            <form
              id="create-timetable-form"
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                onCreateTimetable(new FormData(e.currentTarget));
              }}
            >
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                  Nama kelas
                </label>
                <input
                  name="title"
                  required
                  className="input-base"
                  maxLength={120}
                  placeholder="Contoh: TTTK3013 — Sains Komputer"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                    Hari
                  </label>
                  <select name="dayOfWeek" className="input-base" defaultValue="1">
                    {DAY_LABELS.map((label, idx) => (
                      <option key={idx} value={idx}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                    Mula
                  </label>
                  <input
                    name="startTime"
                    type="time"
                    required
                    defaultValue="08:00"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                    Tamat
                  </label>
                  <input
                    name="endTime"
                    type="time"
                    required
                    defaultValue="10:00"
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                  Lokasi (pilihan)
                </label>
                <input
                  name="location"
                  className="input-base"
                  maxLength={120}
                  placeholder="Contoh: BK3, FTSM"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
                  Warna
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIMETABLE_COLORS.map((c, i) => (
                    <label
                      key={c}
                      className="relative cursor-pointer"
                      style={{ background: c }}
                    >
                      <input
                        type="radio"
                        name="color"
                        value={c}
                        defaultChecked={i === 0}
                        className="peer sr-only"
                      />
                      <span
                        className="block h-7 w-7 rounded-full ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-ukm-navy"
                        style={{ background: c }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}
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

function formatMinutes(m: number): string {
  if (m % (60 * 24 * 7) === 0) return `${m / (60 * 24 * 7)}mgg`;
  if (m % (60 * 24) === 0) return `${m / (60 * 24)}h`;
  if (m % 60 === 0) return `${m / 60}j`;
  return `${m}m`;
}
