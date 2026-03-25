import { Head, Link } from '@inertiajs/react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Lock,
  MapPin,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { events as fallbackEvents, type EventItem } from '@/data/events';
import PublicLayout from '@/layouts/public-layout';
import PageHero from '@/components/public/page-hero';


type CalendarStatus = 'available' | 'public_booked' | 'private_booked' | 'blocked';

type CalendarBlockItem = {
  title: string;
  area: string;
  notes?: string | null;
  publicStatus: 'blue' | 'gold' | 'red' | string;
  dateFrom: string;
  dateTo: string;
};

type CalendarEvent = EventItem & {
  dateKey?: string;
};

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getMonthMatrix(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const mondayFirstIndex = (firstDay.getDay() + 6) % 7;
  const cells: Array<Date | null> = [];

  for (let i = 0; i < mondayFirstIndex; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function expandDateRange(start: string, end: string) {
  const output: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);

  while (current.getTime() <= last.getTime()) {
    output.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return output;
}

function statusStyles(status: CalendarStatus, selected: boolean) {
  if (status === 'private_booked') {
    return selected
      ? 'border-[#b58922] bg-[#b58922] text-white'
      : 'border-[#d7b14b] bg-[#f4e2ac] text-[#6a4f00]';
  }

  if (status === 'public_booked') {
    return selected
      ? 'border-[#1d5bd8] bg-[#1d5bd8] text-white'
      : 'border-[#8eb2ff] bg-[#e4eeff] text-[#1645ac]';
  }

  if (status === 'blocked') {
    return selected
      ? 'border-[#c53434] bg-[#c53434] text-white'
      : 'border-[#f1aaaa] bg-[#ffe5e5] text-[#a52a2a]';
  }

  return selected
    ? 'border-[#174f40] bg-[#174f40] text-white dark:border-[#2d47ff] dark:bg-[#2d47ff]'
    : 'border-black/10 bg-white text-[#22221f] dark:border-white/10 dark:bg-[#17181c] dark:text-white';
}

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage({
  events,
  calendarBlocks,
}: {
  events?: CalendarEvent[];
  calendarBlocks?: CalendarBlockItem[];
}) {
  const sourceEvents = events && events.length > 0 ? events : fallbackEvents;
  const sourceBlocks = calendarBlocks ?? [];

  const publicEventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    sourceEvents
      .filter((item) => item.isPublic)
      .forEach((item) => {
        const key =
          item.dateKey ??
          (() => {
            const parsed = new Date(item.date);
            return Number.isNaN(parsed.getTime()) ? null : formatDateKey(parsed);
          })();

        if (!key) return;

        const existing = map.get(key) ?? [];
        existing.push(item);
        map.set(key, existing);
      });

    return map;
  }, [sourceEvents]);

  const blockStatusByDate = useMemo(() => {
    const map = new Map<string, CalendarBlockItem[]>();

    sourceBlocks.forEach((block) => {
      expandDateRange(block.dateFrom, block.dateTo).forEach((dateKey) => {
        const existing = map.get(dateKey) ?? [];
        existing.push(block);
        map.set(dateKey, existing);
      });
    });

    return map;
  }, [sourceBlocks]);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(today));

  const monthCells = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);

  const getDateStatus = (dateKey: string): CalendarStatus => {
    const blocks = blockStatusByDate.get(dateKey) ?? [];

    if (blocks.some((item) => item.publicStatus === 'red')) return 'blocked';
    if (blocks.some((item) => item.publicStatus === 'gold')) return 'private_booked';
    if (blocks.some((item) => item.publicStatus === 'blue')) return 'public_booked';
    if (publicEventsByDate.has(dateKey)) return 'public_booked';

    return 'available';
  };

  const selectedDate = useMemo(() => {
    const parsed = new Date(`${selectedDateKey}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [selectedDateKey]);

  const selectedStatus = selectedDate ? getDateStatus(selectedDateKey) : 'available';
  const selectedEvents = publicEventsByDate.get(selectedDateKey) ?? [];
  const selectedBlocks = blockStatusByDate.get(selectedDateKey) ?? [];

  const monthlyHighlights = useMemo(() => {
    return sourceEvents.filter((item) => {
      const parsed = new Date(item.dateKey ?? item.date);
      if (Number.isNaN(parsed.getTime()) || !item.isPublic) return false;

      return (
        parsed.getFullYear() === currentMonth.getFullYear() &&
        parsed.getMonth() === currentMonth.getMonth()
      );
    });
  }, [currentMonth, sourceEvents]);

  const handleDateClick = (date: Date) => {
    setSelectedDateKey(formatDateKey(date));
  };

  return (
    <PublicLayout>
      <Head title="Calendar" />
<PageHero
  eyebrow="Calendar"
  title="Simple public schedule visibility"
  description="A clearer and easier public calendar for checking visible event dates, public bookings, and blocked days."
  backgroundImages={[
    '/marketing/images/events/lightmain.JPG',
    '/marketing/images/branding/noon.jpg',
    '/marketing/images/events/5.jpg',
  ]}
  actions={[
    { label: 'View Events', href: '/events' },
    { label: 'Send Inquiry', href: '/contact', variant: 'secondary' },
  ]}
/>

      <section className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-neutral-950 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-5 px-6 py-8 sm:px-8 sm:py-10">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Public Calendar
              </span>

              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                  Public venue status, monthly events, and schedule highlights
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  Gold means privately booked and locked to public users, blue
                  means a public or government event, red means admin-blocked and
                  unavailable, and neutral means open on the public layer.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
                >
                  <CalendarDays className="h-4 w-4" />
                  Ask About Availability
                </Link>

                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  View Public Events
                </Link>
              </div>
            </div>

            <div className="border-t border-black/5 bg-[#f7f5ef] px-6 py-8 dark:border-white/10 dark:bg-white/5 lg:border-l lg:border-t-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#8eb2ff] bg-[#e4eeff] px-4 py-4 text-sm text-[#1645ac]">
                  <div className="font-semibold">Blue</div>
                  <div className="mt-1">Public event</div>
                </div>
                <div className="rounded-2xl border border-[#d7b14b] bg-[#f4e2ac] px-4 py-4 text-sm text-[#6a4f00]">
                  <div className="font-semibold">Gold</div>
                  <div className="mt-1">Private booking</div>
                </div>
                <div className="rounded-2xl border border-[#f1aaaa] bg-[#ffe5e5] px-4 py-4 text-sm text-[#a52a2a]">
                  <div className="font-semibold">Red</div>
                  <div className="mt-1">Blocked / unavailable</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-neutral-950">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Monthly View
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {monthLabel(currentMonth)}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                    )
                  }
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                    )
                  }
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="pb-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300"
                >
                  {label}
                </div>
              ))}

              {monthCells.map((cell, index) => {
                if (!cell) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const key = formatDateKey(cell);
                const status = getDateStatus(key);
                const selected = key === selectedDateKey;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDateClick(cell)}
                    className={`aspect-square rounded-2xl border text-sm font-semibold transition ${statusStyles(
                      status,
                      selected,
                    )}`}
                  >
                    {cell.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-neutral-950">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Selected Date
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {selectedDate ? formatLongDate(selectedDate) : 'No date selected'}
                </h2>
              </div>

              <div className="mt-4">
                {selectedStatus === 'available' && (
                  <div className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    This date is currently available on the public calendar layer.
                  </div>
                )}

                {selectedStatus === 'private_booked' && (
                  <div className="rounded-2xl border border-[#d7b14b] bg-[#f4e2ac] px-4 py-4 text-sm text-[#6a4f00]">
                    This date is reserved for a private booking window, so public
                    details remain hidden.
                  </div>
                )}

                {selectedStatus === 'blocked' && (
                  <div className="rounded-2xl border border-[#f1aaaa] bg-[#ffe5e5] px-4 py-4 text-sm text-[#a52a2a]">
                    This date is blocked by the admin side for maintenance,
                    control, or other non-public restrictions.
                  </div>
                )}

                {selectedStatus === 'public_booked' && (
                  <div className="rounded-2xl border border-[#8eb2ff] bg-[#e4eeff] px-4 py-4 text-sm text-[#1645ac]">
                    This date already contains a public event or a blue public-status block.
                  </div>
                )}
              </div>

              {selectedEvents.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                    Public Events
                  </div>

                  {selectedEvents.map((event) => (
                    <div
                      key={`${event.scope}-${event.title}`}
                      className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
                          {event.category}
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {event.title}
                        </h3>
                        <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                          <MapPin className="h-4 w-4" />
                          {event.venue}
                        </div>
                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {event.summary}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedBlocks.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                    Calendar Blocks
                  </div>

                  {selectedBlocks.map((block, index) => (
                    <div
                      key={`${block.title}-${index}`}
                      className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {block.title}
                        </h3>
                        <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                          <MapPin className="h-4 w-4" />
                          {block.area}
                        </div>
                        {block.notes && (
                          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {block.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-neutral-950">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Monthly Highlights
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Events this month
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                {monthlyHighlights.length > 0 ? (
                  monthlyHighlights.map((event) => (
                    <div
                      key={`${event.scope}-${event.title}`}
                      className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-300">
                          <div className="inline-flex items-center gap-2">
                            <Clock3 className="h-4 w-4" />
                            {event.date}
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.venue}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                    No public event highlights are scheduled for this month yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-neutral-950">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Public Notes
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Private bookings stay hidden from public event details.</span>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Final availability remains subject to admin validation and the official booking workflow.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
