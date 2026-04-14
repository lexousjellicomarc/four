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
  scheduleStatusDescription,
  scheduleStatusLabel,
  scheduleStatusTone,
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
    const isVisible = selectedDateKey.startsWith(prefix);

    if (isVisible) return;

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
          title="Check availability clearly before you book."
          description="The month grid now follows the selected venue, so the visible status is based on the same backend availability logic used by the day details."
          imageLight="/marketing/images/events/lightmain.JPG"
          imageDark="/marketing/images/events/darkmain.JPG"
        />

        <section className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">Month</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {monthLabel(currentMonth)}
                  </h2>
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
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-slate-50 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-white/5 dark:text-slate-300"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="relative">
                {loadingMonth ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.6rem] bg-white/70 backdrop-blur-sm dark:bg-slate-950/55">
                    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading month status
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  {weeks.map((week, weekIndex) => (
                    <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-2">
                      {week.map((cell, cellIndex) => {
                        if (!cell) {
                          return <div key={`empty-${weekIndex}-${cellIndex}`} className="h-[110px] rounded-[1.4rem] bg-transparent" />;
                        }

                        const key = dateKey(cell);
                        const monthEntry = monthData[key] ?? null;
                        const cellStatus = deriveMonthCellStatus(monthEntry);
                        const isSelected = selectedDateKey === key;
                        const isToday = key === todayKey;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedDateKey(key)}
                            className={cn(
                              'relative flex h-[110px] flex-col rounded-[1.4rem] border p-3 text-left transition',
                              'hover:-translate-y-0.5',
                              scheduleStatusTone(cellStatus),
                              isSelected && 'ring-2 ring-slate-900/20 dark:ring-white/25',
                              !isSelected && 'border-black/5 dark:border-white/10',
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-base font-semibold">{cell.getDate()}</div>
                              {isToday ? (
                                <span className="rounded-full bg-black/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] dark:bg-white/10">
                                  Today
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                              {scheduleStatusLabel(cellStatus)}
                            </div>

                            <div className="mt-2 line-clamp-2 text-xs opacity-80">
                              {monthEntry?.title || scheduleStatusDescription(cellStatus)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                    Selected Date
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {longDate(selectedDateKey)}
                  </h2>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Venue
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{selectedVenue || '—'}</div>
                  </div>

                  <div
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]',
                      scheduleStatusTone(visibleStatus),
                    )}
                  >
                    {scheduleStatusLabel(visibleStatus)}
                  </div>
                </div>

                {loadingDayStatus ? (
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Checking selected day
                  </div>
                ) : errorMessage ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                    {errorMessage}
                  </div>
                ) : (
                  <>
                    <div className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                      {dayStatus?.title || selectedMonthEntry?.title || 'Availability status'}
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {dayStatus?.description || selectedMonthEntry?.description || scheduleStatusDescription(visibleStatus)}
                    </p>

                    {dayStatus?.note ? (
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{dayStatus.note}</p>
                    ) : null}

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {blockEntries.map(({ key, meta, available }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedBlockKey(key)}
                          disabled={!available}
                          className={cn(
                            'rounded-[1.25rem] border px-4 py-4 text-left transition',
                            available
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:-translate-y-0.5 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                              : 'border-rose-200 bg-rose-50 text-rose-700 opacity-80 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200',
                            selectedBlockKey === key && available && 'ring-2 ring-emerald-500/35',
                          )}
                        >
                          <div className="text-sm font-semibold uppercase tracking-[0.18em]">{meta.label}</div>
                          <div className="mt-2 text-sm">{meta.time}</div>
                          <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]">
                            {available ? 'Available' : 'Unavailable'}
                          </div>
                        </button>
                      ))}
                    </div>

                    {dayStatus?.event_titles && dayStatus.event_titles.length > 0 ? (
                      <div className="mt-5 rounded-[1.4rem] border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-950/50">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Visible Events on This Date
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                          {dayStatus.event_titles.map((title) => (
                            <li key={`${selectedDateKey}-${title}`}>• {title}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {dayStatus?.recommended_action ? (
                      <div className="mt-5 rounded-[1.4rem] border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-950/50">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Recommended Action
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {dayStatus.recommended_action}
                        </p>
                      </div>
                    ) : null}

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

                      <a
                        href="/contact"
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-white"
                      >
                        <MapPin className="h-4 w-4" />
                        Contact Office
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
