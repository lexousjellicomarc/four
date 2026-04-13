import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type Auth, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Lock,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

type DashboardProps = {
  counts?: Partial<Record<string, number>>;
  month: string;
  monthAvailability: Record<
    string,
    {
      AM: boolean;
      PM: boolean;
      EVE: boolean;
      is_fully_booked?: boolean;
      day_status?: 'available' | 'limited' | 'public_booked' | 'private_booked' | 'blocked' | string;
    }
  >;
  events: DashboardEvent[];
};

type RoleLike = string | { name?: string | null } | null | undefined;
type AuthLike = { roles?: RoleLike[] | null; user?: { roles?: RoleLike[] | null } | null };
type BlockKey = 'AM' | 'PM' | 'EVE';
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
const blockLabels: Record<BlockKey, { title: string; time: string }> = {
  AM: { title: 'AM', time: '6:00 AM – 12:00 PM' },
  PM: { title: 'PM', time: '12:00 PM – 6:00 PM' },
  EVE: { title: 'EVE', time: '6:00 PM – 11:59 PM' },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getRoleNames(auth: unknown): string[] {
  if (!isRecord(auth)) return [];
  const raw = (auth as AuthLike).roles ?? (auth as AuthLike).user?.roles ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((r) => {
      if (typeof r === 'string') return r;
      if (isRecord(r) && typeof r.name === 'string') return r.name;
      return '';
    })
    .filter(Boolean)
    .map((name) => String(name).toLowerCase());
}


function longDate(dateKeyValue: string) {
  const date = new Date(`${dateKeyValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKeyValue;

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function pickInitialSelectedDate(
  month: string,
  availability: DashboardProps['monthAvailability'],
  events: DashboardEvent[],
) {
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

function deriveDayStatus(
  date: string,
  availability: DashboardProps['monthAvailability'],
  events: DashboardEvent[],
  isClient: boolean,
): CalendarStatus {
  const day = availability[date];
  const dayEvents = events.filter((event) => eventSpansDate(event, date));
  const hasOwnBooking = dayEvents.some((event) => event.kind === 'booking');

  if (isClient && hasOwnBooking) return 'my-booking';

  const dayStatus = String(day?.day_status || '').toLowerCase();

  if (dayStatus === 'blocked') return 'blocked';
  if (dayStatus === 'public_booked') return 'public';
  if (dayStatus === 'private_booked') return 'private';
  if (dayStatus === 'limited') return 'partial';
  if (day?.is_fully_booked) return 'full';

  const unavailableCount = [day?.AM, day?.PM, day?.EVE].filter((value) => value === false).length;
  if (unavailableCount > 0) return 'partial';

  return 'available';
}

function dayStyle(status: CalendarStatus, selected: boolean, today: boolean) {
  const selectedRing = selected
    ? 'ring-2 ring-[#111827] ring-offset-2 dark:ring-white dark:ring-offset-[#121318]'
    : '';
  const todayRing = today
    ? 'outline outline-2 outline-[#0f8b6d] outline-offset-[-2px] dark:outline-[#7fd9c0]'
    : '';

  switch (status) {
    case 'my-booking':
      return `border-[#174f40] bg-[#174f40] text-white ${selectedRing} ${todayRing}`;
    case 'public':
      return `border-[#b7a8ff] bg-[#f1ecff] text-[#5532c7] ${selectedRing} ${todayRing}`;
    case 'private':
      return `border-[#d7b14b] bg-[#f7ebc1] text-[#6a4f00] ${selectedRing} ${todayRing}`;
    case 'blocked':
      return `border-[#f1aaaa] bg-[#ffe5e5] text-[#a52a2a] ${selectedRing} ${todayRing}`;
    case 'full':
      return `border-[#c9b061] bg-[#f7ebc1] text-[#6a4f00] ${selectedRing} ${todayRing}`;
    case 'partial':
      return `border-[#bfd2ff] bg-[#eef4ff] text-[#1645ac] ${selectedRing} ${todayRing}`;
    default:
      return `border-black/10 bg-white text-[#22221f] dark:border-white/10 dark:bg-[#17181c] dark:text-white ${selectedRing} ${todayRing}`;
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

  if (normalized === 'public_booked') {
    return 'border-[#c9bcff] bg-[#ede8ff] text-[#5532c7]';
  }

  if (['private_booked', 'confirmed', 'active'].includes(normalized)) {
    return 'border-[#dec57a] bg-[#f7ebc1] text-[#6a4f00]';
  }

  if (normalized === 'blocked') {
    return 'border-[#f0b1b1] bg-[#ffe3e3] text-[#a52a2a]';
  }

  if (normalized === 'completed') {
    return 'border-[#b8ddd1] bg-[#eef7f4] text-[#174f40]';
  }

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


export default function Dashboard({ counts, events, month, monthAvailability }: DashboardProps) {
  const { props } = usePage<{ auth: Auth }>();
  const roleNames = useMemo(() => getRoleNames(props.auth), [props.auth]);
  const isClient = roleNames.includes('user');
  const todayKey = dateKey(new Date());

  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  const [selectedDate, setSelectedDate] = useState(() => pickInitialSelectedDate(month, monthAvailability, events));
  const [activeBlock, setActiveBlock] = useState<BlockKey>('AM');

  useEffect(() => {
    setSelectedDate(pickInitialSelectedDate(month, monthAvailability, events));
  }, [month, monthAvailability, events]);

  useEffect(() => {
    const selectedAvailability = monthAvailability[selectedDate];
    const nextBlock = (['AM', 'PM', 'EVE'] as BlockKey[]).find((block) => selectedAvailability?.[block] !== false) ?? 'AM';
    setActiveBlock(nextBlock);
  }, [selectedDate, monthAvailability]);

  const selectedEvents = useMemo(
    () => (events || []).filter((event) => eventSpansDate(event, selectedDate)),
    [events, selectedDate],
  );

  const selectedAvailability = monthAvailability[selectedDate];
  const selectedStatus = statusForDate(selectedDate, monthAvailability, events, isClient);
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
        ? Object.keys(monthAvailability).filter((day) => statusForDate(day, monthAvailability, events, true) === 'available').length
        : Number(counts?.completed ?? 0),
      icon: Users,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

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
                    : 'This calendar now shows connected multi-day bars so blocks, bookings, and public events read more like Google Calendar while keeping your current booking logic.'}
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
                
                {!isClient ? (
                  <Link
                    href="/calendar/analytics"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    View Calendar Analytics
                  </Link>
                ) : null}

                {isClient ? (
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    View Public Calendar
                  </Link>
                ) : null}
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
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                            {card.label}
                          </div>
                          <div className="mt-1 text-2xl font-semibold">{card.value}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-black/5 bg-white px-4 py-4 text-sm dark:border-white/10 dark:bg-[#17181c]">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Legend</div>
                <div className="mt-3 grid gap-2">
                  <div>White — Available</div>
                  <div>Purple — Public event / public calendar activity</div>
                  <div>Gold — Private booking / reserved date</div>
                  <div>Red — Blocked / unavailable</div>
                  <div>Green outline — Today</div>
                  <div>Dark outline — Selected date</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                  Month
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
                  {monthLabel(monthToDate(month))}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    router.get('/dashboard', { month: shiftMonth(month, -1) }, { preserveState: true, preserveScroll: true })
                  }
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    router.get('/dashboard', { month: shiftMonth(month, 1) }, { preserveState: true, preserveScroll: true })
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 pb-3">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {weeks.map((week, weekIndex) => {
                const lanes = buildWeekLanes(week, events);
                const visibleLanes = lanes.slice(0, 3);
                const hiddenCount = Math.max(lanes.length - visibleLanes.length, 0);

                return (
                  <div key={`week-${weekIndex}`} className="rounded-3xl border border-black/5 p-3 dark:border-white/10">
                    <div className="grid grid-cols-7 gap-2">
                      {week.map((cell, index) => {
                        if (!cell) {
                          return <div key={`blank-${weekIndex}-${index}`} className="min-h-[82px] rounded-2xl bg-transparent" />;
                        }

                        const key = dateKey(cell);
                        const status = statusForDate(key, monthAvailability, events, isClient);
                        const selected = key === selectedDate;
                        const today = key === todayKey;
                        const availableBlocks = ['AM', 'PM', 'EVE'].filter(
                          (block) => monthAvailability[key]?.[block as BlockKey] !== false,
                        ).length;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedDate(key)}
                            className={cn(
                              'min-h-[82px] rounded-2xl border px-3 py-2 text-left transition hover:-translate-y-0.5',
                              dayStyle(status, selected, today),
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-base font-semibold">{cell.getDate()}</span>
                              {today ? (
                                <span className="rounded-full bg-[#0f8b6d] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white dark:bg-[#5ccfb0] dark:text-[#0d1c18]">
                                  Today
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-3 text-[11px] font-medium opacity-80">
                              {availableBlocks}/3 blocks open
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {visibleLanes.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {visibleLanes.map((lane, laneIndex) => (
                          <div key={`lane-${weekIndex}-${laneIndex}`} className="grid grid-cols-7 gap-2">
                            {lane.map((segment) => (
                              <div
                                key={`${segment.event.id}-${laneIndex}-${segment.startCol}`}
                                style={{ gridColumn: `${segment.startCol + 1} / ${segment.endCol + 2}` }}
                                className={cn(
                                  'min-h-[30px] rounded-md border px-3 py-1 text-xs font-semibold shadow-sm',
                                  'flex items-center gap-2 overflow-hidden whitespace-nowrap',
                                  eventBarTone(segment.event),
                                  !segment.isStart && 'rounded-l-none',
                                  !segment.isEnd && 'rounded-r-none',
                                )}
                                title={`${segment.event.title} • ${formatEventRange(segment.event)}`}
                              >
                                {segment.isStart ? <span className="truncate">{segment.event.title}</span> : <span className="opacity-70">…</span>}
                              </div>
                            ))}
                          </div>
                        ))}

                        {hiddenCount > 0 ? (
                          <div className="pl-1 text-xs font-medium text-slate-500 dark:text-slate-300">
                            +{hiddenCount} more item{hiddenCount > 1 ? 's' : ''} this week
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                Selected Date
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
                {prettyDate(selectedDate)}
              </h2>

              <div className="mt-4 space-y-3">
                {selectedStatus === 'available' && (
                  <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    This date is currently available.
                  </div>
                )}

                {selectedStatus === 'partial' && (
                  <div className="rounded-2xl border border-[#bfd2ff] bg-[#eef4ff] px-4 py-4 text-sm text-[#1645ac]">
                    This date still has open time blocks, but some schedules are already occupied.
                  </div>
                )}

                {selectedStatus === 'public' && (
                  <div className="rounded-2xl border border-[#c9bcff] bg-[#f1ecff] px-4 py-4 text-sm text-[#5532c7]">
                    This date already has a public event or public calendar activity.
                  </div>
                )}

                {selectedStatus === 'private' && (
                  <div className="rounded-2xl border border-[#d7b14b] bg-[#f7ebc1] px-4 py-4 text-sm text-[#6a4f00]">
                    This date is already privately booked or reserved.
                  </div>
                )}

                {selectedStatus === 'full' && (
                  <div className="rounded-2xl border border-[#c9b061] bg-[#f7ebc1] px-4 py-4 text-sm text-[#6a4f00]">
                    This date is fully occupied for the current schedule logic.
                  </div>
                )}

                {selectedStatus === 'blocked' && (
                  <div className="rounded-2xl border border-[#f1aaaa] bg-[#ffe5e5] px-4 py-4 text-sm text-[#a52a2a]">
                    This date is blocked for internal schedule control.
                  </div>
                )}

                {selectedStatus === 'my-booking' && (
                  <div className="rounded-2xl border border-[#d9ece6] bg-[#eef7f4] px-4 py-4 text-sm text-[#174f40] dark:border-[#263541] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                    You already have a booking on this date.
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(['AM', 'PM', 'EVE'] as const).map((block) => {
                  const available = monthAvailability[selectedDate]?.[block] ?? true;
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
                        <span>{blockLabels[block].title}</span>
                        <ArrowRight className={cn('h-4 w-4 transition', active ? 'opacity-100' : 'opacity-40')} />
                      </div>
                      <div className="mt-1 text-xs font-medium opacity-80">{blockLabels[block].time}</div>
                      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em]">
                        {available ? 'Available' : 'Unavailable'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-black/5 bg-[#f8f8f8] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  {activeBlock} Time Block
                </div>
                <div className="mt-1 text-lg font-semibold text-[#1f1f1c] dark:text-white">{blockLabels[activeBlock].time}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {(monthAvailability[selectedDate]?.[activeBlock] ?? true)
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
                            {event.area ? (
                              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Area: {event.area}</div>
                            ) : null}
                            {event.block ? (
                              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Block: {event.block}</div>
                            ) : null}
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
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                Events / Bookings
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
                Items on this date
              </h2>

              <div className="mt-5 space-y-4">
                {selectedEvents.length > 0 ? (
                  selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-black/5 bg-[#f7f5ef] px-4 py-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold">{event.title}</div>
                          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{formatEventRange(event)}</div>

                          {event.area ? (
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Area: {event.area}</div>
                          ) : null}

                          {event.block ? (
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Block: {event.block}</div>
                          ) : null}

                          {event.status ? (
                            <div
                              className={cn(
                                'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
                                statusChipTone(event.status),
                              )}
                            >
                              {String(event.status).replaceAll('_', ' ')}
                            </div>
                          ) : null}
                        </div>

                        {event.kind === 'booking' ? (
                          <Link
                            href={`/bookings/${event.id}`}
                            className="inline-flex rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-white/5"
                          >
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                    No booking or event is registered on this date.
                  </div>
                )}
              </div>

              {isClient ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/bookings/create?date=${selectedDate}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Book this date
                  </Link>
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    Public calendar
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
