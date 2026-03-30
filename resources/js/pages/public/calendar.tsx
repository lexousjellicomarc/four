import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Lock, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { PublicEventItem } from '@/types/public-content';

type CalendarBlockItem = {
  title: string;
  area: string;
  notes?: string | null;
  publicStatus: 'blue' | 'gold' | 'red' | string;
  dateFrom: string;
  dateTo: string;
};

type CalendarStatus = 'available' | 'public_booked' | 'private_booked' | 'blocked';

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function expandDateRange(start: string, end: string) {
  const list: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
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
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage({
  events = [],
  calendarBlocks = [],
}: {
  events?: Array<PublicEventItem & { dateKey?: string }>;
  calendarBlocks?: CalendarBlockItem[];
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(today));

  const eventMap = useMemo(() => {
    const map = new Map<string, PublicEventItem[]>();
    events.forEach((event) => {
      const key = event.dateKey || (() => {
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
    if (blocks.some((item) => item.publicStatus === 'red')) return 'blocked';
    if (blocks.some((item) => item.publicStatus === 'gold')) return 'private_booked';
    if (blocks.some((item) => item.publicStatus === 'blue')) return 'public_booked';
    if (eventMap.has(key)) return 'public_booked';
    return 'available';
  };

  const cells = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);
  const selectedDate = useMemo(() => new Date(`${selectedDateKey}T00:00:00`), [selectedDateKey]);
  const selectedStatus = getDateStatus(selectedDateKey);
  const selectedEvents = eventMap.get(selectedDateKey) ?? [];
  const selectedBlocks = blockMap.get(selectedDateKey) ?? [];

  const canOpenDate = (status: CalendarStatus) => status !== 'private_booked' && status !== 'blocked';

  const styleFor = (status: CalendarStatus, selected: boolean) => {
    if (status === 'private_booked') return selected ? 'bg-[#B88B14] text-white border-[#B88B14]' : 'bg-[#F4E3AF] text-[#7B5B00] border-[#D7B14B]';
    if (status === 'public_booked') return selected ? 'bg-[#174fda] text-white border-[#174fda]' : 'bg-[#E2EEFF] text-[#174fda] border-[#9BBEFF]';
    if (status === 'blocked') return selected ? 'bg-[#C73333] text-white border-[#C73333]' : 'bg-[#FFE4E4] text-[#A62323] border-[#F2B1B1]';
    return selected ? 'bg-[#0f8b6d] text-white border-[#0f8b6d] dark:bg-[#294CFF] dark:border-[#294CFF]' : 'bg-white/80 text-slate-800 border-black/10 dark:bg-white/5 dark:text-white dark:border-white/10';
  };

  return (
    <PublicLayout>
      <Head title="Calendar" />

      <PageHero
        eyebrow="Calendar"
        title="View public schedule colors, event dates, and visible venue activity."
        description="Blue dates show public events or visible public use, gold dates are privately booked and locked, and red dates are blocked."
        backgroundImages={['/marketing/images/events/lightmain.JPG', '/marketing/images/events/darkmain.JPG']}
        actions={[
          { label: 'View Events', href: '/events' },
          { label: 'Ask About Availability', href: '/contact', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-8 pb-12">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-xl font-semibold">{monthLabel(currentMonth)}</div>

              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
              {weekdayLabels.map((label) => (
                <div key={label} className="pb-1">{label}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {cells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square rounded-[1.2rem] bg-black/[0.03] dark:bg-white/[0.03]" />;
                }

                const key = formatDateKey(date);
                const status = getDateStatus(key);
                const selected = selectedDateKey === key;
                const disabled = !canOpenDate(status);

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedDateKey(key)}
                    className={`aspect-square rounded-[1.2rem] border text-sm font-semibold transition ${styleFor(status, selected)} ${disabled ? 'cursor-not-allowed opacity-90' : 'hover:-translate-y-0.5'}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="scrollbar-hide mt-5 flex gap-3 overflow-x-auto pb-1 text-xs font-semibold">
              <div className="shrink-0 rounded-full border border-[#9BBEFF] bg-[#E2EEFF] px-3 py-2 text-[#174fda]">Blue • Public</div>
              <div className="shrink-0 rounded-full border border-[#D7B14B] bg-[#F4E3AF] px-3 py-2 text-[#7B5B00]">Gold • Private</div>
              <div className="shrink-0 rounded-full border border-[#F2B1B1] bg-[#FFE4E4] px-3 py-2 text-[#A62323]">Red • Blocked</div>
              <div className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Neutral • Available</div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
              Selected Date
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{longDate(selectedDate)}</h2>

            <div className="mt-4">
              <span className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                selectedStatus === 'available'
                  ? 'bg-[#0f8b6d]/10 text-[#0f8b6d] dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]'
                  : selectedStatus === 'public_booked'
                  ? 'bg-[#174fda]/10 text-[#174fda]'
                  : selectedStatus === 'private_booked'
                  ? 'bg-[#B88B14]/10 text-[#7B5B00] dark:text-[#F1D580]'
                  : 'bg-[#C73333]/10 text-[#A62323] dark:text-[#FFB1B1]'
              }`}>
                {selectedStatus.replace('_', ' ')}
              </span>
            </div>

            {(selectedStatus === 'private_booked' || selectedStatus === 'blocked') ? (
              <div className="mt-5 rounded-[1.5rem] bg-[#f8f4ea] p-4 text-sm leading-7 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                <div className="inline-flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4" />
                  Details are not shown publicly for this date.
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {selectedEvents.map((event, index) => (
                  <div key={`${event.title}-${index}`} className="rounded-[1.4rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{event.title}</div>
                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <MapPin className="h-4 w-4" />
                      {event.venue}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{event.summary || event.description}</p>
                  </div>
                ))}

                {selectedBlocks
                  .filter((block) => block.publicStatus === 'blue')
                  .map((block, index) => (
                    <div key={`${block.title}-${index}`} className="rounded-[1.4rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">{block.title}</div>
                      <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CalendarDays className="h-4 w-4" />
                        {block.area}
                      </div>
                      {block.notes ? <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{block.notes}</p> : null}
                    </div>
                  ))}

                {selectedEvents.length === 0 && selectedBlocks.filter((block) => block.publicStatus === 'blue').length === 0 ? (
                  <div className="rounded-[1.4rem] bg-[#f8f4ea] p-4 text-sm leading-7 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                    No public details are posted for this date yet.
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/events" className="rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white dark:bg-[#294CFF]">
                View Events
              </Link>
              <Link href="/contact" className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/10">
                Ask About This Date
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
