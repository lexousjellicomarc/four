import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  LoaderCircle,
  MapPin,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import type { VenueOption } from '@/types/public-content';

type BlockKey = 'AM' | 'PM' | 'EVE';

type AvailabilityStatus =
  | 'available'
  | 'limited'
  | 'public_booked'
  | 'private_booked'
  | 'blocked';

type AvailabilityBlock = {
  key: BlockKey | string;
  label: string;
  from: string;
  to: string;
  is_available: boolean;
};

type CalendarBlock = {
  title?: string;
  area?: string;
  notes?: string;
  block?: string;
  public_status?: string;
};

type PublicDayStatus = {
  date: string;
  venue?: string | null;
  event_type?: string | null;
  guests?: number | null;
  status: AvailabilityStatus;
  title: string;
  description: string;
  note: string;
  recommended_action?: string;
  can_proceed?: boolean;
  blocks?: AvailabilityBlock[] | Record<string, AvailabilityBlock>;
  busy?: Array<{ from: string; to: string }>;
  free?: Array<{ from: string; to: string }>;
  event_titles?: string[];
  calendar_blocks?: CalendarBlock[];
  is_fully_booked?: boolean;
  venue_capacity_ok?: boolean | null;
  venue_capacity_message?: string | null;
};

type MonthPayload = {
  month: string;
  venue?: string | null;
  days: PublicDayStatus[];
};

const fallbackVenues: VenueOption[] = [
  { label: 'Full Hall', value: 'FULL HALL', category: 'Convention Hall', capacity: 'Large-scale events' },
  { label: 'Main Hall', value: 'MAIN HALL', category: 'Primary Venue', capacity: 'Major events' },
  { label: 'Foyer & Lobby Area', value: 'FOYER & LOBBY AREA', category: 'Reception Area', capacity: 'Exhibits and pre-function' },
  { label: 'VIP Lounge', value: 'VIP LOUNGE', category: 'Private Area', capacity: 'Small formal groups' },
  { label: 'Board Room', value: 'BOARD ROOM', category: 'Meeting Room', capacity: 'Executive meetings' },
  { label: 'Basement', value: 'BASEMENT', category: 'Support Space', capacity: 'Auxiliary use' },
  { label: 'Gallery2600', value: 'GALLERY2600', category: 'Gallery Space', capacity: 'Cultural exhibits' },
];

const eventTypeOptions = [
  'Conference',
  'Convention',
  'Summit',
  'Seminar',
  'Workshop',
  'Training',
  'Meeting',
  'Government Program',
  'Public Forum',
  'Exhibit',
  'Expo',
  'Corporate Event',
  'Cultural Program',
  'Concert',
  'Awards Night',
  'Graduation',
  'Wedding Reception',
  'Private Event',
];

const blockOrder: BlockKey[] = ['AM', 'PM', 'EVE'];

const blockMeta: Record<BlockKey, { label: string; time: string; from: string; to: string }> = {
  AM: {
    label: 'Morning',
    time: '6:00 AM - 12:00 PM',
    from: '06:00',
    to: '12:00',
  },
  PM: {
    label: 'Afternoon',
    time: '12:00 PM - 6:00 PM',
    from: '12:00',
    to: '18:00',
  },
  EVE: {
    label: 'Evening',
    time: '6:00 PM - 11:59 PM',
    from: '18:00',
    to: '23:59',
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.trim() ?? '';
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Unexpected response.' };
  }
}

function todayKey() {
  return dateKey(new Date());
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, '0'),
    `${date.getDate()}`.padStart(2, '0'),
  ].join('-');
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(month: string) {
  if (/^\d{4}-\d{2}$/.test(month)) {
    const [year, monthValue] = month.split('-').map(Number);

    return new Date(year, monthValue - 1, 1);
  }

  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function addMonths(month: string, amount: number) {
  const date = parseMonth(month);

  return monthKeyFromDate(new Date(date.getFullYear(), date.getMonth() + amount, 1));
}

function monthLabel(month: string) {
  return parseMonth(month).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });
}

function longDate(value: string) {
  return parseDateKey(value).toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildMonthWeeks(month: string): Date[][] {
  const firstOfMonth = parseMonth(month);
  const cursor = new Date(firstOfMonth);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  const weeks: Date[][] = [];

  for (let week = 0; week < 6; week += 1) {
    const row: Date[] = [];

    for (let day = 0; day < 7; day += 1) {
      const next = new Date(cursor);
      next.setDate(cursor.getDate() + week * 7 + day);
      row.push(next);
    }

    weeks.push(row);
  }

  return weeks;
}

function normalizeStatus(status?: string | null): AvailabilityStatus {
  const value = String(status || '').toLowerCase();

  if (value === 'blocked') return 'blocked';
  if (value === 'public_booked') return 'public_booked';
  if (value === 'private_booked' || value === 'fully_booked' || value === 'full') return 'private_booked';
  if (value === 'limited' || value === 'partial' || value === 'partially_booked') return 'limited';

  return 'available';
}

function normalizeBlocks(blocks?: PublicDayStatus['blocks']): AvailabilityBlock[] {
  if (!blocks) {
    return blockOrder.map((key) => ({
      key,
      label: blockMeta[key].label,
      from: blockMeta[key].from,
      to: blockMeta[key].to,
      is_available: true,
    }));
  }

  const rows = Array.isArray(blocks)
    ? blocks
    : Object.entries(blocks).map(([key, value]) => ({
        ...value,
        key: value.key || key,
      }));

  const map = new Map<string, AvailabilityBlock>();

  rows.forEach((block) => {
    const key = String(block.key || '').toUpperCase();

    map.set(key, {
      key,
      label: block.label || blockMeta[key as BlockKey]?.label || key,
      from: block.from || blockMeta[key as BlockKey]?.from || '--:--',
      to: block.to || blockMeta[key as BlockKey]?.to || '--:--',
      is_available: Boolean(block.is_available),
    });
  });

  return blockOrder.map((key) => {
    return (
      map.get(key) || {
        key,
        label: blockMeta[key].label,
        from: blockMeta[key].from,
        to: blockMeta[key].to,
        is_available: true,
      }
    );
  });
}

function blockIsOpen(day: PublicDayStatus | null | undefined, key: BlockKey) {
  return normalizeBlocks(day?.blocks).find((block) => block.key === key)?.is_available !== false;
}

function deriveDayStatus(day: PublicDayStatus | null | undefined): AvailabilityStatus {
  if (!day) return 'available';

  const normalized = normalizeStatus(day.status);
  const closedBlocks = blockOrder.filter((key) => !blockIsOpen(day, key)).length;

  if (normalized === 'blocked') return 'blocked';
  if (normalized === 'public_booked') return 'public_booked';
  if (normalized === 'private_booked') return 'private_booked';
  if (normalized === 'limited') return 'limited';
  if (day.is_fully_booked || closedBlocks === 3) return 'private_booked';
  if (closedBlocks > 0) return 'limited';

  return 'available';
}

function statusLabel(status: AvailabilityStatus) {
  return {
    available: 'Available',
    limited: 'Limited',
    public_booked: 'Public Event',
    private_booked: 'Reserved',
    blocked: 'Blocked',
  }[status];
}

function statusDescription(status: AvailabilityStatus) {
  return {
    available: 'No conflict is currently shown for this date and selected area.',
    limited: 'Some blocks remain open, but at least one time block is occupied.',
    public_booked: 'A public-facing activity is already listed for this date.',
    private_booked: 'This date has private reserved time or is already fully occupied.',
    blocked: 'This date is unavailable for public booking requests.',
  }[status];
}

function statusTone(status: AvailabilityStatus) {
  if (status === 'blocked') {
    return 'border-rose-300/45 bg-rose-400/10 text-rose-800 dark:text-rose-100';
  }

  if (status === 'public_booked') {
    return 'border-sky-300/45 bg-sky-400/10 text-sky-800 dark:text-sky-100';
  }

  if (status === 'private_booked') {
    return 'border-amber-300/50 bg-amber-400/10 text-amber-800 dark:text-amber-100';
  }

  if (status === 'limited') {
    return 'border-blue-300/45 bg-blue-400/10 text-blue-800 dark:text-blue-100';
  }

  return 'border-emerald-300/45 bg-emerald-400/10 text-emerald-800 dark:text-emerald-100';
}

function statusDot(status: AvailabilityStatus) {
  if (status === 'blocked') return 'bg-rose-500';
  if (status === 'public_booked') return 'bg-sky-500';
  if (status === 'private_booked') return 'bg-amber-500';
  if (status === 'limited') return 'bg-blue-500';

  return 'bg-emerald-500';
}

function statusIcon(status: AvailabilityStatus) {
  if (status === 'available') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'limited' || status === 'public_booked') return <Info className="h-4 w-4" />;

  return <XCircle className="h-4 w-4" />;
}

function blockTone(open: boolean) {
  return open
    ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-800 dark:text-emerald-100'
    : 'border-rose-300/40 bg-rose-400/10 text-rose-800 dark:text-rose-100';
}

function bookHref(date: string, block: BlockKey, venue: string, eventType: string, guests: string) {
  const query = new URLSearchParams();

  query.set('date', date);
  query.set('start', blockMeta[block].from);
  query.set('end', blockMeta[block].to);
  query.set('date_from', `${date}T${blockMeta[block].from}`);
  query.set('date_to', `${date}T${blockMeta[block].to}`);
  query.set('venue', venue);

  if (eventType) {
    query.set('event_type', eventType);
  }

  if (guests) {
    query.set('guests', guests);
  }

  return `/book?${query.toString()}`;
}

function PanelField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block border border-[#dfd2ba] bg-white/82 px-4 py-3 text-[#1d211a] shadow-[0_18px_50px_rgba(20,23,17,0.08)] backdrop-blur-xl transition hover:border-[#b98b35]/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#a1762d] dark:text-[#f2d697]">
        {icon}
        {label}
      </span>

      {children}
    </label>
  );
}

function LegendItem({ status }: { status: AvailabilityStatus }) {
  return (
    <div className="border border-[#dfd2ba] bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-2">
        <span className={cx('h-2.5 w-2.5', statusDot(status))} />
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d211a] dark:text-white">
          {statusLabel(status)}
        </p>
      </div>

      <p className="mt-2 text-xs leading-6 text-[#6e695f] dark:text-white/62">
        {statusDescription(status)}
      </p>
    </div>
  );
}

function DayCell({
  day,
  month,
  selected,
  today,
  entry,
  onSelect,
}: {
  day: Date;
  month: string;
  selected: boolean;
  today: boolean;
  entry?: PublicDayStatus | null;
  onSelect: () => void;
}) {
  const key = dateKey(day);
  const inMonth = key.startsWith(month);
  const status = deriveDayStatus(entry);
  const blocks = normalizeBlocks(entry?.blocks);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        'group relative min-h-[8.6rem] border-b border-r border-[#e4d6bd] p-2 text-left transition duration-500 hover:z-10 hover:border-[#b98b35] hover:bg-[#fff8ed] dark:border-white/10 dark:hover:bg-white/[0.08]',
        inMonth ? 'opacity-100' : 'opacity-38',
        selected && 'z-20 ring-2 ring-inset ring-[#11392f] dark:ring-[#d7b46a]',
        status === 'blocked' && 'bg-rose-50/85 dark:bg-rose-500/10',
        status === 'public_booked' && 'bg-sky-50/85 dark:bg-sky-500/10',
        status === 'private_booked' && 'bg-amber-50/85 dark:bg-amber-500/10',
        status === 'limited' && 'bg-blue-50/85 dark:bg-blue-500/10',
        status === 'available' && 'bg-white/80 dark:bg-white/[0.03]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cx(
            'flex h-8 w-8 items-center justify-center text-sm font-black',
            today ? 'bg-[#11392f] text-white dark:bg-[#d7b46a] dark:text-[#10130f]' : 'bg-[#f8f2e6] text-[#1d211a] dark:bg-white/[0.06] dark:text-white',
          )}
        >
          {day.getDate()}
        </span>

        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-[#756f63] dark:text-white/50">
          <span className={cx('h-2 w-2', statusDot(status))} />
          {statusLabel(status)}
        </span>
      </div>

      <div className="mt-3 grid gap-1.5">
        {blocks.map((block) => (
          <div
            key={`${key}-${block.key}`}
            className={cx(
              'flex items-center justify-between gap-2 border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]',
              blockTone(block.is_available),
            )}
          >
            <span>{block.key}</span>
            <span>{block.is_available ? 'Open' : 'Closed'}</span>
          </div>
        ))}
      </div>

      {entry?.event_titles && entry.event_titles.length > 0 ? (
        <p className="mt-2 truncate text-[10px] font-semibold text-[#5f5a4f] dark:text-white/55">
          {entry.event_titles[0]}
        </p>
      ) : null}
    </button>
  );
}

function SelectedDayPanel({
  day,
  venue,
  eventType,
  guests,
  selectedBlock,
  setSelectedBlock,
  loading,
}: {
  day: PublicDayStatus | null;
  venue: string;
  eventType: string;
  guests: string;
  selectedBlock: BlockKey;
  setSelectedBlock: (block: BlockKey) => void;
  loading: boolean;
}) {
  const status = deriveDayStatus(day);
  const blocks = normalizeBlocks(day?.blocks);
  const selectedBlockOpen = blockIsOpen(day, selectedBlock);
  const canProceed = day?.can_proceed !== false && selectedBlockOpen && status !== 'blocked';

  return (
    <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
      <section className="border border-[#dfd2ba] bg-[#f8f2e6]/92 p-5 shadow-[0_24px_80px_rgba(20,23,17,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#a1762d] dark:text-[#f2d697]">
          Selected Date
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-[#1d211a] dark:text-white">
          {day?.date ? longDate(day.date) : 'Select a date'}
        </h2>

        <div className={cx('mt-5 border p-4', statusTone(status))}>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
            {statusIcon(status)}
            {statusLabel(status)}
          </p>

          <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em]">
            {day?.title || 'Checking availability'}
          </h3>

          <p className="mt-2 text-sm leading-7">
            {loading ? 'Loading selected date details...' : day?.description || statusDescription(status)}
          </p>

          {day?.note ? <p className="mt-2 text-sm leading-7">{day.note}</p> : null}
        </div>

        <div className="mt-5 grid gap-2">
          {blocks.map((block) => {
            const key = String(block.key).toUpperCase() as BlockKey;

            return (
              <button
                key={block.key}
                type="button"
                onClick={() => setSelectedBlock(key)}
                disabled={!block.is_available}
                className={cx(
                  'border p-4 text-left transition duration-500 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
                  selectedBlock === key
                    ? 'border-[#11392f] bg-white text-[#11392f] dark:border-[#d7b46a] dark:bg-[#d7b46a]/10 dark:text-[#f2d697]'
                    : 'border-[#dfd2ba] bg-white/62 text-[#6e695f] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {block.key} · {block.label}
                    </p>
                    <p className="mt-1 text-xs font-semibold">
                      {block.from} - {block.to}
                    </p>
                  </div>

                  <span className={cx('border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]', blockTone(block.is_available))}>
                    {block.is_available ? 'Open' : 'Closed'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {day?.venue_capacity_message ? (
          <div className="mt-5 border border-[#d9c79d] bg-[#fff8e7] p-4 text-sm leading-7 text-[#6b5221] dark:border-[#80682a] dark:bg-[#201a10] dark:text-[#f2d697]">
            {day.venue_capacity_message}
          </div>
        ) : null}

        <div className="mt-5 grid gap-2">
          <Link
            href={day?.date ? bookHref(day.date, selectedBlock, venue, eventType, guests) : '#'}
            className={cx(
              'inline-flex min-h-11 items-center justify-center gap-2 px-5 text-[11px] font-black uppercase tracking-[0.18em] transition',
              canProceed
                ? 'bg-[#11392f] text-white hover:-translate-y-0.5 hover:bg-[#0d2c25] dark:bg-[#d7b46a] dark:text-[#10130f]'
                : 'pointer-events-none bg-[#b7afa0] text-white opacity-60',
            )}
          >
            <Sparkles className="h-4 w-4" />
            Continue to Booking
          </Link>

          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center border border-[#dfd2ba] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d211a] transition hover:-translate-y-0.5 hover:border-[#b98b35] dark:border-white/10 dark:text-white"
          >
            Contact Office
          </Link>
        </div>
      </section>

      <section className="border border-[#dfd2ba] bg-white/72 p-5 shadow-[0_24px_80px_rgba(20,23,17,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#a1762d] dark:text-[#f2d697]">
          Public Calendar Notes
        </p>

        {day?.event_titles && day.event_titles.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d211a] dark:text-white">
              Visible Events
            </p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-[#6e695f] dark:text-white/62">
              {day.event_titles.map((title) => (
                <li key={title}>• {title}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {day?.calendar_blocks && day.calendar_blocks.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d211a] dark:text-white">
              Calendar Blocks
            </p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-[#6e695f] dark:text-white/62">
              {day.calendar_blocks.map((block, index) => (
                <li key={`${block.title}-${index}`}>
                  • {block.title || 'Calendar block'}
                  {block.area ? ` — ${block.area}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!day?.event_titles?.length && !day?.calendar_blocks?.length ? (
          <p className="mt-4 text-sm leading-7 text-[#6e695f] dark:text-white/62">
            No public event or public calendar note is attached to the selected date.
          </p>
        ) : null}
      </section>
    </aside>
  );
}

export default function CalendarPage({
  venueOptions = [],
}: {
  venueOptions?: VenueOption[];
}) {
  const today = todayKey();
  const options = venueOptions.length > 0 ? venueOptions : fallbackVenues;

  const [currentMonth, setCurrentMonth] = useState(() => monthKeyFromDate(new Date()));
  const [selectedVenue, setSelectedVenue] = useState(options[0]?.value || 'FULL HALL');
  const [eventType, setEventType] = useState('');
  const [guests, setGuests] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedBlock, setSelectedBlock] = useState<BlockKey>('AM');

  const [monthData, setMonthData] = useState<Record<string, PublicDayStatus>>({});
  const [dayStatus, setDayStatus] = useState<PublicDayStatus | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const weeks = useMemo(() => buildMonthWeeks(currentMonth), [currentMonth]);

  const selectedMonthEntry = monthData[selectedDate] ?? null;

  useEffect(() => {
    let mounted = true;

    async function loadMonth() {
      if (!selectedVenue) return;

      setLoadingMonth(true);
      setErrorMessage('');

      try {
        const query = new URLSearchParams({
          month: currentMonth,
          venue: selectedVenue,
        });

        const response = await fetch(`/public/calendar-month?${query.toString()}`, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
        });

        const payload = (await parseResponse(response)) as MonthPayload;

        if (!response.ok) {
          throw new Error((payload as { message?: string })?.message || 'Unable to load calendar month.');
        }

        if (!mounted) return;

        const map: Record<string, PublicDayStatus> = {};

        (payload.days || []).forEach((item) => {
          if (item?.date) {
            map[item.date] = {
              ...item,
              status: normalizeStatus(item.status),
            };
          }
        });

        setMonthData(map);
      } catch (error) {
        if (!mounted) return;

        setMonthData({});
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load calendar month.');
      } finally {
        if (mounted) {
          setLoadingMonth(false);
        }
      }
    }

    loadMonth();

    return () => {
      mounted = false;
    };
  }, [currentMonth, selectedVenue]);

  useEffect(() => {
    if (selectedDate.startsWith(`${currentMonth}-`)) return;

    if (today.startsWith(`${currentMonth}-`)) {
      setSelectedDate(today);
      return;
    }

    setSelectedDate(`${currentMonth}-01`);
  }, [currentMonth, selectedDate, today]);

  useEffect(() => {
    let mounted = true;

    async function loadDay() {
      if (!selectedVenue || !selectedDate) return;

      setLoadingDay(true);
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
            date: selectedDate,
            venue: selectedVenue,
            event_type: eventType || undefined,
            guests: guests ? Number(guests) : undefined,
          }),
        });

        const payload = (await parseResponse(response)) as PublicDayStatus | { results?: PublicDayStatus[]; message?: string };

        if (!response.ok) {
          throw new Error((payload as { message?: string }).message || 'Unable to load selected date.');
        }

        if (!mounted) return;

        const next = Array.isArray((payload as { results?: PublicDayStatus[] }).results)
          ? ((payload as { results: PublicDayStatus[] }).results[0] ?? null)
          : (payload as PublicDayStatus);

        setDayStatus(
          next
            ? {
                ...next,
                status: normalizeStatus(next.status),
              }
            : null,
        );
      } catch (error) {
        if (!mounted) return;

        setDayStatus(null);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load selected date.');
      } finally {
        if (mounted) {
          setLoadingDay(false);
        }
      }
    }

    loadDay();

    return () => {
      mounted = false;
    };
  }, [selectedDate, selectedVenue, eventType, guests]);

  useEffect(() => {
    const blocks = normalizeBlocks(dayStatus?.blocks || selectedMonthEntry?.blocks);
    const firstOpen = blocks.find((block) => block.is_available && blockOrder.includes(String(block.key).toUpperCase() as BlockKey));

    setSelectedBlock((firstOpen?.key as BlockKey) || 'AM');
  }, [dayStatus, selectedMonthEntry]);

  function handleInspectorSubmit(event: FormEvent) {
    event.preventDefault();

    const active = dayStatus || selectedMonthEntry;

    if (!active?.date) return;

    setSelectedDate(active.date);
  }

  const selectedVenueMeta = options.find((item) => item.value === selectedVenue);
  const selectedResolvedDay = dayStatus || selectedMonthEntry;

  return (
    <PublicLayout>
      <Head title="Calendar | Baguio Convention and Cultural Center" />

      <main className="bg-[#f8f2e6] text-[#1d211a] dark:bg-[#090b08] dark:text-white">
        <section className="relative overflow-hidden border-b border-[#dfd2ba] bg-[#10130f] text-white dark:border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(215,180,106,0.28),transparent_34%),linear-gradient(135deg,rgba(7,12,8,0.72),rgba(7,12,8,0.95))]" />

          <div className="relative mx-auto grid min-h-[54svh] max-w-7xl content-end gap-8 px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2 border border-[#d7b46a]/35 bg-[#d7b46a]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#f2d697]">
                <CalendarDays className="h-3.5 w-3.5" />
                Public Availability Calendar
              </p>

              <h1 className="mt-6 text-5xl font-semibold tracking-[-0.085em] text-white sm:text-6xl lg:text-7xl">
                Read the venue schedule before booking.
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-8 text-white/68 sm:text-base">
                Check AM, PM, and evening availability by venue area. Public events are shown, while private reservations remain protected.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#dfd2ba] bg-[#f8f2e6] px-4 py-6 dark:border-white/10 dark:bg-[#090b08] sm:px-6 lg:px-8">
          <form
            onSubmit={handleInspectorSubmit}
            className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-[1.2fr_1fr_0.8fr_auto]"
          >
            <PanelField label="Venue Area" icon={<MapPin className="h-3.5 w-3.5" />}>
              <select
                value={selectedVenue}
                onChange={(event) => setSelectedVenue(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </PanelField>

            <PanelField label="Event Type" icon={<Sparkles className="h-3.5 w-3.5" />}>
              <select
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
              >
                <option value="">Any event type</option>
                {eventTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </PanelField>

            <PanelField label="Guests" icon={<Users className="h-3.5 w-3.5" />}>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                placeholder="Estimated"
              />
            </PanelField>

            <button
              type="submit"
              className="inline-flex min-h-[4.45rem] items-center justify-center gap-2 bg-[#11392f] px-6 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:-translate-y-0.5 hover:bg-[#0d2c25] dark:bg-[#d7b46a] dark:text-[#10130f]"
            >
              <Sparkles className="h-4 w-4" />
              Refresh
            </button>

            {selectedVenueMeta ? (
              <div className="border border-[#dfd2ba] bg-white/62 px-4 py-3 text-xs font-semibold text-[#6e695f] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62 lg:col-span-4">
                {selectedVenueMeta.label}
                {selectedVenueMeta.category ? ` · ${selectedVenueMeta.category}` : ''}
                {selectedVenueMeta.capacity ? ` · Capacity: ${selectedVenueMeta.capacity}` : ''}
              </div>
            ) : null}
          </form>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8 xl:grid-cols-[1fr_24rem]">
          <main className="min-w-0">
            <section className="overflow-hidden border border-[#dfd2ba] bg-white/72 shadow-[0_24px_80px_rgba(20,23,17,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
              <header className="flex flex-col gap-4 border-b border-[#dfd2ba] p-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#a1762d] dark:text-[#f2d697]">
                    Monthly Availability
                  </p>

                  <h2 className="mt-2 text-4xl font-semibold tracking-[-0.075em] text-[#1d211a] dark:text-white">
                    {monthLabel(currentMonth)}
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-[#6e695f] dark:text-white/62">
                    Cells show overall day status. AM, PM, and EVE rows show specific block availability.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#dfd2ba] bg-white/62 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d211a] transition hover:-translate-y-0.5 hover:border-[#b98b35] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentMonth(monthKeyFromDate(new Date()))}
                    className="inline-flex min-h-11 items-center justify-center border border-[#b98b35] bg-[#fff8e7] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#a1762d] transition hover:-translate-y-0.5 dark:border-[#d7b46a]/45 dark:bg-[#d7b46a]/10 dark:text-[#f2d697]"
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#dfd2ba] bg-white/62 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d211a] transition hover:-translate-y-0.5 hover:border-[#b98b35] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </header>

              {errorMessage ? (
                <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {errorMessage}
                </div>
              ) : null}

              <div className="calendar-public-scroll">
                <div className="min-w-[64rem]">
                  <div className="grid grid-cols-7 border-b border-[#dfd2ba] bg-[#f8f2e6] dark:border-white/10 dark:bg-white/[0.03]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                      <div
                        key={label}
                        className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.24em] text-[#a1762d] dark:text-[#f2d697]"
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  {loadingMonth ? (
                    <div className="flex min-h-[32rem] items-center justify-center">
                      <div className="text-center">
                        <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-[#a1762d]" />
                        <p className="mt-4 text-sm font-semibold text-[#6e695f] dark:text-white/62">
                          Loading public calendar...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7">
                      {weeks.flat().map((day) => {
                        const key = dateKey(day);

                        return (
                          <DayCell
                            key={key}
                            day={day}
                            month={currentMonth}
                            today={key === today}
                            selected={key === selectedDate}
                            entry={monthData[key] ?? null}
                            onSelect={() => setSelectedDate(key)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-5">
              <LegendItem status="available" />
              <LegendItem status="limited" />
              <LegendItem status="public_booked" />
              <LegendItem status="private_booked" />
              <LegendItem status="blocked" />
            </section>
          </main>

          <SelectedDayPanel
            day={selectedResolvedDay}
            venue={selectedVenue}
            eventType={eventType}
            guests={guests}
            selectedBlock={selectedBlock}
            setSelectedBlock={setSelectedBlock}
            loading={loadingDay}
          />
        </section>
      </main>
    </PublicLayout>
  );
}
