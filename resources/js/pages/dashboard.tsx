import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type Auth, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Clock3, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  kind?: 'booking' | 'block';
  block_id?: number;
  block?: string;
  area?: string | null;
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
    }
  >;
  events: DashboardEvent[];
};

type RoleLike = string | { name?: string | null } | null | undefined;
type AuthLike = { roles?: RoleLike[] | null; user?: { roles?: RoleLike[] | null } | null };

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

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function monthToDate(month: string) {
  const match = String(month).match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function shiftMonth(month: string, delta: number) {
  const current = monthToDate(month);
  const next = new Date(current.getFullYear(), current.getMonth() + delta, 1);
  return `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`;
}

function buildMonthGrid(month: string) {
  const base = monthToDate(month);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const mondayOffset = (first.getDay() + 6) % 7;

  const cells: Array<Date | null> = [];

  for (let i = 0; i < mondayOffset; i += 1) cells.push(null);
  for (let d = 1; d <= last.getDate(); d += 1) cells.push(new Date(base.getFullYear(), base.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function prettyDate(dateKeyValue: string) {
  const date = new Date(`${dateKeyValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKeyValue;

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function eventDateKey(event: DashboardEvent) {
  return String(event.start).slice(0, 10);
}

function statusForDate(
  date: string,
  availability: DashboardProps['monthAvailability'],
  events: DashboardEvent[],
  isClient: boolean,
) {
  const day = availability[date];
  const dayEvents = events.filter((event) => eventDateKey(event) === date);

  const hasOwnBooking = dayEvents.some((event) => event.kind !== 'block');
  const hasBlock = dayEvents.some((event) => event.kind === 'block' || typeof event.block_id === 'number');

  if (isClient && hasOwnBooking) return 'my-booking';
  if (hasBlock) return 'blocked';
  if (day?.is_fully_booked) return 'full';

  const unavailableCount = [day?.AM, day?.PM, day?.EVE].filter((value) => value === false).length;
  if (unavailableCount > 0) return 'partial';

  return 'available';
}

function dayStyle(status: string, selected: boolean) {
  const selectedRing = selected ? 'ring-2 ring-offset-2 ring-[#174f40] dark:ring-[#8ea3ff]' : '';

  switch (status) {
    case 'my-booking':
      return `border-[#174f40] bg-[#174f40] text-white ${selectedRing}`;
    case 'blocked':
      return `border-[#d7b14b] bg-[#f4e2ac] text-[#6a4f00] ${selectedRing}`;
    case 'full':
      return `border-[#f1aaaa] bg-[#ffe5e5] text-[#a52a2a] ${selectedRing}`;
    case 'partial':
      return `border-[#8eb2ff] bg-[#e4eeff] text-[#1645ac] ${selectedRing}`;
    default:
      return `border-black/10 bg-white text-[#22221f] dark:border-white/10 dark:bg-[#17181c] dark:text-white ${selectedRing}`;
  }
}

const weekdayLabels = ['Mon', 'Tue', 'Fri', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard({ counts, events, month, monthAvailability }: DashboardProps) {
  const { props } = usePage<{ auth: Auth }>();
  const roleNames = useMemo(() => getRoleNames(props.auth), [props.auth]);
  const isClient = roleNames.includes('user');

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = dateKey(new Date());
    return monthAvailability[today] || events.some((event) => eventDateKey(event) === today)
      ? today
      : month && `${month}-01`;
  });

  const selectedEvents = useMemo(
    () => (events || []).filter((event) => eventDateKey(event) === selectedDate),
    [events, selectedDate],
  );

  const selectedAvailability = monthAvailability[selectedDate];
  const selectedStatus = statusForDate(selectedDate, monthAvailability, events, isClient);

  const summaryCards = [
    {
      label: isClient ? 'My Bookings' : 'Pending',
      value: isClient ? events.filter((event) => event.kind !== 'block').length : Number(counts?.pending ?? 0),
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
      label: isClient ? 'Available Days' : 'Completed',
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
                  {isClient ? 'Simple booking calendar' : 'Booking monitoring calendar'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {isClient
                    ? 'This calendar is simplified for clients. Click a date to view your booking details and the day’s availability.'
                    : 'This view keeps the booking month easier to read while still showing activity, bookings, and blocked schedules.'}
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
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  Legend
                </div>
                <div className="mt-3 grid gap-2">
                  {isClient ? (
                    <>
                      <div>White — Available</div>
                      <div>Blue — Partly booked</div>
                      <div>Red — Fully booked</div>
                      <div>Green — My booking</div>
                    </>
                  ) : (
                    <>
                      <div>White — Available</div>
                      <div>Blue — Partly booked</div>
                      <div>Red — Fully booked</div>
                      <div>Gold — Blocked</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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

            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                <div
                  key={label}
                  className="pb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300"
                >
                  {label}
                </div>
              ))}

              {grid.map((cell, index) => {
                if (!cell) return <div key={`blank-${index}`} className="aspect-square" />;

                const key = dateKey(cell);
                const status = statusForDate(key, monthAvailability, events, isClient);
                const selected = key === selectedDate;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    className={cn(
                      'aspect-square rounded-2xl border text-sm font-semibold transition',
                      dayStyle(status, selected),
                    )}
                  >
                    {cell.getDate()}
                  </button>
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
                  <div className="rounded-2xl border border-[#8eb2ff] bg-[#e4eeff] px-4 py-4 text-sm text-[#1645ac]">
                    This date still has available blocks, but some time blocks are already unavailable.
                  </div>
                )}

                {selectedStatus === 'full' && (
                  <div className="rounded-2xl border border-[#f1aaaa] bg-[#ffe5e5] px-4 py-4 text-sm text-[#a52a2a]">
                    This date is fully booked.
                  </div>
                )}

                {selectedStatus === 'blocked' && (
                  <div className="rounded-2xl border border-[#d7b14b] bg-[#f4e2ac] px-4 py-4 text-sm text-[#6a4f00]">
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

                  return (
                    <div
                      key={block}
                      className={cn(
                        'rounded-2xl border px-4 py-4 text-center text-sm font-semibold',
                        available
                          ? 'border-black/10 bg-white text-[#1f1f1c] dark:border-white/10 dark:bg-[#17181c] dark:text-white'
                          : 'border-[#8eb2ff] bg-[#e4eeff] text-[#1645ac]',
                      )}
                    >
                      <div>{block}</div>
                      <div className="mt-1 text-xs font-medium opacity-80">
                        {available ? 'Available' : 'Unavailable'}
                      </div>
                    </div>
                  );
                })}
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
                      <div className="text-lg font-semibold">{event.title}</div>

                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {String(event.start).slice(11, 16)} - {String(event.end).slice(11, 16)}
                      </div>

                      {event.area ? (
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Area: {event.area}
                        </div>
                      ) : null}

                      {event.block ? (
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          Block: {event.block}
                        </div>
                      ) : null}

                      {event.status ? (
                        <div className="mt-2 inline-flex rounded-full bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                          {event.status}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                    No booking or event is registered on this date.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
