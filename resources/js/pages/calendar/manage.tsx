import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight, Edit3, Info, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarBlockModal, type BlockKey, type CalendarBlockFormState } from '@/components/calendar/calendar-block-modal';
import {
  BLOCK_KEYS,
  buildMonthWeeks,
  dateKey,
  deriveDayStatus,
  eventEndsOnDate,
  eventSpansDate,
  eventStartsOnDate,
  longDate,
  monthLabel,
  monthToDate,
  normalizeEventRange,
  scheduleStatusLabel,
  shiftMonth,
} from '@/lib/unified-schedule';
import { canManageCalendarBlocks, type WorkspaceAuthLike } from '@/lib/workspace';

type DayAvailability = {
  date: string;
  day_status: string;
  AM: boolean;
  PM: boolean;
  EVE: boolean;
  is_fully_booked?: boolean;
};

type CalendarEvent = {
  id: number | string;
  kind: 'booking' | 'block' | 'public_event';
  title: string;
  start: string;
  end: string;
  status?: string | null;
  payment_status?: string | null;
  area?: string | null;
  block?: string | null;
  block_id?: number;
  public_status?: string | null;
  note?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  company_name?: string | null;
  guest_count?: number | null;
  summary?: string | null;
  description?: string | null;
  time?: string | null;
  image?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

type HighlightItem = {
  id: number;
  scope: 'bccc' | 'city';
  title: string;
  venue: string;
  date: string;
  time: string;
  summary: string;
  description: string;
  image: string;
};

type Props = {
  month: string;
  monthAvailability: Record<string, DayAvailability>;
  events: CalendarEvent[];
  highlights: {
    bccc: HighlightItem[];
    city: HighlightItem[];
  };
  areaOptions: string[];
};

type WeekCell = Date | null;
type EventLaneSegment = {
  event: CalendarEvent;
  startCol: number;
  endCol: number;
  isStart: boolean;
  isEnd: boolean;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function eventDurationDays(event: CalendarEvent) {
  const { startDate, endDate } = normalizeEventRange(event);
  if (!startDate || !endDate) return 1;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(diff + 1, 1);
}

function eventSortValue(event: CalendarEvent) {
  const priority: Record<string, number> = {
    booking: 0,
    public_event: 1,
    block: 2,
  };

  return priority[String(event.kind ?? '')] ?? 9;
}

function buildWeekLanes(week: WeekCell[], events: CalendarEvent[]) {
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

function eventBarTone(event: CalendarEvent) {
  const normalized = String(event.status ?? '').toLowerCase();

  if (normalized === 'public_booked') {
    return 'border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200';
  }
  if (['private_booked', 'confirmed', 'active'].includes(normalized)) {
    return 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200';
  }
  if (normalized === 'blocked') {
    return 'border-red-300 bg-red-100 text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200';
  }
  return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white';
}

function chipTone(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'public_booked') return 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200';
  if (['private_booked', 'confirmed', 'active'].includes(normalized)) return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200';
  if (normalized === 'blocked') return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200';
  if (normalized === 'pending') return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
}

function pickInitialDate(month: string, monthAvailability: Props['monthAvailability'], events: CalendarEvent[]) {
  const today = dateKey(new Date());
  if (today.startsWith(month) && (monthAvailability[today] || events.some((event) => eventSpansDate(event, today)))) {
    return today;
  }

  const first = Object.keys(monthAvailability).sort()[0];
  if (first) return first;

  const eventDate = events.map((event) => normalizeEventRange(event).startDate).find(Boolean);
  return eventDate || `${month}-01`;
}

export default function CalendarManage({ month, monthAvailability, events, highlights, areaOptions }: Props) {
  const { props } = usePage<{ auth?: WorkspaceAuthLike }>();
  const canManageBlocks = canManageCalendarBlocks(props.auth);
  const [selectedDate, setSelectedDate] = useState(() => pickInitialDate(month, monthAvailability, events));
  const [activeHighlightTab, setActiveHighlightTab] = useState<'bccc' | 'city'>('bccc');
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CalendarBlockFormState>({
    title: 'Internal calendar note',
    area: '',
    notes: '',
    block: 'AM',
    public_status: 'red',
    date_from: pickInitialDate(month, monthAvailability, events),
    date_to: pickInitialDate(month, monthAvailability, events),
  });
  const holdTimerRef = useRef<number | null>(null);
  const holdTriggeredRef = useRef(false);

  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const selectedEvents = useMemo(() => events.filter((event) => eventSpansDate(event, selectedDate)), [events, selectedDate]);
  const selectedBlocks = selectedEvents.filter((event) => event.kind === 'block');
  const selectedBookings = selectedEvents.filter((event) => event.kind === 'booking');
  const selectedPublicEvents = selectedEvents.filter((event) => event.kind === 'public_event');
  const selectedDerivedStatus = deriveDayStatus({ availability: monthAvailability[selectedDate], events: selectedEvents, isClient: false });
  const activeHighlights = activeHighlightTab === 'bccc' ? highlights.bccc : highlights.city;
  const activeHighlight = activeHighlights[activeHighlightIndex] || null;

  useEffect(() => {
    setSelectedDate(pickInitialDate(month, monthAvailability, events));
  }, [month, monthAvailability, events]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, date_from: selectedDate, date_to: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    setActiveHighlightIndex(0);
  }, [activeHighlightTab]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  function openCreate(dateValue: string) {
    if (!canManageBlocks) return;
    setEditorMode('create');
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

  function openEdit(event: CalendarEvent) {
    if (!canManageBlocks) return;
    setEditorMode('edit');
    setError('');
    setForm({
      title: event.title.replace(/^BLOCK:\s*/i, ''),
      area: event.area || '',
      notes: event.note || '',
      block: (String(event.block || 'AM').toUpperCase() as BlockKey),
      public_status: (String(event.public_status || 'red').toLowerCase() as CalendarBlockFormState['public_status']),
      date_from: event.dateFrom || String(event.start).slice(0, 10),
      date_to: event.dateTo || normalizeEventRange(event).endDate,
      block_id: event.block_id,
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

  function clearPress() {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdTriggeredRef.current = false;
  }

  function endPress(dateValue: string) {
    const wasLongPress = holdTriggeredRef.current;
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
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

      if (editorMode === 'edit' && form.block_id) {
        await sendJson(`/calendar-blocks/${form.block_id}`, 'PUT', {
          ...form,
          title: form.title.trim(),
          area: form.area.trim(),
          notes: form.notes.trim(),
        });
      } else {
        await sendJson('/calendar-blocks', 'POST', {
          ...form,
          title: form.title.trim(),
          area: form.area.trim(),
          notes: form.notes.trim(),
        });
      }

      setEditorOpen(false);
      router.reload({ preserveScroll: true, preserveState: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the calendar rule.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteBlock(event: CalendarEvent) {
    if (!canManageBlocks || !event.block_id) return;
    if (!window.confirm('Delete this calendar block?')) return;

    try {
      await sendJson(`/calendar-blocks/${event.block_id}`, 'DELETE');
      router.reload({ preserveScroll: true, preserveState: true });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Unable to delete the calendar block.');
    }
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Calendar Management', href: '/calendar/manage' }]}> 
      <Head title="Calendar Management" />

      <CalendarBlockModal
        open={editorOpen}
        title={editorMode === 'edit' ? 'Edit calendar rule' : 'Create calendar rule'}
        form={form}
        areaOptions={areaOptions}
        busy={busy}
        error={error}
        helperText="Quick input on this page writes to the same backend calendar-block API used by the dashboard and admin content screens."
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onClose={() => setEditorOpen(false)}
        onSave={saveForm}
      />

      <div className="space-y-6 p-4 md:p-6">
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#121318]">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4 px-6 py-8 sm:px-8">
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f8b6d] dark:bg-[#172128] dark:text-[#9dc0ff]">
                Backend calendar center
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">Google-style calendar management</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  This page has been hardened into a safer no-gap month board so the old black-screen issue is avoided. Hold any date to create a quick backend note or block, or use the selected-date inspector to edit existing calendar rules.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {canManageBlocks ? (
                  <button type="button" onClick={() => openCreate(selectedDate)} className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                    <Plus className="h-4 w-4" />
                    New calendar rule
                  </button>
                ) : null}
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <CalendarDays className="h-4 w-4" />
                  Back to dashboard
                </Link>
                <Link href="/admin/guidelines-contacts" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <Info className="h-4 w-4" />
                  Backend Guidelines & Contacts
                </Link>
              </div>
            </div>

            <div className="border-t border-black/5 bg-[#f7f5ef] px-6 py-8 dark:border-white/10 dark:bg-white/5 lg:border-l lg:border-t-0">
              <div className="rounded-[1.6rem] border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-[#17181c]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Selected day status</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{scheduleStatusLabel(selectedDerivedStatus)}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{longDate(selectedDate)}</div>
              </div>

              <div className="mt-4 rounded-[1.6rem] border border-black/5 bg-white p-5 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-[#17181c] dark:text-slate-300">
                {canManageBlocks
                  ? 'Hold a date cell for about half a second to open the quick input modal. Click normally to inspect bookings, public events, and blocks on that date.'
                  : 'Click any day cell to inspect bookings, public events, and calendar rules on that date.'}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[2rem] border border-black/5 bg-white px-5 py-6 shadow-sm dark:border-white/10 dark:bg-[#121318] md:px-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Month board</div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">{monthLabel(monthToDate(month))}</h2>
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" onClick={() => router.get('/calendar/manage', { month: shiftMonth(month, -1) }, { preserveState: true, preserveScroll: true })}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => router.get('/calendar/manage', { month: shiftMonth(month, 1) }, { preserveState: true, preserveScroll: true })}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[860px] overflow-hidden rounded-[1.75rem] border border-slate-200 dark:border-white/10">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {weekdayLabels.map((label) => (
                    <div key={label} className="border-r border-slate-200 px-2 py-3 last:border-r-0 dark:border-white/10">{label}</div>
                  ))}
                </div>

                <div>
                  {weeks.map((week, weekIndex) => {
                    const lanes = buildWeekLanes(week, events);
                    const maxVisibleLanes = 6;
                    const visibleLanes = lanes.slice(0, maxVisibleLanes);
                    const hiddenCount = Math.max(lanes.length - visibleLanes.length, 0);
                    const cellHeight = 132;
                    const laneTop = 32;
                    const laneHeight = 20;
                    const laneGap = 4;
                    const footerHeight = hiddenCount > 0 ? 22 : 10;
                    const weekHeight = cellHeight + Math.max(visibleLanes.length, 1) * (laneHeight + laneGap) + footerHeight;

                    return (
                      <div key={`week-${weekIndex}`} className="relative border-b border-slate-200 last:border-b-0 dark:border-white/10" style={{ height: `${weekHeight}px` }}>
                        <div className="grid h-[132px] grid-cols-7">
                          {week.map((cell, index) => {
                            if (!cell) {
                              return <div key={`blank-${weekIndex}-${index}`} className="border-r border-slate-200 bg-slate-50/60 last:border-r-0 dark:border-white/10 dark:bg-[#0f1117]" />;
                            }

                            const key = dateKey(cell);
                            const rows = events.filter((event) => eventSpansDate(event, key));
                            const selected = key === selectedDate;
                            const status = deriveDayStatus({ availability: monthAvailability[key], events: rows, isClient: false });
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
                                  'relative min-h-[132px] border-r border-b border-slate-200 bg-white px-2.5 py-2 text-left transition-colors dark:border-white/10 dark:bg-[#11151d]',
                                  selected && 'z-[2] ring-2 ring-inset ring-slate-900 dark:ring-white',
                                  status === 'blocked' && 'bg-red-50/60 dark:bg-red-500/10',
                                  status === 'public_booked' && 'bg-violet-50/65 dark:bg-violet-500/10',
                                  status === 'private_booked' && 'bg-amber-50/65 dark:bg-amber-500/10',
                                  status === 'limited' && 'bg-sky-50/65 dark:bg-sky-500/10',
                                  index === 6 && 'border-r-0',
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-base font-semibold text-slate-900 dark:text-white">{cell.getDate()}</span>
                                  <span className={cn('mt-0.5 inline-block h-2.5 w-2.5 rounded-full', status === 'blocked' ? 'bg-red-500 dark:bg-red-300' : status === 'public_booked' ? 'bg-violet-500 dark:bg-violet-300' : status === 'private_booked' ? 'bg-amber-500 dark:bg-amber-300' : status === 'limited' ? 'bg-sky-500 dark:bg-sky-300' : 'bg-slate-300 dark:bg-slate-600')} />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  <span>{scheduleStatusLabel(status)}</span>
                                  <span>{availableBlocks}/3</span>
                                </div>
                                <div className="mt-2 flex gap-1.5">
                                  {BLOCK_KEYS.map((block) => {
                                    const open = monthAvailability[key]?.[block] !== false;
                                    return <span key={block} className={cn('h-1.5 flex-1 rounded-full', open ? 'bg-emerald-500/75 dark:bg-emerald-300/80' : 'bg-slate-300 dark:bg-slate-700')} />;
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
                                <div key={`${String(segment.event.id)}-${segment.startCol}-${segment.endCol}`} className="absolute px-1.5" style={{ left, width, top }}>
                                  <div className={cn('flex h-5 items-center overflow-hidden border px-2 text-[10px] font-semibold shadow-sm', eventBarTone(segment.event), segment.isStart ? 'rounded-l-full' : 'rounded-l-md', segment.isEnd ? 'rounded-r-full' : 'rounded-r-md')}>
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
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Selected date inspector</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">{longDate(selectedDate)}</h3>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', chipTone(selectedDerivedStatus))}>{scheduleStatusLabel(selectedDerivedStatus)}</span>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Calendar blocks</div>
                  <div className="space-y-3">
                    {selectedBlocks.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">No block on this date.</div> : null}
                    {selectedBlocks.map((event) => (
                      <div key={String(event.id)} className="rounded-[1.35rem] border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</div>
                          <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', chipTone(event.status))}>{String(event.block || 'AM')}</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{event.area || 'All areas'} • {event.dateFrom || String(event.start).slice(0, 10)} to {event.dateTo || normalizeEventRange(event).endDate}</div>
                        {event.note ? <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.note}</div> : null}
                        {canManageBlocks ? (
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => openEdit(event)} className="rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
                            <button type="button" onClick={() => deleteBlock(event)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Bookings</div>
                  <div className="space-y-3">
                    {selectedBookings.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">No booking on this date.</div> : null}
                    {selectedBookings.map((event) => (
                      <div key={String(event.id)} className="rounded-[1.35rem] border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{event.client_name || event.company_name || 'Booking record'}</div>
                        {event.payment_status ? <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Payment: {event.payment_status}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Public events</div>
                  <div className="space-y-3">
                    {selectedPublicEvents.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">No public event on this date.</div> : null}
                    {selectedPublicEvents.map((event) => (
                      <div key={String(event.id)} className="rounded-[1.35rem] border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</div>
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{event.area || 'Baguio Convention & Cultural Center'} {event.time ? `• ${event.time}` : ''}</div>
                        {event.summary ? <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.summary}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Highlight browser</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">BCCC / City events</h3>
                </div>
                <div className="inline-flex rounded-full border border-black/10 p-1 dark:border-white/10">
                  <button type="button" onClick={() => setActiveHighlightTab('bccc')} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]', activeHighlightTab === 'bccc' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300')}>BCCC</button>
                  <button type="button" onClick={() => setActiveHighlightTab('city')} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]', activeHighlightTab === 'city' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300')}>Baguio City</button>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
                <div className="space-y-3">
                  {activeHighlights.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">No highlight records available.</div> : null}
                  {activeHighlights.map((item, index) => {
                    const active = index === activeHighlightIndex;
                    return (
                      <button key={`${item.scope}-${item.id}`} type="button" onClick={() => setActiveHighlightIndex(index)} className={cn('relative w-full overflow-hidden rounded-[1.35rem] border p-4 text-left transition', active ? 'border-slate-900 bg-slate-900 text-white shadow-xl dark:border-white dark:bg-white dark:text-slate-900' : 'border-black/10 bg-white opacity-75 shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:opacity-100 dark:border-white/10 dark:bg-[#17181c] dark:text-white') }>
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className={cn('mt-1 text-xs', active ? 'text-white/80 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400')}>{item.venue}</div>
                        <div className={cn('mt-2 text-[11px] uppercase tracking-[0.16em]', active ? 'text-white/70 dark:text-slate-600' : 'text-slate-500 dark:text-slate-500')}>{item.date}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-[260px] rounded-[1.6rem] border border-black/10 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-[#17181c]">
                  {activeHighlight ? (
                    <>
                      {activeHighlight.image ? <div className="mb-4 overflow-hidden rounded-[1.35rem]"><img src={activeHighlight.image} alt={activeHighlight.title} className="h-48 w-full object-cover" /></div> : null}
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Details</div>
                      <h4 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{activeHighlight.title}</h4>
                      <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{activeHighlight.venue} • {activeHighlight.date}{activeHighlight.time ? ` • ${activeHighlight.time}` : ''}</div>
                      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{activeHighlight.description || activeHighlight.summary}</p>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">Choose a highlight card to review its details.</div>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
