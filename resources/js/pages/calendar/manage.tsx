import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Layers3, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BLOCK_KEYS,
  BLOCK_META,
  buildMonthWeeks,
  dateKey,
  deriveDayStatus,
  eventSpansDate,
  longDate,
  monthLabel,
  scheduleStatusDescription,
  scheduleStatusLabel,
  scheduleStatusTone,
  shiftMonth,
} from '@/lib/unified-schedule';

type BlockKey = 'AM' | 'PM' | 'EVE';

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

type ModalState =
  | { type: 'none' }
  | {
      type: 'single';
      mode: 'create' | 'edit';
      payload: {
        title: string;
        area: string;
        notes: string;
        block: string;
        public_status: string;
        date_from: string;
        date_to: string;
        block_id?: number;
      };
    }
  | {
      type: 'bulk';
      payload: {
        title: string;
        area: string;
        notes: string;
        block: string;
        public_status: string;
        date_from: string;
        date_to: string;
        explode_by_day: boolean;
        exclude_weekends: boolean;
      };
    };

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const blockMeta: Record<BlockKey, { label: string; time: string }> = {
  AM: { label: 'AM', time: '6:00 AM – 12:00 PM' },
  PM: { label: 'PM', time: '12:00 PM – 6:00 PM' },
  EVE: { label: 'EVE', time: '6:00 PM – 11:59 PM' },
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function chipTone(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'public_booked') return 'bg-[#ede8ff] text-[#5532c7]';
  if (['private_booked', 'confirmed', 'active'].includes(normalized)) return 'bg-[#f7ebc1] text-[#6a4f00]';
  if (normalized === 'blocked') return 'bg-[#ffe3e3] text-[#a52a2a]';
  if (normalized === 'pending') return 'bg-[#eef4ff] text-[#1645ac]';
  if (normalized === 'completed') return 'bg-[#eef7f4] text-[#174f40]';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function statusCardTone(status: string) {
  switch (status) {
    case 'blocked':
      return 'border-[#f1aaaa] bg-[#ffe5e5] text-[#a52a2a]';
    case 'public_booked':
      return 'border-[#c9bcff] bg-[#f1ecff] text-[#5532c7]';
    case 'private_booked':
      return 'border-[#d7b14b] bg-[#f7ebc1] text-[#6a4f00]';
    case 'limited':
      return 'border-[#bfd2ff] bg-[#eef4ff] text-[#1645ac]';
    default:
      return 'border-black/10 bg-white text-slate-800 dark:border-white/10 dark:bg-[#17181c] dark:text-white';
  }
}

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
    throw new Error(json?.message || 'Request failed.');
  }
  return json;
}

function SimpleModal({
  title,
  open,
  children,
  onClose,
}: {
  title: string;
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border bg-white shadow-[0_40px_120px_rgba(0,0,0,0.28)] dark:border-white/10 dark:bg-[#121318]">
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 px-3 py-1 text-sm dark:border-white/10"
          >
            Close
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function CalendarManage({ month, monthAvailability, events, highlights, areaOptions }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = dateKey(new Date());
    if (today.startsWith(month) && monthAvailability[today]) return today;
    return Object.keys(monthAvailability).sort()[0] || `${month}-01`;
  });
  const [activeHighlight, setActiveHighlight] = useState<HighlightItem | null>(highlights.bccc[0] || highlights.city[0] || null);
  const [activeHighlightTab, setActiveHighlightTab] = useState<'bccc' | 'city'>('bccc');
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const selectedAvailability = monthAvailability[selectedDate];
  const selectedEvents = useMemo(
    () => events.filter((event) => eventSpansDate(event, selectedDate)),
    [events, selectedDate],
  );

  const selectedBookings = selectedEvents.filter((event) => event.kind === 'booking');
  const selectedBlocks = selectedEvents.filter((event) => event.kind === 'block');
  const selectedPublicEvents = selectedEvents.filter((event) => event.kind === 'public_event');

  const selectedDerivedStatus = deriveDayStatus({
  availability: selectedAvailability,
  events: selectedEvents,
  isClient: false,
});

  useEffect(() => {
    if (activeHighlightTab === 'bccc' && !activeHighlight && highlights.bccc.length > 0) {
      setActiveHighlight(highlights.bccc[0]);
    }
    if (activeHighlightTab === 'city' && !activeHighlight && highlights.city.length > 0) {
      setActiveHighlight(highlights.city[0]);
    }
  }, [activeHighlight, activeHighlightTab, highlights]);

  function openCreateModal() {
    setModalState({
      type: 'single',
      mode: 'create',
      payload: {
        title: '',
        area: '',
        notes: '',
        block: 'AM',
        public_status: 'red',
        date_from: selectedDate,
        date_to: selectedDate,
      },
    });
  }

  function openEditBlock(event: CalendarEvent) {
    setModalState({
      type: 'single',
      mode: 'edit',
      payload: {
        title: String(event.title || '').replace(/^BLOCK:\s*/, ''),
        area: String(event.area || ''),
        notes: String(event.note || ''),
        block: String(event.block || 'AM'),
        public_status: String(event.public_status || 'red'),
        date_from: String(event.start).slice(0, 10),
        date_to: String(event.end).slice(0, 10),
        block_id: Number(event.block_id),
      },
    });
  }

  function openBulkModal() {
    setModalState({
      type: 'bulk',
      payload: {
        title: '',
        area: '',
        notes: '',
        block: 'AM',
        public_status: 'red',
        date_from: selectedDate,
        date_to: selectedDate,
        explode_by_day: true,
        exclude_weekends: false,
      },
    });
  }

  async function saveModal() {
    try {
      setBusy(true);
      setFeedback('');
      if (modalState.type === 'single') {
        const payload = modalState.payload;
        if (modalState.mode === 'create') {
          await sendJson('/calendar-blocks', 'POST', payload);
          setFeedback('Calendar block created successfully.');
        } else {
          await sendJson(`/calendar-blocks/${payload.block_id}`, 'PUT', payload);
          setFeedback('Calendar block updated successfully.');
        }
      }

      if (modalState.type === 'bulk') {
        await sendJson('/calendar-blocks/bulk', 'POST', modalState.payload);
        setFeedback('Bulk calendar action saved successfully.');
      }

      setModalState({ type: 'none' });
      router.reload({ preserveScroll: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to save calendar changes.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteBlock(event: CalendarEvent) {
    if (!event.block_id) return;
    if (!window.confirm('Delete this calendar block?')) return;

    try {
      setBusy(true);
      setFeedback('');
      await sendJson(`/calendar-blocks/${event.block_id}`, 'DELETE');
      setFeedback('Calendar block deleted successfully.');
      router.reload({ preserveScroll: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to delete calendar block.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Calendar Management', href: '/calendar/manage' }]}>
      <Head title="Calendar Management Center" />

      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f8b6d] dark:bg-[#172128] dark:text-[#9dc0ff]">
                Admin Calendar Management Center
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Faster calendar blocking, selected-date inspection, and event highlight review.
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                This page is focused on admin workflow: left side calendar interaction, selected-date inspector, current bookings and blocks, plus right-side BCCC and city event detail browsing.
              </p>
            </div>

            <div className={cn('mt-5 rounded-2xl border px-4 py-4 text-sm', scheduleStatusTone(selectedDerivedStatus))}>
                <div className="font-semibold uppercase tracking-[0.16em]">{scheduleStatusLabel(selectedDerivedStatus)}</div>
                <div className="mt-2 leading-7">{scheduleStatusDescription(selectedDerivedStatus)}</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => router.get('/calendar/manage', { month: shiftMonth(month, -1) }, { preserveScroll: true })}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous Month
              </Button>
              <Button type="button" variant="outline" onClick={() => router.get('/calendar/manage', { month: shiftMonth(month, 1) }, { preserveScroll: true })}>
                Next Month <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button type="button" onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" /> Add Block
              </Button>
              <Button type="button" variant="outline" onClick={openBulkModal}>
                <Layers3 className="mr-2 h-4 w-4" /> Bulk Action
              </Button>
            </div>
          </div>

          {feedback ? (
            <div className="mt-5 rounded-2xl border border-[#bfd2ff] bg-[#eef4ff] px-4 py-3 text-sm text-[#1645ac]">
              {feedback}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Month</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{monthLabel(month)}</h2>
                </div>
                <div className="rounded-full border border-black/10 bg-slate-50 px-4 py-2 text-sm font-medium dark:border-white/10 dark:bg-white/5">
                  Sunday-first calendar layout
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 pb-3">
                {weekdayLabels.map((label) => (
                  <div key={label} className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    {label}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-2">
                    {week.map((cell, index) => {
                      if (!cell) return <div key={`blank-${weekIndex}-${index}`} className="min-h-[90px] rounded-2xl" />;

                      const key = dateKey(cell);
                      const day = monthAvailability[key];
                      const isSelected = key === selectedDate;
                      const dayEvents = events.filter((event) => eventSpansDate(event, key));
                      const visibleTitles = dayEvents.slice(0, 2);
                      const hiddenCount = Math.max(dayEvents.length - visibleTitles.length, 0);
                      const today = key === dateKey(new Date());

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedDate(key)}
                          className={cn(
                            'min-h-[90px] rounded-2xl border px-3 py-2 text-left transition hover:-translate-y-0.5',
                            scheduleStatusTone(
  deriveDayStatus({
    availability: day,
    events: dayEvents,
    isClient: false,
  }),
),
                            isSelected && 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-[#121318]',
                            today && 'outline outline-2 outline-[#0f8b6d] outline-offset-[-2px]',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-base font-semibold">{cell.getDate()}</span>
                            {today ? <span className="rounded-full bg-[#0f8b6d] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Today</span> : null}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                            <span>{day?.AM === false ? 'AM busy' : 'AM open'}</span>
                            <span>{day?.PM === false ? 'PM busy' : 'PM open'}</span>
                            <span>{day?.EVE === false ? 'EVE busy' : 'EVE open'}</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {visibleTitles.map((event) => (
                              <div key={String(event.id)} className={cn('truncate rounded-md px-2 py-1 text-[11px] font-semibold', chipTone(event.status))}>
                                {event.title}
                              </div>
                            ))}
                            {hiddenCount > 0 ? <div className="text-[11px] font-medium">+{hiddenCount} more</div> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Selected Date Inspector</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{longDate(selectedDate)}</h2>
<p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
  Review the selected date using the same shared AM / PM / EVE interpretation now used by the public calendar.
</p>

                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={openCreateModal}><Plus className="mr-2 h-4 w-4" /> Add single block</Button>
                  <Button type="button" variant="outline" onClick={openBulkModal}><Layers3 className="mr-2 h-4 w-4" /> Bulk action</Button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {BLOCK_KEYS.map((block) => {
                const available = selectedAvailability?.[block] ?? true;
                  return (
                    <div
                      key={block}
                      className={cn(
                        'rounded-2xl border px-4 py-4',
                        available
                          ? 'border-black/10 bg-white dark:border-white/10 dark:bg-[#17181c]'
                          : 'border-[#d7b14b] bg-[#f7ebc1] text-[#6a4f00]',
                      )}
                    >
                      <div className="text-lg font-semibold">{BLOCK_META[block].label}</div>
                      <div className="mt-1 text-sm opacity-80">{BLOCK_META[block].time}</div>
                      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em]">
                        {available ? 'Available' : 'Unavailable'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-[1.5rem] border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#17181c]">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Bookings on selected date</div>
                  <div className="space-y-3">
                    {selectedBookings.length > 0 ? selectedBookings.map((event) => (
                      <div key={String(event.id)} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#121318]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-slate-900 dark:text-white">{event.title}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(event.start)} → {formatDateTime(event.end)}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Client: {event.client_name || '—'} • Guests: {event.guest_count || 0}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Payment: {event.payment_status || '—'}</div>
                          </div>
                          <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', chipTone(event.status))}>
                            {String(event.status || '').replaceAll('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-3">
                          <Link href={`/bookings/${event.id}`} className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold dark:border-white/10">
                            <Eye className="h-3.5 w-3.5" /> Open booking
                          </Link>
                        </div>
                      </div>
                    )) : <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No booking registered on this date.</div>}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#17181c]">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Blocks and public events</div>
                  <div className="space-y-3">
                    {[...selectedBlocks, ...selectedPublicEvents].length > 0 ? [...selectedBlocks, ...selectedPublicEvents].map((event) => (
                      <div key={String(event.id)} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#121318]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-slate-900 dark:text-white">{event.title}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(event.start)} → {formatDateTime(event.end)}</div>
                            {event.area ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Area: {event.area}</div> : null}
                            {event.block ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Block: {event.block}</div> : null}
                            {event.note ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Notes: {event.note}</div> : null}
                          </div>
                          <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', chipTone(event.status))}>
                            {String(event.status || '').replaceAll('_', ' ')}
                          </span>
                        </div>
                        {event.kind === 'block' ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => openEditBlock(event)}>Edit block</Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => deleteBlock(event)} disabled={busy}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    )) : <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No block or public event overlaps this date.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Event Highlights Panel</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">BCCC and Baguio City events</h2>
                </div>
                <div className="inline-flex rounded-full border border-black/10 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHighlightTab('bccc');
                      setActiveHighlight(highlights.bccc[0] || null);
                    }}
                    className={cn('rounded-full px-4 py-2 text-sm font-semibold', activeHighlightTab === 'bccc' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : '')}
                  >
                    BCCC Events
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHighlightTab('city');
                      setActiveHighlight(highlights.city[0] || null);
                    }}
                    className={cn('rounded-full px-4 py-2 text-sm font-semibold', activeHighlightTab === 'city' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : '')}
                  >
                    City Events
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {activeHighlight ? (
                  <div className="overflow-hidden rounded-[1.8rem] border border-black/5 bg-slate-50 dark:border-white/10 dark:bg-[#17181c]">
                    {activeHighlight.image ? (
                      <img src={activeHighlight.image} alt={activeHighlight.title} className="h-56 w-full object-cover" />
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-gradient-to-r from-slate-200 to-slate-100 text-sm text-slate-500 dark:from-slate-900 dark:to-slate-800 dark:text-slate-300">
                        No image available
                      </div>
                    )}
                    <div className="p-5">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Selected event</div>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{activeHighlight.title}</h3>
                      <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <div>Date: {activeHighlight.date}</div>
                        <div>Time: {activeHighlight.time || '—'}</div>
                        <div>Venue: {activeHighlight.venue || '—'}</div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{activeHighlight.summary || activeHighlight.description || 'No event description available.'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.8rem] border border-dashed border-black/10 px-4 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No event highlight available in this section.</div>
                )}

                <div className="space-y-3">
                  {(activeHighlightTab === 'bccc' ? highlights.bccc : highlights.city).map((item) => (
                    <button
                      key={`${item.scope}-${item.id}`}
                      type="button"
                      onClick={() => setActiveHighlight(item)}
                      className={cn(
                        'w-full rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5',
                        activeHighlight?.id === item.id && activeHighlight?.scope === item.scope
                          ? 'border-[#174fda]/30 bg-[#eef4ff] dark:border-[#8ea3ff]/30 dark:bg-[#1a2448]'
                          : 'border-black/5 bg-slate-50 dark:border-white/10 dark:bg-[#17181c]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.date} • {item.time || '—'}</div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.venue || '—'}</div>
                        </div>
                        <CalendarDays className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.summary || item.description || 'No event description available.'}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Quick links</div>
              <div className="mt-4 grid gap-3">
                <Link href="/dashboard" className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold dark:border-white/10">Back to dashboard calendar</Link>
                <Link href="/calendar/analytics" className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold dark:border-white/10">Open calendar analytics</Link>
                <Link href="/bookings/analytics" className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold dark:border-white/10">Open booking analytics</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SimpleModal
        title={modalState.type === 'single' ? (modalState.mode === 'create' ? 'Add calendar block' : 'Edit calendar block') : 'Bulk calendar action'}
        open={modalState.type !== 'none'}
        onClose={() => setModalState({ type: 'none' })}
      >
        {modalState.type === 'single' ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <span>Title</span>
                <input value={modalState.payload.title} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, title: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Area</span>
                <select value={modalState.payload.area} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, area: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]">
                  <option value="">Select area</option>
                  {areaOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Block</span>
                <select value={modalState.payload.block} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, block: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                  <option value="EVE">EVE</option>
                  <option value="DAY">Whole day</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Status</span>
                <select value={modalState.payload.public_status} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, public_status: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]">
                  <option value="red">Blocked / unavailable</option>
                  <option value="gold">Private / reserved</option>
                  <option value="blue">Public / visible event</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Date from</span>
                <input type="date" value={modalState.payload.date_from} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, date_from: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Date to</span>
                <input type="date" value={modalState.payload.date_to} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, date_to: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]" />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium">
              <span>Notes</span>
              <textarea value={modalState.payload.notes} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, notes: e.target.value } })} rows={4} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]" />
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setModalState({ type: 'none' })}>Cancel</Button>
              <Button type="button" onClick={saveModal} disabled={busy}>{busy ? 'Saving...' : modalState.mode === 'create' ? 'Create block' : 'Save changes'}</Button>
            </div>
          </div>
        ) : null}

        {modalState.type === 'bulk' ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <span>Title</span>
                <input value={modalState.payload.title} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, title: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Area</span>
                <select value={modalState.payload.area} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, area: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]">
                  <option value="">Select area</option>
                  {areaOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Block</span>
                <select value={modalState.payload.block} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, block: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                  <option value="EVE">EVE</option>
                  <option value="DAY">Whole day</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Status</span>
                <select value={modalState.payload.public_status} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, public_status: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]">
                  <option value="red">Blocked / unavailable</option>
                  <option value="gold">Private / reserved</option>
                  <option value="blue">Public / visible event</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Date from</span>
                <input type="date" value={modalState.payload.date_from} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, date_from: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span>Date to</span>
                <input type="date" value={modalState.payload.date_to} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, date_to: e.target.value } })} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]" />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium">
              <span>Notes</span>
              <textarea value={modalState.payload.notes} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, notes: e.target.value } })} rows={4} className="w-full rounded-xl border px-3 py-2 dark:border-white/10 dark:bg-[#17181c]" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm dark:border-white/10">
                <input type="checkbox" checked={modalState.payload.explode_by_day} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, explode_by_day: e.target.checked } })} />
                Create one block per day in the selected range
              </label>
              <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm dark:border-white/10">
                <input type="checkbox" checked={modalState.payload.exclude_weekends} onChange={(e) => setModalState({ ...modalState, payload: { ...modalState.payload, exclude_weekends: e.target.checked } })} />
                Skip Saturdays and Sundays
              </label>
            </div>
            <div className="rounded-xl border border-black/5 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-[#17181c] dark:text-slate-300">
              Use this for fast multi-date blocking, private reservations, or public-visibility placeholders across a range.
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setModalState({ type: 'none' })}>Cancel</Button>
              <Button type="button" onClick={saveModal} disabled={busy}>{busy ? 'Saving...' : 'Run bulk action'}</Button>
            </div>
          </div>
        ) : null}
      </SimpleModal>
    </AppLayout>
  );
}
