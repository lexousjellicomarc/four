import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, LoaderCircle, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { VenueOption } from '@/types/public-content';
import {
  BLOCK_KEYS,
  BLOCK_META,
  buildMonthWeeks,
  dateKey,
  longDate,
  monthLabel,
  resolveBlockAvailable,
} from '@/lib/unified-schedule';
import { cn } from '@/lib/utils';

type AvailabilityBlock = {
  key: 'AM' | 'PM' | 'EVE' | string;
  label: string;
  from: string;
  to: string;
  is_available: boolean;
};

type PublicDayStatus = {
  date: string;
  venue?: string | null;
  status: 'available' | 'limited' | 'public_booked' | 'private_booked' | 'blocked';
  title: string;
  description: string;
  note: string;
  blocks?: AvailabilityBlock[] | Record<string, AvailabilityBlock>;
  event_titles?: string[];
  recommended_action?: string;
  can_proceed?: boolean;
  is_fully_booked?: boolean;
};

type MonthPayload = {
  month: string;
  venue?: string | null;
  days: PublicDayStatus[];
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

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function startEndForBlock(date: string, blockKey: 'AM' | 'PM' | 'EVE') {
  const meta = BLOCK_META[blockKey];
  if (blockKey === 'EVE') {
    return {
      start: meta.start,
      end: '23:59',
    };
  }

  return {
    start: meta.start,
    end: meta.end,
  };
}

function deriveMonthCellStatus(day: PublicDayStatus | null) {
  if (!day) return 'available';

  const unavailableCount = BLOCK_KEYS.filter((key) => !resolveBlockAvailable(day.blocks, key)).length;

  if (day.status === 'blocked') return 'blocked';
  if (day.status === 'public_booked') return 'public_booked';
  if (day.status === 'private_booked') return 'private_booked';
  if (day.status === 'limited') return 'limited';
  if (day.is_fully_booked || unavailableCount === 3) return 'full';
  if (unavailableCount > 0) return 'limited';

  return 'available';
}

function cellTone(status: string) {
  switch (status) {
    case 'blocked':
      return 'bg-[#ffd9d9] text-[#8b1e1e] dark:bg-[#511f28] dark:text-[#ffd5d5]';
    case 'public_booked':
      return 'bg-[#ece7ff] text-[#4b2bb0] dark:bg-[#2d245d] dark:text-[#ddd6ff]';
    case 'private_booked':
      return 'bg-[#fbefcd] text-[#6a4f00] dark:bg-[#4a3a16] dark:text-[#f9efc4]';
    case 'full':
      return 'bg-[#f8e3b1] text-[#6a4f00] dark:bg-[#56411c] dark:text-[#fff0c7]';
    case 'limited':
      return 'bg-[#e8f0ff] text-[#1645ac] dark:bg-[#1c3459] dark:text-[#dbe7ff]';
    default:
      return 'bg-white text-slate-700 dark:bg-[#0d1320] dark:text-slate-100';
  }
}

function stripeTone(available: boolean, key: 'AM' | 'PM' | 'EVE') {
  if (!available) {
    if (key === 'AM') return 'bg-[#d94d4d] dark:bg-[#ff8b8b]';
    if (key === 'PM') return 'bg-[#c59c27] dark:bg-[#ffd36f]';
    return 'bg-[#6b61f3] dark:bg-[#a79eff]';
  }

  return 'bg-[#d8dfeb] dark:bg-white/12';
}

export default function CalendarPage({
  venueOptions = [],
}: {
  venueOptions?: VenueOption[];
}) {
  const today = new Date();
  const todayKey = dateKey(today);

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedVenue, setSelectedVenue] = useState<string>(venueOptions[0]?.value || '');
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [selectedBlockKey, setSelectedBlockKey] = useState<'AM' | 'PM' | 'EVE'>('AM');

  const [monthData, setMonthData] = useState<Record<string, PublicDayStatus>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDayStatus, setLoadingDayStatus] = useState(false);

  const [dayStatus, setDayStatus] = useState<PublicDayStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const monthKey = useMemo(() => monthKeyFromDate(currentMonth), [currentMonth]);
  const weeks = useMemo(() => buildMonthWeeks(monthKey), [monthKey]);

  useEffect(() => {
    if (!selectedVenue) return;

    let mounted = true;

    const loadMonth = async () => {
      setLoadingMonth(true);
      setErrorMessage('');

      try {
        const response = await fetch(
          `/public/calendar-month?month=${encodeURIComponent(monthKey)}&venue=${encodeURIComponent(selectedVenue)}`,
          {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRF-TOKEN': getCsrfToken(),
            },
          },
        );

        const payload = (await parseResponse(response)) as MonthPayload;

        if (!response.ok) {
          throw new Error((payload as any)?.message ?? 'Unable to load calendar month.');
        }

        if (!mounted) return;

        const nextMap: Record<string, PublicDayStatus> = {};
        for (const item of payload.days ?? []) {
          if (item?.date) {
            nextMap[item.date] = item;
          }
        }

        setMonthData(nextMap);
      } catch (error) {
        if (!mounted) return;
        setMonthData({});
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load calendar month.');
      } finally {
        if (mounted) setLoadingMonth(false);
      }
    };

    loadMonth();

    return () => {
      mounted = false;
    };
  }, [monthKey, selectedVenue]);

  useEffect(() => {
    const prefix = `${monthKey}-`;
    if (selectedDateKey.startsWith(prefix)) return;

    if (todayKey.startsWith(prefix)) {
      setSelectedDateKey(todayKey);
      return;
    }

    setSelectedDateKey(`${monthKey}-01`);
  }, [monthKey, selectedDateKey, todayKey]);

  useEffect(() => {
    if (!selectedVenue || !selectedDateKey) return;

    let mounted = true;

    const loadDay = async () => {
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
          body: JSON.stringify({
            date: selectedDateKey,
            venue: selectedVenue,
          }),
        });

        const payload = (await parseResponse(response)) as PublicDayStatus;

        if (!response.ok) {
          throw new Error((payload as any)?.message ?? 'Unable to load day status.');
        }

        if (!mounted) return;
        setDayStatus(payload);
      } catch (error) {
        if (!mounted) return;
        setDayStatus(null);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load day status.');
      } finally {
        if (mounted) setLoadingDayStatus(false);
      }
    };

    loadDay();

    return () => {
      mounted = false;
    };
  }, [selectedDateKey, selectedVenue]);

  useEffect(() => {
    const next = BLOCK_KEYS.find((block) => resolveBlockAvailable(dayStatus?.blocks, block)) ?? 'AM';
    setSelectedBlockKey(next);
  }, [dayStatus]);

  const selectedMonthEntry = monthData[selectedDateKey] ?? null;
  const visibleStatus = deriveMonthCellStatus(dayStatus ?? selectedMonthEntry);
  const selectedLabel = longDate(selectedDateKey);

  const blockEntries = useMemo(
    () =>
      BLOCK_KEYS.map((key) => ({
        key,
        meta: BLOCK_META[key],
        available: resolveBlockAvailable(dayStatus?.blocks, key),
      })),
    [dayStatus],
  );

  const bookingHref = useMemo(() => {
    const { start, end } = startEndForBlock(selectedDateKey, selectedBlockKey);

    const params = new URLSearchParams({
      date: selectedDateKey,
      start,
      end,
      venue: selectedVenue,
    });

    return `/bookings/create?${params.toString()}`;
  }, [selectedDateKey, selectedBlockKey, selectedVenue]);

  return (
    <PublicLayout>
      <Head title="Calendar" />

      <div className="space-y-10 pb-14">
        <PageHero
          eyebrow="Public Calendar"
          title="A cleaner month view styled closer to a Google Calendar grid."
          description="Each date is now a tight color-coded cell with no floating gaps, while the selected day details stay on the right for clearer booking decisions."
          imageLight="/marketing/images/events/lightmain.JPG"
          imageDark="/marketing/images/events/darkmain.JPG"
        />

        <section className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
              <div className="border-b border-black/5 p-5 dark:border-white/10 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#174f40] dark:text-[#b6c6ff]">
                      Google-style availability grid
                    </div>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{monthLabel(currentMonth)}</h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedVenue}
                      onChange={(e) => setSelectedVenue(e.target.value)}
                      className="min-w-[220px] rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      {venueOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                      className="inline-flex rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-300/20 dark:bg-rose-500/10 dark:text-rose-100">
                    {errorMessage}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-7 border-t border-black/5 dark:border-white/10">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                  <div
                    key={label}
                    className="border-b border-r border-black/5 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 last:border-r-0 dark:border-white/10 dark:text-slate-300"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="relative">
                {loadingMonth ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-[#07101c]/70">
                    <LoaderCircle className="h-6 w-6 animate-spin text-[#174f40] dark:text-[#b6c6ff]" />
                  </div>
                ) : null}

                {weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="grid grid-cols-7">
                    {week.map((day, dayIndex) => {
                      const dayKey = day ? dateKey(day) : `blank-${weekIndex}-${dayIndex}`;
                      const entry = day ? monthData[dayKey] ?? null : null;
                      const status = deriveMonthCellStatus(entry);
                      const isSelected = day && dayKey === selectedDateKey;
                      const isToday = day && dayKey === todayKey;

                      return (
                        <button
                          key={dayKey}
                          type="button"
                          disabled={!day}
                          onClick={() => day && setSelectedDateKey(dayKey)}
                          className={cn(
                            'group relative h-24 border-b border-r border-black/5 text-left transition sm:h-28 lg:h-32 last:border-r-0',
                            day ? cellTone(status) : 'bg-[#f5f5f2] dark:bg-[#0b1018]',
                            isSelected && 'ring-2 ring-inset ring-[#174f40] dark:ring-[#8ea3ff]',
                          )}
                        >
                          {day ? (
                            <>
                              <div className="flex h-full flex-col justify-between p-2.5 sm:p-3">
                                <div className="flex items-start justify-between">
                                  <span
                                    className={cn(
                                      'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                                      isToday && 'bg-white/90 text-slate-900 shadow-sm dark:bg-[#e8eeff] dark:text-slate-900',
                                    )}
                                  >
                                    {day.getDate()}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  {BLOCK_KEYS.map((blockKey) => {
                                    const blockAvailable = resolveBlockAvailable(entry?.blocks, blockKey);
                                    return (
                                      <div
                                        key={`${dayKey}-${blockKey}`}
                                        className={cn('h-1.5 w-full rounded-full', stripeTone(blockAvailable, blockKey))}
                                      />
                                    );
                                  })}
                                </div>
                              </div>

                              {isSelected ? (
                                <div className="pointer-events-none absolute inset-0 border-2 border-[#174f40] dark:border-[#8ea3ff]" />
                              ) : null}
                            </>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#174f40] dark:text-[#b6c6ff]">
                  Selected Date
                </div>
                <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{selectedLabel}</h3>
                <div className="mt-4 inline-flex rounded-full border border-black/10 bg-[#f8f4ea] px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900/70 dark:text-white">
                  {selectedVenue || 'Venue'}
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-black/5 p-4 dark:border-white/10">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                    Day status
                  </div>
                  <div className={cn('mt-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold', cellTone(visibleStatus))}>
                    {visibleStatus.replace('_', ' ').toUpperCase()}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {dayStatus?.description || selectedMonthEntry?.description || 'Select a date to inspect availability in more detail.'}
                  </p>
                  {(dayStatus?.note || selectedMonthEntry?.note) ? (
                    <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                      {dayStatus?.note || selectedMonthEntry?.note}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-3">
                  {blockEntries.map(({ key, meta, available }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedBlockKey(key)}
                      className={cn(
                        'rounded-[1.35rem] border px-4 py-4 text-left transition',
                        selectedBlockKey === key
                          ? 'border-[#174f40] bg-[#eef7f4] shadow-sm dark:border-[#8ea3ff] dark:bg-[#112034]'
                          : 'border-black/5 bg-[#f8f4ea] hover:bg-[#f3eee1] dark:border-white/10 dark:bg-slate-900/70 dark:hover:bg-slate-900',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{meta.label}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{meta.time}</div>
                        </div>
                        <div className={cn('h-3.5 w-3.5 rounded-full', stripeTone(available, key))} />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={bookingHref}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition',
                      dayStatus?.can_proceed === false
                        ? 'pointer-events-none bg-slate-400 opacity-70'
                        : 'bg-[#174f40] hover:opacity-90 dark:bg-[#294CFF]',
                    )}
                  >
                    <Clock3 className="h-4 w-4" />
                    Continue to Booking
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                  >
                    <MapPin className="h-4 w-4" />
                    Contact Office
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#174f40] dark:text-[#b6c6ff]">
                  <CalendarDays className="h-4 w-4" />
                  Reading the colors
                </div>

                <div className="mt-5 grid gap-3">
                  {[
                    ['Available', cellTone('available')],
                    ['Limited', cellTone('limited')],
                    ['Public Event', cellTone('public_booked')],
                    ['Reserved', cellTone('private_booked')],
                    ['Blocked', cellTone('blocked')],
                  ].map(([label, tone]) => (
                    <div key={label} className="flex items-center justify-between rounded-[1.2rem] border border-black/5 p-3 dark:border-white/10">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                      <span className={cn('inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]', tone)}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-black/5 bg-[#f8f4ea] p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
                  The cell itself shows the overall day status, while the three short bars at the bottom represent the AM, PM, and EVE time blocks. Filled accent bars mean that block is no longer available.
                </div>

                {loadingDayStatus ? (
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading selected date details…
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
