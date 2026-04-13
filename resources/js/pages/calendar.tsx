import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import { cn } from '@/lib/utils';
import type { PublicEventItem } from '@/types/public-content';

type BlockKey = 'AM' | 'PM' | 'EVE';
type CalendarStatus = 'available' | 'public_booked' | 'private_booked' | 'blocked' | 'limited';

type CalendarBlockItem = {
  title: string;
  area: string;
  notes?: string | null;
  block?: 'AM' | 'PM' | 'EVE' | 'DAY' | string;
  publicStatus: 'blue' | 'gold' | 'red' | string;
  dateFrom: string;
  dateTo: string;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const blockLabels: Record<BlockKey, { title: string; time: string }> = {
  AM: { title: 'AM', time: '6:00 AM – 12:00 PM' },
  PM: { title: 'PM', time: '12:00 PM – 6:00 PM' },
  EVE: { title: 'EVE', time: '6:00 PM – 11:59 PM' },
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function expandDateRange(start: string, end: string) {
  const list: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const rawLast = new Date(`${end}T00:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(rawLast.getTime())) {
    return list;
  }

  const last = new Date(rawLast);

  while (current.getTime() <= last.getTime()) {
    list.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return list;
}

function getMonthMatrix(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const sundayFirstIndex = firstDay.getDay();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < sundayFirstIndex; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

function longDate(date: Date | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function parseEventTimeRange(event: PublicEventItem) {
  const time = String(event.time ?? '').trim();

  if (/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/.test(time)) {
    const [, from, to] = time.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/) ?? [];
    return { from, to };
  }

  return null;
}

function eventTouchesBlock(event: PublicEventItem, block: BlockKey) {
  const parsed = parseEventTimeRange(event);
  if (!parsed) return true;

  if (block === 'AM') return parsed.from < '12:00';
  if (block === 'PM') return parsed.from < '18:00' && parsed.to > '12:00';
  return parsed.to > '18:00';
}

function blockTouchesSelectedPeriod(block: CalendarBlockItem, period: BlockKey) {
  const normalized = String(block.block ?? 'DAY').toUpperCase();
  if (normalized === 'DAY') return true;
  return normalized === period;
}

function blockIsUnavailable(blocks: CalendarBlockItem[], period: BlockKey) {
  return blocks.some((item) => blockTouchesSelectedPeriod(item, period));
}

export default function CalendarPage({
  events = [],
  calendarBlocks = [],
}: {
  events?: Array<PublicEventItem>;
  calendarBlocks?: CalendarBlockItem[];
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(today));
  const [activeBlock, setActiveBlock] = useState<BlockKey>('AM');

  const eventMap = useMemo(() => {
    const map = new Map<string, PublicEventItem[]>();

    events.forEach((event) => {
      const key =
        event.dateKey ||
        (() => {
          const parsed = new Date(event.date);
          return Number.isNaN(parsed.getTime()) ? '' : formatDateKey(parsed);
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

  const getDateStatus = (key: string): CalendarStatus => {
    const blocks = blockMap.get(key) ?? [];
    const selectedEventItems = eventMap.get(key) ?? [];

    if (blocks.some((item) => String(item.publicStatus).toLowerCase() === 'red')) return 'blocked';
    if (blocks.some((item) => String(item.publicStatus).toLowerCase() === 'gold')) return 'private_booked';
    if (blocks.some((item) => String(item.publicStatus).toLowerCase() === 'blue')) return 'public_booked';
    if (selectedEventItems.length > 0) return 'public_booked';

    const hasPartial = blocks.some((item) => String(item.block ?? 'DAY').toUpperCase() !== 'DAY');
    if (hasPartial) return 'limited';

    return 'available';
  };

  const cells = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);

  useEffect(() => {
    const monthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    if (!selectedDateKey.startsWith(`${monthPrefix}-`)) {
      setSelectedDateKey(`${monthPrefix}-01`);
    }
  }, [currentMonth, selectedDateKey]);

  const selectedDate = useMemo(() => new Date(`${selectedDateKey}T00:00:00`), [selectedDateKey]);
  const selectedStatus = getDateStatus(selectedDateKey);
  const selectedEvents = eventMap.get(selectedDateKey) ?? [];
  const selectedBlocks = blockMap.get(selectedDateKey) ?? [];
  const blockAvailability = {
    AM: !blockIsUnavailable(selectedBlocks, 'AM') && !selectedEvents.some((event) => eventTouchesBlock(event, 'AM')),
    PM: !blockIsUnavailable(selectedBlocks, 'PM') && !selectedEvents.some((event) => eventTouchesBlock(event, 'PM')),
    EVE: !blockIsUnavailable(selectedBlocks, 'EVE') && !selectedEvents.some((event) => eventTouchesBlock(event, 'EVE')),
  };

  const activeBlockEvents = selectedEvents.filter((event) => eventTouchesBlock(event, activeBlock));
  const activeBlockBlocks = selectedBlocks.filter((block) => blockTouchesSelectedPeriod(block, activeBlock));
  const todayKey = formatDateKey(today);

  const styleFor = (status: CalendarStatus, selected: boolean, isToday: boolean) => {
    const selectedRing = selected ? 'ring-2 ring-[#111827] ring-offset-2 dark:ring-white dark:ring-offset-[#0f1116]' : '';
    const todayRing = isToday ? 'outline outline-2 outline-[#0f8b6d] outline-offset-[-2px]' : '';

    if (status === 'private_booked') {
      return `${selected ? 'bg-[#B88B14] text-white border-[#B88B14]' : 'bg-[#F4E3AF] text-[#7B5B00] border-[#D7B14B]'} ${selectedRing} ${todayRing}`;
    }

    if (status === 'public_booked') {
      return `${selected ? 'bg-[#6c4eff] text-white border-[#6c4eff]' : 'bg-[#f1ecff] text-[#5532c7] border-[#c9bcff]'} ${selectedRing} ${todayRing}`;
    }

    if (status === 'blocked') {
      return `${selected ? 'bg-[#C73333] text-white border-[#C73333]' : 'bg-[#FFE4E4] text-[#A62323] border-[#F2B1B1]'} ${selectedRing} ${todayRing}`;
    }

    if (status === 'limited') {
      return `${selected ? 'bg-[#1d5bd8] text-white border-[#1d5bd8]' : 'bg-[#E6F0FF] text-[#1645ac] border-[#b7d0ff]'} ${selectedRing} ${todayRing}`;
    }

    return `${selected ? 'bg-[#0f8b6d] text-white border-[#0f8b6d]' : 'bg-white/80 text-slate-800 border-black/10 dark:bg-white/5 dark:text-white dark:border-white/10'} ${selectedRing} ${todayRing}`;
  };

  return (
    <PublicLayout>
      <Head title="Calendar" />

      <PageHero
        eyebrow="Availability Calendar"
        title="Check dates before booking"
        description="Browse public event dates, see simple time-block availability, and jump directly to booking from the selected date."
      />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0f1116]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Calendar</div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
                  {monthLabel(currentMonth)}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
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

            <div className="grid grid-cols-7 gap-2">
              {cells.map((date, index) => {
                if (!date) {
                  return <div key={`blank-${index}`} className="aspect-square rounded-[1.2rem]" />;
                }

                const key = formatDateKey(date);
                const status = getDateStatus(key);
                const selected = selectedDateKey === key;
                const isToday = todayKey === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    className={cn(
                      'aspect-square rounded-[1.2rem] border px-3 py-2 text-left text-sm font-semibold transition hover:-translate-y-0.5',
                      styleFor(status, selected, isToday),
                    )}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <span>{date.getDate()}</span>
                        {isToday ? (
                          <span className="rounded-full bg-[#0f8b6d] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            Today
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-80">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
              <span className="rounded-full bg-[#f1ecff] px-3 py-1 text-[#5532c7]">Purple • Public</span>
              <span className="rounded-full bg-[#F4E3AF] px-3 py-1 text-[#7B5B00]">Gold • Private</span>
              <span className="rounded-full bg-[#FFE4E4] px-3 py-1 text-[#A62323]">Red • Blocked</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-white/10 dark:text-white">Neutral • Available</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0f1116]">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Selected Date</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
              {longDate(selectedDate)}
            </h2>
            <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-white/10 dark:text-white">
              {selectedStatus.replace('_', ' ')}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {(['AM', 'PM', 'EVE'] as const).map((block) => {
                const available = blockAvailability[block];
                const active = activeBlock === block;

                return (
                  <button
                    key={block}
                    type="button"
                    onClick={() => setActiveBlock(block)}
                    className={cn(
                      'rounded-2xl border px-4 py-4 text-left transition',
                      active && 'ring-2 ring-[#111827] ring-offset-2 dark:ring-white dark:ring-offset-[#0f1116]',
                      available
                        ? 'border-black/10 bg-white text-[#1f1f1c] dark:border-white/10 dark:bg-[#17181c] dark:text-white'
                        : 'border-[#d7b14b] bg-[#f7ebc1] text-[#6a4f00]',
                    )}
                  >
                    <div className="text-sm font-semibold">{blockLabels[block].title}</div>
                    <div className="mt-1 text-xs opacity-80">{blockLabels[block].time}</div>
                    <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em]">
                      {available ? 'Available' : 'Unavailable'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-black/5 bg-[#f8f8f8] p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Clock3 className="h-4 w-4" />
                {activeBlock} Block Details
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {blockAvailability[activeBlock]
                  ? 'This time block is still open on the public calendar.'
                  : 'This time block is already occupied by a public event, private booking, or admin block.'}
              </p>

              <div className="mt-4 space-y-3">
                {activeBlockEvents.map((event, index) => (
                  <div key={`${event.title}-${index}`} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]">
                    <div className="text-base font-semibold text-[#1f1f1c] dark:text-white">{event.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <MapPin className="h-4 w-4" />
                      {event.venue || 'Baguio Convention and Cultural Center'}
                    </div>
                    {event.time ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{event.time}</div> : null}
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.summary || event.description}</p>
                  </div>
                ))}

                {activeBlockBlocks.map((block, index) => (
                  <div key={`${block.title}-${index}`} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]">
                    <div className="text-base font-semibold text-[#1f1f1c] dark:text-white">{block.title}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{block.area || 'Calendar activity'}</div>
                    {block.notes ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{block.notes}</p> : null}
                  </div>
                ))}

                {activeBlockEvents.length === 0 && activeBlockBlocks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                    No posted event or public note is attached to this time block.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/bookings/create?date=${selectedDateKey}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <CalendarDays className="h-4 w-4" />
                BOOK NOW
              </Link>

              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                View Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
