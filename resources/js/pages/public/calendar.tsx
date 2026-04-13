import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, LoaderCircle, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { PublicEventItem, VenueOption } from '@/types/public-content';
import {
  BLOCK_KEYS,
  BLOCK_META,
  buildMonthWeeks,
  dateKey,
  deriveDayStatus,
  eventSpansDate,
  expandDateRange,
  longDate,
  monthLabel,
  monthToDate,
  resolveBlockAvailable,
  scheduleStatusDescription,
  scheduleStatusLabel,
  scheduleStatusTone,
} from '@/lib/unified-schedule';
import { cn } from '@/lib/utils';

type CalendarBlockItem = {
  title: string;
  area: string;
  notes?: string | null;
  publicStatus: 'blue' | 'gold' | 'red' | string;
  dateFrom: string;
  dateTo: string;
};

type AvailabilityBlock = {
  key: 'AM' | 'PM' | 'EVE' | string;
  label: string;
  from: string;
  to: string;
  is_available: boolean;
};

type AvailabilityResponse = {
  date: string;
  venue: string;
  status: 'available' | 'limited' | 'public_booked' | 'private_booked' | 'blocked';
  title: string;
  description: string;
  note: string;
  blocks?: AvailabilityBlock[] | Record<string, AvailabilityBlock>;
  event_titles?: string[];
  recommended_action?: string;
  can_proceed?: boolean;
};

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.trim() ?? '';
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Unexpected response.' };
  }
}

function pickInitialSelectedDate(
  baseMonth: Date,
  eventMap: Map<string, PublicEventItem[]>,
  blockMap: Map<string, CalendarBlockItem[]>,
) {
  const todayKey = dateKey(new Date());
  const monthPrefix = `${baseMonth.getFullYear()}-${String(baseMonth.getMonth() + 1).padStart(2, '0')}`;

  if (todayKey.startsWith(`${monthPrefix}-`) && (eventMap.has(todayKey) || blockMap.has(todayKey))) {
    return todayKey;
  }

  const firstMarked = [...new Set([...eventMap.keys(), ...blockMap.keys()])]
    .filter((key) => key.startsWith(`${monthPrefix}-`))
    .sort()[0];

  return firstMarked ?? `${monthPrefix}-01`;
}

export default function CalendarPage({
  events = [],
  calendarBlocks = [],
  venueOptions = [],
}: {
  events?: PublicEventItem[];
  calendarBlocks?: CalendarBlockItem[];
  venueOptions?: VenueOption[];
}) {
  const today = new Date();
  const todayKey = dateKey(today);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [selectedVenue, setSelectedVenue] = useState<string>(venueOptions[0]?.value || '');
  const [selectedBlockKey, setSelectedBlockKey] = useState<'AM' | 'PM' | 'EVE'>('AM');
  const [dayStatus, setDayStatus] = useState<AvailabilityResponse | null>(null);
  const [loadingDayStatus, setLoadingDayStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const eventMap = useMemo(() => {
    const map = new Map<string, PublicEventItem[]>();
    events.forEach((event) => {
      const key = event.dateKey || (() => {
        const parsed = new Date(event.date);
        return Number.isNaN(parsed.getTime()) ? '' : dateKey(parsed);
      })();
      if (!key) return;
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [events]);

  const blockMap = useMemo(() => {
    const map = new Map<string, CalendarBlockItem[]>();
    calendarBlocks.forEach((block) => {
      expandDateRange(block.dateFrom, block.dateTo).forEach((key) => {
        const list = map.get(key) ?? [];
        list.push(block);
        map.set(key, list);
      });
    });
    return map;
  }, [calendarBlocks]);

  const weeks = useMemo(() => buildMonthWeeks(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`), [currentMonth]);

  useEffect(() => {
    const monthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    const visible = weeks.some((week) => week.some((cell) => cell && dateKey(cell) === selectedDateKey));
    if (!visible || !selectedDateKey.startsWith(`${monthPrefix}-`)) {
      setSelectedDateKey(pickInitialSelectedDate(currentMonth, eventMap, blockMap));
    }
  }, [currentMonth, selectedDateKey, weeks, eventMap, blockMap]);

  useEffect(() => {
    if (!selectedVenue || !selectedDateKey) return;
    let mounted = true;

    const load = async () => {
      setLoadingDayStatus(true);
      setErrorMessage('');
      try {
        const response = await fetch('/public/availability-check', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
          body: JSON.stringify({ date: selectedDateKey, venue: selectedVenue }),
        });

        const payload = await parseResponse(response);
        if (!response.ok) throw new Error(payload?.message ?? 'Unable to load time block status.');
        if (mounted) setDayStatus(payload);
      } catch (error) {
        if (mounted) {
          setDayStatus(null);
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load time block status.');
        }
      } finally {
        if (mounted) setLoadingDayStatus(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [selectedDateKey, selectedVenue]);

  useEffect(() => {
    const next = BLOCK_KEYS.find((block) => resolveBlockAvailable(dayStatus?.blocks, block)) ?? 'AM';
    setSelectedBlockKey(next);
  }, [dayStatus]);

  const selectedEvents = eventMap.get(selectedDateKey) ?? [];
  const selectedBlocks = blockMap.get(selectedDateKey) ?? [];
  const selectedDateObj = useMemo(() => new Date(`${selectedDateKey}T00:00:00`), [selectedDateKey]);

  const selectedAvailability = useMemo(() => ({
    day_status: dayStatus?.status,
    AM: resolveBlockAvailable(dayStatus?.blocks, 'AM'),
    PM: resolveBlockAvailable(dayStatus?.blocks, 'PM'),
    EVE: resolveBlockAvailable(dayStatus?.blocks, 'EVE'),
    is_fully_booked: BLOCK_KEYS.every((block) => !resolveBlockAvailable(dayStatus?.blocks, block)),
  }), [dayStatus]);

  const derivedStatus = deriveDayStatus({
    availability: selectedAvailability,
    events: [
      ...selectedEvents.map((event) => ({
        start: event.dateKey ? `${event.dateKey}T00:00` : event.date,
        end: event.dateKey ? `${event.dateKey}T23:59` : event.date,
        status: 'public_booked',
        kind: 'public_event',
      })),
      ...selectedBlocks.map((block) => ({
        start: `${block.dateFrom}T00:00`,
        end: `${block.dateTo}T23:59`,
        status: block.publicStatus === 'blue' ? 'public_booked' : block.publicStatus === 'gold' ? 'private_booked' : 'blocked',
        kind: 'block',
      })),
    ],
    isClient: false,
  });

  const visibleBlockEntries = useMemo(
    () => BLOCK_KEYS.map((key) => ({ key, available: resolveBlockAvailable(dayStatus?.blocks, key), meta: BLOCK_META[key] })),
    [dayStatus],
  );

  return (
    <PublicLayout>
      <Head title="Calendar" />

      <div className="space-y-10 pb-14">
        <PageHero
          eyebrow="Public Calendar"
          title="Check availability clearly before you book."
          description="The public calendar now follows the same AM / PM / EVE interpretation more closely, with a simpler client-facing layout."
          imageLight="/marketing/images/events/lightmain.JPG"
          imageDark="/marketing/images/events/darkmain.JPG"
        />

        <section className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Month</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{monthLabel(currentMonth)}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-800 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-800 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2 pb-3">
                {weekdayLabels.map((label) => (
                  <div key={label} className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    {label}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-2">
                    {week.map((cell, cellIndex) => {
                      if (!cell) return <div key={`blank-${weekIndex}-${cellIndex}`} className="min-h-[92px] rounded-2xl" />;
                      const key = dateKey(cell);
                      const cellEvents = (eventMap.get(key) ?? []).map((event) => ({ start: `${key}T00:00`, end: `${key}T23:59`, status: 'public_booked' }));
                      const blocks = blockMap.get(key) ?? [];
                      const blockDerived = {
                        day_status: blocks.some((item) => item.publicStatus === 'red')
                          ? 'blocked'
                          : blocks.some((item) => item.publicStatus === 'gold')
                            ? 'private_booked'
                            : blocks.some((item) => item.publicStatus === 'blue') || cellEvents.length > 0
                              ? 'public_booked'
                              : 'available',
                      };
                      const status = deriveDayStatus({ availability: blockDerived, events: cellEvents });
                      const selected = key === selectedDateKey;
                      const isToday = key === todayKey;
                      const markedCount = (eventMap.get(key)?.length ?? 0) + (blockMap.get(key)?.length ?? 0);

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedDateKey(key)}
                          className={cn(
                            'min-h-[92px] rounded-2xl border px-3 py-2 text-left transition hover:-translate-y-0.5',
                            scheduleStatusTone(status),
                            selected && 'ring-2 ring-[#111827] ring-offset-2 dark:ring-white dark:ring-offset-[#121318]',
                            isToday && 'outline outline-2 outline-[#0f8b6d] outline-offset-[-2px] dark:outline-[#7fd9c0]',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-base font-semibold">{cell.getDate()}</span>
                            {isToday ? <span className="rounded-full bg-[#0f8b6d] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Today</span> : null}
                          </div>
                          <div className="mt-3 text-[11px] font-medium opacity-80">{scheduleStatusLabel(status)}</div>
                          {markedCount > 0 ? <div className="mt-1 text-[11px] opacity-70">{markedCount} item{markedCount > 1 ? 's' : ''}</div> : null}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Selected Date</div>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{longDate(selectedDateKey)}</h2>
                  </div>
                  <div className="w-full max-w-[280px]">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Venue</label>
                    <select
                      value={selectedVenue}
                      onChange={(event) => setSelectedVenue(event.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#17181c]"
                    >
                      {venueOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={cn('mt-5 rounded-2xl border px-4 py-4 text-sm', scheduleStatusTone(derivedStatus))}>
                  <div className="font-semibold uppercase tracking-[0.16em]">{scheduleStatusLabel(derivedStatus)}</div>
                  <div className="mt-2 leading-7">{dayStatus?.description || scheduleStatusDescription(derivedStatus)}</div>
                  {dayStatus?.recommended_action ? <div className="mt-2 text-xs font-medium opacity-80">{dayStatus.recommended_action}</div> : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {visibleBlockEntries.map(({ key, available, meta }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedBlockKey(key)}
                      className={cn(
                        'rounded-2xl border px-4 py-4 text-left transition',
                        key === selectedBlockKey && 'ring-2 ring-[#111827] ring-offset-2 dark:ring-white dark:ring-offset-[#121318]',
                        available
                          ? 'border-black/10 bg-white text-slate-900 dark:border-white/10 dark:bg-[#17181c] dark:text-white'
                          : 'border-[#d7b14b] bg-[#f7ebc1] text-[#6a4f00]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{meta.label}</span>
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div className="mt-1 text-xs opacity-80">{meta.time}</div>
                      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em]">{available ? 'Available' : 'Unavailable'}</div>
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-black/5 bg-[#f8f8f8] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{selectedBlockKey} details</div>
                  {loadingDayStatus ? (
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading schedule status...</div>
                  ) : errorMessage ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-300">{errorMessage}</div>
                  ) : (
                    <>
                      <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{BLOCK_META[selectedBlockKey].time}</div>
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {resolveBlockAvailable(dayStatus?.blocks, selectedBlockKey)
                          ? 'This time block is still open under the current public availability rules.'
                          : 'This time block is already occupied for the selected venue and date.'}
                      </div>
                      {(dayStatus?.event_titles?.length ?? 0) > 0 ? (
                        <div className="mt-4 space-y-2">
                          {dayStatus?.event_titles?.map((title, index) => (
                            <div key={`${title}-${index}`} className="rounded-xl border border-black/5 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#17181c]">{title}</div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/bookings/create?date=${selectedDateKey}`}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90',
                      resolveBlockAvailable(dayStatus?.blocks, selectedBlockKey) ? 'bg-[#174f40] dark:bg-[#294CFF]' : 'pointer-events-none bg-slate-400'
                    )}
                  >
                    <CalendarDays className="h-4 w-4" /> BOOK NOW
                  </Link>
                  <Link href="/events" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                    View Events
                  </Link>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Public Events</div>
                  <div className="mt-4 space-y-3">
                    {selectedEvents.length > 0 ? selectedEvents.map((event) => (
                      <div key={String(event.id)} className="rounded-2xl border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#17181c]">
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">{event.title}</div>
                        <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><MapPin className="h-4 w-4" /> {event.venue}</div>
                        <div className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{event.summary || event.description}</div>
                      </div>
                    )) : <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No public event is registered on this date.</div>}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Calendar Blocks</div>
                  <div className="mt-4 space-y-3">
                    {selectedBlocks.length > 0 ? selectedBlocks.map((block, index) => (
                      <div key={`${block.title}-${index}`} className="rounded-2xl border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#17181c]">
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">{block.title}</div>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{block.area}</div>
                        {block.notes ? <div className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">{block.notes}</div> : null}
                      </div>
                    )) : <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No internal block is registered on this date.</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
