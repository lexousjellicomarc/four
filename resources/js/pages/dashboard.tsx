import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type Auth, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Lock,
  Plus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarBlockModal, type BlockKey, type CalendarBlockFormState } from '@/components/calendar/calendar-block-modal';
import {
  BLOCK_KEYS,
  BLOCK_META,
  blockIntervalForDate,
  buildMonthWeeks,
  dateKey,
  deriveDayStatus,
  eventEndsOnDate,
  eventSpansDate,
  eventStartsOnDate,
  eventTouchesBlockOnDate,
  longDate,
  monthLabel,
  monthToDate,
  normalizeEventRange,
  scheduleStatusDescription,
  scheduleStatusLabel,
  scheduleStatusTone,
  shiftMonth,
} from '@/lib/unified-schedule';
import { canManageCalendarBlocks, type WorkspaceAuthLike } from '@/lib/workspace';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

type DashboardEvent = {
  id: number | string;
  title: string;
  start: string;
  end: string;
  status?: string | null;
  kind?: 'booking' | 'block' | 'public_event';
  block_id?: number;
  block?: string;
  area?: string | null;
  public_status?: 'red' | 'gold' | 'blue' | string | null;
  groupKey?: string;
};

type DashboardAvailabilityDay = {
  AM: boolean;
  PM: boolean;
  EVE: boolean;
  is_fully_booked?: boolean;
  day_status?: 'available' | 'limited' | 'public_booked' | 'private_booked' | 'blocked' | string;
};

type DashboardProps = {
  counts?: Partial<Record<string, number>>;
  month: string;
  monthAvailability: Record<string, DashboardAvailabilityDay>;
  events: DashboardEvent[];
  areaOptions?: string[];
};

type CalendarStatus = 'available' | 'partial' | 'public' | 'private' | 'blocked' | 'full' | 'my-booking';
type WeekCell = Date | null;
type EventLaneSegment = {
  event: DashboardEvent;
  startCol: number;
  endCol: number;
  isStart: boolean;
  isEnd: boolean;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const defaultAreaOptions = [
  'FULL HALL',
  'MAIN HALL',
  'FOYER & LOBBY AREA',
  'VIP LOUNGE',
  'BOARD ROOM',
  'BASEMENT',
  'GALLERY2600',
];

function pageCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

async function sendJson(url: string, method: 'POST' | 'PUT' | 'DELETE', payload?: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-TOKEN': pageCsrfToken(),
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: method === 'DELETE' ? undefined : JSON.stringify(payload ?? {}),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((json as { message?: string })?.message || 'Request failed.');
  }
  return json;
}

function normalizeDashboardStatus(status: string, isClientOwnBooking: boolean): CalendarStatus {
  if (isClientOwnBooking) return 'my-booking';

  switch (status) {
    case 'limited':
      return 'partial';
    case 'public_booked':
      return 'public';
    case 'private_booked':
      return 'private';
    case 'blocked':
      return 'blocked';
    case 'full':
      return 'full';
    default:
      return 'available';
  }
}

function statusChipTone(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();

  if (normalized === 'public_booked') return 'bg-[#f1ecff] text-[#5532c7]';
  if (['private_booked', 'confirmed', 'active'].includes(normalized)) return 'bg-[#f7ebc1] text-[#6a4f00]';
  if (normalized === 'blocked') return 'bg-[#ffe5e5] text-[#a52a2a]';
  if (normalized === 'completed') return 'bg-[#eef7f4] text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]';
  if (normalized === 'pending') return 'bg-[#eef4ff] text-[#1645ac]';
  if (['cancelled', 'declined'].includes(normalized)) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';

  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function eventBarTone(event: DashboardEvent) {
  const normalized = String(event.status ?? '').toLowerCase();

  if (normalized === 'public_booked') return 'border-[#c9bcff] bg-[#ede8ff] text-[#5532c7]';
  if (['private_booked', 'confirmed', 'active'].includes(normalized)) return 'border-[#dec57a] bg-[#f7ebc1] text-[#6a4f00]';
  if (normalized === 'blocked') return 'border-[#f0b1b1] bg-[#ffe3e3] text-[#a52a2a]';
  if (normalized === 'completed') return 'border-[#b8ddd1] bg-[#eef7f4] text-[#174f40]';

  return 'border-black/10 bg-[#f8f8f8] text-[#22221f] dark:border-white/10 dark:bg-[#202329] dark:text-white';
}

function eventSortValue(event: DashboardEvent) {
  const priority: Record<string, number> = {
    booking: 0,
    public_event: 1,
    block: 2,
  };

  return priority[String(event.kind ?? '')] ?? 9;
}

function eventDurationDays(event: DashboardEvent) {
  const { startDate, endDate } = normalizeEventRange(event);
  if (!startDate || !endDate) return 1;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(diff + 1, 1);
}

function buildWeekLanes(week: WeekCell[], events: DashboardEvent[]) {
  const weekKeys = week.map((cell) => (cell ? dateKey(cell) : null));

  const visibleEvents = events
    .filter((event) => weekKeys.some((key) => key && eventSpansDate(event, key)))
    .sort((a, b) => {
      const aRange = normalizeEventRange(a);
      const bRange = normalizeEventRange(b);
      if (aRange.startDate !== bRange.startDate) return aRange.startDate.localeCompare(bRange.startDate);
      if (eventDurationDays(a) !== eventDurationDays(b)) return eventDurationDays(b) - eventDurationDays(a);
      return eventSortValue(a) - eventSortValue(b);
    });

  const lanes: EventLaneSegment[][] = [];

  visibleEvents.forEach((event) => {
    let startCol = -1;
    let endCol = -1;

    weekKeys.forEach((key, idx) => {
      if (key && eventSpansDate(event, key)) {
        if (startCol === -1) startCol = idx;
        endCol = idx;
      }
    });

    if (startCol === -1 || endCol === -1) return;

    const segment: EventLaneSegment = {
      event,
      startCol,
      endCol,
      isStart: Boolean(weekKeys[startCol] && eventStartsOnDate(event, weekKeys[startCol] as string)),
      isEnd: Boolean(weekKeys[endCol] && eventEndsOnDate(event, weekKeys[endCol] as string)),
    };

    let placed = false;
    for (const lane of lanes) {
      const overlaps = lane.some((existing) => !(segment.endCol < existing.startCol || segment.startCol > existing.endCol));
      if (!overlaps) {
        lane.push(segment);
        placed = true;
        break;
      }
    }

    if (!placed) {
      lanes.push([segment]);
    }
  });

  return lanes;
}

function formatEventRange(event: DashboardEvent) {
  const { startDate, endDate, rawEndTime } = normalizeEventRange(event);
  const startTime = String(event.start).slice(11, 16);
  const endTime = String(event.end).slice(11, 16);

  if (startDate && endDate && startDate === endDate) {
    return `${startDate} ${startTime} – ${rawEndTime === '00:00' ? '23:59' : endTime}`;
  }

  return `${startDate} ${startTime} → ${endDate} ${rawEndTime === '00:00' ? '23:59' : endTime}`;
}

function pickInitialSelectedDate(month: string, availability: DashboardProps['monthAvailability'], events: DashboardEvent[]) {
  const today = dateKey(new Date());

  if (today.startsWith(`${month}-`) && (availability[today] || events.some((event) => eventSpansDate(event, today)))) {
    return today;
  }

  const eventMatch = events.find((event) => normalizeEventRange(event).startDate.slice(0, 7) === month);
  if (eventMatch) {
    return normalizeEventRange(eventMatch).startDate;
  }

  const firstAvailabilityDate = Object.keys(availability)
    .filter((key) => key.startsWith(`${month}-`))
    .sort()[0];

  return firstAvailabilityDate ?? `${month}-01`;
}

export default function Dashboard({ counts, events = [], month, monthAvailability = {}, areaOptions = defaultAreaOptions }: DashboardProps) {
  const { props } = usePage<{ auth?: Auth & WorkspaceAuthLike }>();
  const auth = props.auth;
  const roleNames = useMemo(() => {
    const raw = auth?.roles ?? auth?.user?.roles ?? [];
    if (!Array.isArray(raw)) return [] as string[];
    return raw.map((value) => String(typeof value === 'string' ? value : value?.name ?? '')).map((value) => value.toLowerCase());
  }, [auth]);
  const isClient = roleNames.includes('user');
  const isStaffView = !isClient;
  const canManageBlocks = canManageCalendarBlocks(auth);

  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const [selectedDate, setSelectedDate] = useState(() => pickInitialSelectedDate(month, monthAvailability, events));
  const [activeBlock, setActiveBlock] = useState<BlockKey>('AM');
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CalendarBlockFormState>({
    title: 'Internal calendar note',
    area: '',
    notes: '',
    block: 'AM',
    public_status: 'red',
    date_from: pickInitialSelectedDate(month, monthAvailability, events),
    date_to: pickInitialSelectedDate(month, monthAvailability, events),
  });
  const holdTimerRef = useRef<number | null>(null);
  const holdTriggeredRef = useRef(false);

  useEffect(() => {
    setSelectedDate(pickInitialSelectedDate(month, monthAvailability, events));
  }, [month, monthAvailability, events]);

  useEffect(() => {
    const selectedAvailability = monthAvailability[selectedDate];
    const nextBlock = BLOCK_KEYS.find((block) => selectedAvailability?.[block] !== false) ?? 'AM';
    setActiveBlock(nextBlock);
  }, [selectedDate, monthAvailability]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, date_from: selectedDate, date_to: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const selectedEvents = useMemo(() => events.filter((event) => eventSpansDate(event, selectedDate)), [events, selectedDate]);
  const selectedAvailability = monthAvailability[selectedDate];
  const derivedStatus = deriveDayStatus({ availability: monthAvailability[selectedDate], events: selectedEvents, isClient });
  const blockEvents = useMemo(
    () => selectedEvents.filter((event) => eventTouchesBlockOnDate(event, selectedDate, activeBlock)),
    [activeBlock, selectedDate, selectedEvents],
  );

  const summaryCards = [
    {
      label: isClient ? 'My Bookings' : 'Pending',
      value: isClient ? events.filter((event) => event.kind === 'booking').length : Number(counts?.pending ?? 0),
      icon: CalendarDays,
    },
    {
      label: 'Confirmed',
      value: Number(counts?.confirmed ?? 0),
      icon: CircleCheck,
    },
    {
      label: 'Active',
      value: Number(counts?.active ?? 0),
      icon: Clock3,
    },
    {
      label: isClient ? 'Open Days' : 'Completed',
      value: isClient
        ? Object.keys(monthAvailability).filter((day) => {
            const status = deriveDayStatus({
              availability: monthAvailability[day],
              events: events.filter((event) => eventSpansDate(event, day)),
              isClient: true,
            });

            return status === 'available';
          }).length
        : Number(counts?.completed ?? 0),
      icon: Users,
    },
  ];

  const bookingHref = useMemo(() => {
    const interval = blockIntervalForDate(selectedDate, activeBlock);
    const start = interval.start.slice(11, 16);
    const endRaw = interval.end.slice(11, 16);
    const end = endRaw === '00:00' ? '23:59' : endRaw;

    return `/bookings/create?date=${encodeURIComponent(selectedDate)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
  }, [selectedDate, activeBlock]);

  function openCreate(dateValue: string) {
    if (!canManageBlocks) return;
    setError('');
    setForm({
      title: 'Internal calendar note',
      area: '',
      notes: '',
      block: 'AM',
      public_status: 'red',
      date_from: dateValue,
      date_to: dateValue,
    });
    setEditorOpen(true);
  }

  function startPress(dateValue: string) {
    if (!canManageBlocks) return;
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
    }
    holdTriggeredRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = true;
      openCreate(dateValue);
    }, 450);
  }

  function clearPress(keepTriggered = false) {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (!keepTriggered) {
      holdTriggeredRef.current = false;
    }
  }

  function endPress(dateValue: string) {
    const wasLongPress = holdTriggeredRef.current;
    clearPress(true);
    if (!wasLongPress) {
      setSelectedDate(dateValue);
    }
    window.setTimeout(() => {
      holdTriggeredRef.current = false;
    }, 0);
  }

  async function saveForm() {
    if (!canManageBlocks) return;
    setBusy(true);
    setError('');

    try {
      if (!form.title.trim()) {
        throw new Error('Please enter a title for the calendar rule.');
      }
      await sendJson('/calendar-blocks', 'POST', {
        ...form,
        title: form.title.trim(),
        area: form.area.trim(),
        notes: form.notes.trim(),
      });
      setEditorOpen(false);
      router.reload({ preserveScroll: true, preserveState: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the calendar rule.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <CalendarBlockModal
        open={editorOpen}
        title="Create dashboard calendar rule"
        form={form}
        areaOptions={areaOptions}
        busy={busy}
        error={error}
        helperText="This dashboard quick input uses the same backend calendar-block endpoint as the Manage Calendar Center."
        saveLabel="Save quick rule"
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onClose={() => setEditorOpen(false)}
        onSave={saveForm}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#121318]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 px-6 py-8 sm:px-8">
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f8b6d] dark:bg-[#172128] dark:text-[#9dc0ff]">
                {isClient ? 'Client Dashboard' : 'Booking Dashboard'}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
                  {isClient ? 'Simple booking calendar' : 'Calendar monitoring board'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {isClient
                    ? 'This version keeps the calendar simple for clients. Click any date, review AM / PM / EVE availability, and continue to booking.'
                    : 'The month board now uses a tighter no-gap Google-style layout with connected multi-day bars and a reliable long-press quick rule for admin and manager accounts.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/bookings/create"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <CalendarDays className="h-4 w-4" />
                  Create Booking
                </Link>

                {isClient ? (
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    View Public Calendar
                  </Link>
                ) : (
                  <>
                    {canManageBlocks ? (
                      <button
                        type="button"
                        onClick={() => openCreate(selectedDate)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
                      >
                        <Plus className="h-4 w-4" />
                        Quick Calendar Rule
                      </button>
                    ) : null}

                    <Link
                      href="/calendar/manage"
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      Manage Calendar Center
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-black/5 bg-[#f7f5ef] px-6 py-8 dark:border-white/10 dark:bg-white/5 lg:border-l lg:border-t-0">
              <div className="grid gap-3 sm:grid-cols-2">
                {summaryCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.label}
                      className="rounded-2xl border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-[#eef7f4] p-2 text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{card.label}</div>
                          <div className="mt-1 text-2xl font-semibold">{card.value}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-black/5 bg-white px-4 py-4 text-sm dark:border-white/10 dark:bg-[#17181c]">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Calendar behavior</div>
                <div className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {canManageBlocks
                    ? 'Press and hold a day cell to create a backend calendar rule without leaving the dashboard. Regular click still opens the date inspector.'
                    : 'Click a day cell or a connected event bar to inspect bookings, public events, and blocked ranges for that date.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white px-5 py-6 shadow-sm dark:border-white/10 dark:bg-[#121318] md:px-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Month</div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">{monthLabel(monthToDate(month))}</h2>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => router.get('/dashboard', { month: shiftMonth(month, -1) }, { preserveState: true, preserveScroll: true })}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => router.get('/dashboard', { month: shiftMonth(month, 1) }, { preserveState: true, preserveScroll: true })}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[860px] overflow-hidden rounded-[1.75rem] border border-slate-200 dark:border-white/10">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {weekdayLabels.map((label) => (
                    <div key={label} className="border-r border-slate-200 px-2 py-3 last:border-r-0 dark:border-white/10">
                      {label}
                    </div>
                  ))}
                </div>

                <div>
                  {weeks.map((week, weekIndex) => {
                    const lanes = buildWeekLanes(week, events);
                    const maxVisibleLanes = isClient ? 3 : 5;
                    const visibleLanes = lanes.slice(0, maxVisibleLanes);
                    const hiddenCount = Math.max(lanes.length - visibleLanes.length, 0);
                    const cellHeight = 118;
                    const laneTop = 34;
                    const laneHeight = 20;
                    const laneGap = 4;
                    const footerHeight = hiddenCount > 0 ? 22 : 8;
                    const weekHeight = cellHeight + Math.max(visibleLanes.length, 1) * (laneHeight + laneGap) + footerHeight;

                    return (
                      <div
                        key={`week-${weekIndex}`}
                        className="relative border-b border-slate-200 last:border-b-0 dark:border-white/10"
                        style={{ height: `${weekHeight}px` }}
                      >
                        <div className="grid h-[118px] grid-cols-7">
                          {week.map((cell, index) => {
                            if (!cell) {
                              return (
                                <div
                                  key={`blank-${weekIndex}-${index}`}
                                  className="border-r border-slate-200 bg-slate-50/60 last:border-r-0 dark:border-white/10 dark:bg-[#0f1117]"
                                />
                              );
                            }

                            const key = dateKey(cell);
                            const rows = events.filter((event) => eventSpansDate(event, key));
                            const selected = key === selectedDate;
                            const dayStatus = deriveDayStatus({ availability: monthAvailability[key], events: rows, isClient });
                            const status = normalizeDashboardStatus(
                              dayStatus,
                              isClient && events.some((event) => event.kind === 'booking' && eventSpansDate(event, key)),
                            );
                            const availableBlocks = BLOCK_KEYS.filter((block) => monthAvailability[key]?.[block] !== false).length;

                            return (
                              <button
                                key={key}
                                type="button"
                                onPointerDown={() => startPress(key)}
                                onPointerUp={() => endPress(key)}
                                onPointerCancel={() => clearPress()}
                                onPointerLeave={() => clearPress()}
                                className={cn(
                                  'relative min-h-[118px] border-r border-b border-slate-200 bg-white px-2.5 py-2 text-left transition-colors dark:border-white/10 dark:bg-[#11151d]',
                                  selected && 'z-[2] ring-2 ring-inset ring-slate-900 dark:ring-white',
                                  status === 'blocked' && 'bg-red-50/60 dark:bg-red-500/10',
                                  status === 'public' && 'bg-violet-50/65 dark:bg-violet-500/10',
                                  status === 'private' && 'bg-amber-50/65 dark:bg-amber-500/10',
                                  status === 'partial' && 'bg-sky-50/65 dark:bg-sky-500/10',
                                  status === 'my-booking' && 'bg-emerald-50/70 dark:bg-emerald-500/10',
                                  index === 6 && 'border-r-0',
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-base font-semibold text-slate-900 dark:text-white">{cell.getDate()}</span>
                                  <span
                                    className={cn(
                                      'mt-0.5 inline-block h-2.5 w-2.5 rounded-full',
                                      status === 'blocked'
                                        ? 'bg-red-500 dark:bg-red-300'
                                        : status === 'public'
                                          ? 'bg-violet-500 dark:bg-violet-300'
                                          : status === 'private'
                                            ? 'bg-amber-500 dark:bg-amber-300'
                                            : status === 'partial'
                                              ? 'bg-sky-500 dark:bg-sky-300'
                                              : status === 'my-booking'
                                                ? 'bg-emerald-500 dark:bg-emerald-300'
                                                : 'bg-slate-300 dark:bg-slate-600',
                                    )}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  <span>{scheduleStatusLabel(dayStatus)}</span>
                                  <span>{availableBlocks}/3</span>
                                </div>
                                <div className="mt-2 flex gap-1.5">
                                  {BLOCK_KEYS.map((block) => {
                                    const open = monthAvailability[key]?.[block] !== false;
                                    return (
                                      <span
                                        key={block}
                                        className={cn(
                                          'h-1.5 flex-1 rounded-full',
                                          open ? 'bg-emerald-500/75 dark:bg-emerald-300/80' : 'bg-slate-300 dark:bg-slate-700',
                                        )}
                                      />
                                    );
                                  })}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
                          {visibleLanes.map((lane, laneIndex) =>
                            lane.map((segment) => {
                              const left = `${(segment.startCol / 7) * 100}%`;
                              const width = `${((segment.endCol - segment.startCol + 1) / 7) * 100}%`;
                              const top = laneTop + laneIndex * (laneHeight + laneGap);

                              return (
                                <div
                                  key={`${String(segment.event.id)}-${segment.startCol}-${segment.endCol}`}
                                  className="absolute px-1.5"
                                  style={{ left, width, top }}
                                >
                                  <div
                                    className={cn(
                                      'flex h-5 items-center overflow-hidden border px-2 text-[10px] font-semibold shadow-sm',
                                      eventBarTone(segment.event),
                                      segment.isStart ? 'rounded-l-full' : 'rounded-l-md',
                                      segment.isEnd ? 'rounded-r-full' : 'rounded-r-md',
                                    )}
                                    title={`${segment.event.title} • ${formatEventRange(segment.event)}`}
                                  >
                                    <span className="truncate">{segment.isStart ? segment.event.title : '…'}</span>
                                  </div>
                                </div>
                              );
                            }),
                          )}
                        </div>

                        {hiddenCount > 0 ? (
                          <div className="absolute bottom-1 left-2 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                            +{hiddenCount} more overlapping item{hiddenCount > 1 ? 's' : ''}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Selected Date</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">{longDate(selectedDate)}</h2>

              <div className={cn('mt-4 rounded-2xl border px-4 py-4 text-sm', scheduleStatusTone(derivedStatus))}>
                <div className="font-semibold uppercase tracking-[0.16em]">{scheduleStatusLabel(derivedStatus)}</div>
                <div className="mt-2">{scheduleStatusDescription(derivedStatus)}</div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {BLOCK_KEYS.map((block) => {
                  const available = selectedAvailability?.[block] ?? true;
                  const active = activeBlock === block;

                  return (
                    <button
                      key={block}
                      type="button"
                      onClick={() => setActiveBlock(block)}
                      className={cn(
                        'rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition',
                        active && 'ring-2 ring-[#111827] ring-offset-2 dark:ring-white dark:ring-offset-[#121318]',
                        available
                          ? 'border-black/10 bg-white text-[#1f1f1c] dark:border-white/10 dark:bg-[#17181c] dark:text-white'
                          : 'border-[#d7b14b] bg-[#f7ebc1] text-[#6a4f00]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{BLOCK_META[block].label}</span>
                        <ArrowRight className={cn('h-4 w-4 transition', active ? 'opacity-100' : 'opacity-40')} />
                      </div>
                      <div className="mt-1 text-xs font-medium opacity-80">{BLOCK_META[block].time}</div>
                      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em]">
                        {available ? 'Available' : 'Unavailable'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-black/5 bg-[#f8f8f8] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{activeBlock} Time Block</div>
                <div className="mt-1 text-lg font-semibold text-[#1f1f1c] dark:text-white">{BLOCK_META[activeBlock].time}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {(selectedAvailability?.[activeBlock] ?? true)
                    ? 'This block is still open under the current dashboard availability rules.'
                    : 'This block is already occupied by a booking, event, or admin block.'}
                </div>

                <div className="mt-4 space-y-3">
                  {blockEvents.length > 0 ? (
                    blockEvents.map((event) => (
                      <div
                        key={`${event.id}-${activeBlock}`}
                        className="rounded-2xl border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#17181c]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-[#1f1f1c] dark:text-white">{event.title}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatEventRange(event)}</div>
                            {event.area ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Area: {event.area}</div> : null}
                            {event.block ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Block: {event.block}</div> : null}
                          </div>

                          {event.status ? (
                            <div
                              className={cn(
                                'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                                statusChipTone(event.status),
                              )}
                            >
                              {String(event.status).replaceAll('_', ' ')}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                      No item overlaps this specific time block.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={bookingHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <CalendarDays className="h-4 w-4" />
                  Continue to Booking
                </Link>

                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  View Public Calendar
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Events / Bookings</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">Items on this date</h2>

              <div className="mt-5 space-y-4">
                {selectedEvents.length > 0 ? (
                  selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-black/5 bg-[#f7f5ef] px-4 py-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-[#1f1f1c] dark:text-white">{event.title}</div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatEventRange(event)}</div>
                          {event.area ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Area: {event.area}</div> : null}
                          {event.block ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Block: {event.block}</div> : null}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {event.kind ? (
                            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {String(event.kind).replaceAll('_', ' ')}
                            </div>
                          ) : null}

                          {event.status ? (
                            <div
                              className={cn(
                                'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
                                statusChipTone(event.status),
                              )}
                            >
                              {String(event.status).replaceAll('_', ' ')}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                    No bookings, public events, or calendar blocks were found for this date.
                  </div>
                )}
              </div>
            </div>

            {isStaffView ? (
              <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-[#f7ebc1] p-2 text-[#6a4f00]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Staff Controls</div>
                    <h3 className="mt-2 text-xl font-semibold text-[#1f1f1c] dark:text-white">Monitor and manage the calendar layer</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {canManageBlocks
                        ? 'Use the dashboard quick rule for fast note entry, or open the full calendar management area to edit ranges, overlaps, and multi-day blocks.'
                        : 'Use the calendar management area to review overlaps and keep the public and booking calendars aligned.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/calendar/manage"
                        className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
                      >
                        Manage Calendar
                      </Link>

                      <Link
                        href="/bookings"
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                      >
                        Open Booking List
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
