import { Link } from '@inertiajs/react';
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Info,
  LoaderCircle,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';

type VenueOption = {
  label: string;
  value: string;
  category?: string | null;
  capacity?: string | null;
};

type AvailabilityStatus =
  | 'available'
  | 'limited'
  | 'public_booked'
  | 'private_booked'
  | 'blocked';

type AvailabilityBlock = {
  key: 'AM' | 'PM' | 'EVE' | string;
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

type AvailabilityResult = {
  date: string;
  venue: string;
  status: AvailabilityStatus;
  title: string;
  description: string;
  note: string;
  blocks?: AvailabilityBlock[] | Record<string, AvailabilityBlock>;
  event_titles?: string[];
  calendar_blocks?: CalendarBlock[];
  recommended_action?: string;
  can_proceed?: boolean;
  venue_capacity_ok?: boolean | null;
  venue_capacity_message?: string | null;
};

type AvailabilityRangeResponse = {
  mode?: 'range';
  from: string;
  to: string;
  date?: string;
  venue: string;
  event_type?: string | null;
  guests?: number | null;
  status: AvailabilityStatus;
  title: string;
  description: string;
  note: string;
  recommended_action?: string;
  can_proceed?: boolean;
  days_count?: number;
  available_days?: number;
  limited_days?: number;
  blocked_days?: number;
  results: AvailabilityResult[];
  event_titles?: string[];
  calendar_blocks?: CalendarBlock[];
};

const eventTypeOptions = [
  'Conference',
  'Convention',
  'Summit',
  'Seminar',
  'Workshop',
  'Training',
  'Meeting',
  'Board Meeting',
  'General Assembly',
  'Government Program',
  'Public Forum',
  'Press Conference',
  'Exhibit',
  'Expo',
  'Trade Fair',
  'Bazaar',
  'Product Launch',
  'Corporate Event',
  'Cultural Program',
  'Cultural Show',
  'Concert',
  'Awards Night',
  'Graduation',
  'Recognition Program',
  'Wedding Reception',
  'Debut',
  'Birthday Celebration',
  'Religious Gathering',
  'Community Event',
  'Festival Activity',
  'Sports Event',
  'Private Event',
];

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
  const today = new Date();

  return [
    today.getFullYear(),
    `${today.getMonth() + 1}`.padStart(2, '0'),
    `${today.getDate()}`.padStart(2, '0'),
  ].join('-');
}

function tone(status: AvailabilityStatus) {
  switch (status) {
    case 'available':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200';
    case 'limited':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200';
    case 'public_booked':
      return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200';
    case 'private_booked':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-400/20 dark:bg-yellow-500/10 dark:text-yellow-200';
    default:
      return 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200';
  }
}

function statusIcon(status: AvailabilityStatus) {
  if (status === 'available') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'limited' || status === 'public_booked') return <Info className="h-4 w-4" />;
  return <CircleX className="h-4 w-4" />;
}

function blockTone(block: AvailabilityBlock) {
  return block.is_available
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
    : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200';
}

function readableStatus(status: string) {
  return status
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeBlocks(blocks?: AvailabilityResult['blocks']): AvailabilityBlock[] {
  if (!blocks) return [];

  if (Array.isArray(blocks)) {
    return blocks;
  }

  return Object.entries(blocks).map(([key, value]) => ({
    key: value.key || key,
    label: value.label || key,
    from: value.from || '--:--',
    to: value.to || '--:--',
    is_available: Boolean(value.is_available),
  }));
}

function formatRangeLabel(from: string, to: string) {
  const first = new Date(`${from}T00:00:00`);
  const last = new Date(`${to}T00:00:00`);

  const formatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
    return `${from} to ${to}`;
  }

  if (from === to) {
    return formatter.format(first);
  }

  return `${formatter.format(first)} to ${formatter.format(last)}`;
}

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

function bookingHref(result: AvailabilityRangeResponse) {
  const query = new URLSearchParams();

  query.set('date_from', `${result.from}T06:00`);
  query.set('date_to', `${result.to}T23:59`);
  query.set('venue', result.venue);

  if (result.event_type) {
    query.set('event_type', result.event_type);
  }

  if (result.guests) {
    query.set('guests', String(result.guests));
  }

  return `/book?${query.toString()}`;
}

function HeroFieldShell({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="group block border border-white/20 bg-white/92 px-4 py-3 text-[#17352c] shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl transition duration-500 hover:-translate-y-0.5 hover:border-[#c6a35b]/70 dark:border-white/10 dark:bg-[#10130f]/88 dark:text-white">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#a1762d] dark:text-[#f2d697]">
        {icon}
        {label}
      </span>

      {children}
    </label>
  );
}

function DayResultCard({ day }: { day: AvailabilityResult }) {
  const blocks = normalizeBlocks(day.blocks);

  return (
    <article className="border border-[#eadfc9] bg-white/88 p-4 text-[#1d2018] dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#a1762d]">
            {day.date}
          </p>

          <h4 className="mt-2 text-lg font-semibold tracking-[-0.04em]">
            {day.title}
          </h4>

          <p className="mt-2 text-sm leading-7 text-[#69665d] dark:text-white/62">
            {day.description}
          </p>
        </div>

        <span className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${tone(day.status)}`}>
          {statusIcon(day.status)}
          {readableStatus(day.status)}
        </span>
      </div>

      {blocks.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {blocks.map((block) => (
            <div
              key={`${day.date}-${block.key}`}
              className={`border p-3 ${blockTone(block)}`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                {block.key} · {block.label}
              </p>
              <p className="mt-1 text-xs font-semibold">
                {block.from} - {block.to}
              </p>
              <p className="mt-1 text-xs">
                {block.is_available ? 'Available' : 'Unavailable'}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {day.event_titles && day.event_titles.length > 0 ? (
        <div className="mt-4 border-t border-[#eadfc9] pt-4 dark:border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1762d]">
            Visible Events
          </p>

          <ul className="mt-2 space-y-1 text-sm leading-6 text-[#69665d] dark:text-white/62">
            {day.event_titles.map((title) => (
              <li key={title}>• {title}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {day.calendar_blocks && day.calendar_blocks.length > 0 ? (
        <div className="mt-4 border-t border-[#eadfc9] pt-4 dark:border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1762d]">
            Calendar Blocks
          </p>

          <ul className="mt-2 space-y-1 text-sm leading-6 text-[#69665d] dark:text-white/62">
            {day.calendar_blocks.map((block, index) => (
              <li key={`${block.title}-${index}`}>
                • {block.title || 'Calendar block'}
                {block.area ? ` — ${block.area}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {day.venue_capacity_message ? (
        <p className="mt-4 border border-[#d9c79d] bg-[#fff8e7] p-3 text-sm leading-6 text-[#6b5221] dark:border-[#80682a] dark:bg-[#201a10] dark:text-[#f2d697]">
          {day.venue_capacity_message}
        </p>
      ) : null}
    </article>
  );
}

export default function HeroAvailabilityBar({ venueOptions }: { venueOptions: VenueOption[] }) {
  const [dateFrom, setDateFrom] = useState(todayKey);
  const [dateTo, setDateTo] = useState(todayKey);
  const [eventType, setEventType] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [result, setResult] = useState<AvailabilityRangeResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedVenue = useMemo(
    () => venueOptions.find((item) => item.value === venue) ?? null,
    [venue, venueOptions],
  );

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!dateFrom || !dateTo || !eventType || !venue || !guests) {
      setValidationMessage('Please complete the date range, event type, area, and guest count.');
      return;
    }

    if (dateFrom > dateTo) {
      setValidationMessage('The end date must be the same as or later than the start date.');
      return;
    }

    const days = daysBetween(dateFrom, dateTo);

    if (days < 1) {
      setValidationMessage('Please select a valid date range.');
      return;
    }

    if (days > 14) {
      setValidationMessage('Please keep the quick-check range to 14 days or fewer.');
      return;
    }

    setLoading(true);
    setModalOpen(true);
    setResult(null);
    setValidationMessage('');
    setModalMessage('Checking selected date range and area...');

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
          start_date: dateFrom,
          end_date: dateTo,
          date_from: dateFrom,
          date_to: dateTo,
          venue,
          event_type: eventType,
          guests: Number(guests),
        }),
      });

      const payload = await parseResponse(response);

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Unable to check availability.');
      }

      if (Array.isArray(payload?.results)) {
        setResult(payload as AvailabilityRangeResponse);
      } else {
        const single = payload as AvailabilityResult;

        setResult({
          mode: 'range',
          from: single.date,
          to: single.date,
          date: single.date,
          venue: single.venue,
          event_type: eventType,
          guests: Number(guests),
          status: single.status,
          title: single.title,
          description: single.description,
          note: single.note,
          recommended_action: single.recommended_action,
          can_proceed: single.can_proceed,
          days_count: 1,
          available_days: single.status === 'available' ? 1 : 0,
          limited_days: single.status === 'limited' ? 1 : 0,
          blocked_days: ['blocked', 'private_booked'].includes(single.status) ? 1 : 0,
          results: [single],
          event_titles: single.event_titles,
          calendar_blocks: single.calendar_blocks,
        });
      }

      setModalMessage('');
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : 'Unable to check availability right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-7xl gap-3 border border-white/20 bg-[#f7efe0]/92 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080b08]/86 lg:grid-cols-[1fr_1fr_1.25fr_1.35fr_1fr_auto]"
      >
        <div className="lg:col-span-6">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#a1762d] dark:text-[#f2d697]">
            <Sparkles className="h-3.5 w-3.5" />
            Multi-date public schedule preview
          </p>

          <p className="mt-1 text-sm leading-6 text-[#4c4a43] dark:text-white/62">
            Select a single date or a multi-day range before starting the booking request.
          </p>
        </div>

        <HeroFieldShell label="Start Date" icon={<CalendarDays className="h-3.5 w-3.5" />}>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);

              if (!dateTo || event.target.value > dateTo) {
                setDateTo(event.target.value);
              }
            }}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </HeroFieldShell>

        <HeroFieldShell label="End Date" icon={<CalendarDays className="h-3.5 w-3.5" />}>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </HeroFieldShell>

        <HeroFieldShell label="Event Type" icon={<Info className="h-3.5 w-3.5" />}>
          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          >
            <option value="">Select type</option>
            {eventTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </HeroFieldShell>

        <HeroFieldShell label="Venue Area" icon={<Sparkles className="h-3.5 w-3.5" />}>
          <select
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          >
            <option value="">Select area</option>
            {venueOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </HeroFieldShell>

        <HeroFieldShell label="Guests" icon={<Users className="h-3.5 w-3.5" />}>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            placeholder="Estimated"
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </HeroFieldShell>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[4.25rem] items-center justify-center gap-2 bg-[#11392f] px-6 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-[0_16px_50px_rgba(17,57,47,0.25)] transition duration-500 hover:-translate-y-0.5 hover:bg-[#0d2c25] disabled:cursor-wait disabled:opacity-70 dark:bg-[#d7b46a] dark:text-[#10130f]"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Checking' : 'Check'}
        </button>

        {selectedVenue ? (
          <div className="lg:col-span-6 border border-[#d9c79d] bg-white/62 px-4 py-3 text-xs font-semibold text-[#5c574b] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62">
            {selectedVenue.label}
            {selectedVenue.category ? ` • ${selectedVenue.category}` : ''}
            {selectedVenue.capacity ? ` • Capacity: ${selectedVenue.capacity}` : ''}
          </div>
        ) : null}

        {validationMessage ? (
          <div className="lg:col-span-6 flex items-start gap-2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {validationMessage}
          </div>
        ) : null}
      </form>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section className="max-h-[90svh] w-full max-w-5xl overflow-y-auto border border-white/14 bg-[#f8f2e6] text-[#1d2018] shadow-[0_30px_120px_rgba(0,0,0,0.42)] dark:bg-[#090b08] dark:text-white">
            <header className="flex items-start justify-between gap-4 border-b border-[#e5d6bb] p-5 dark:border-white/10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#a1762d] dark:text-[#f2d697]">
                  Availability Status
                </p>

                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">
                  {loading ? 'Checking selected schedule' : result?.title || 'Availability result'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#e5d6bb] bg-white/60 transition hover:border-[#b98b35] dark:border-white/10 dark:bg-white/[0.04]"
                aria-label="Close availability result"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="p-5">
              {loading ? (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <LoaderCircle className="h-10 w-10 animate-spin text-[#a1762d]" />
                  <h4 className="mt-5 text-xl font-semibold tracking-[-0.04em]">
                    Checking availability
                  </h4>
                  <p className="mt-2 max-w-md text-sm leading-7 text-[#69665d] dark:text-white/62">
                    {modalMessage || 'Please wait while the system reviews the selected range, area, and visible schedule.'}
                  </p>
                </div>
              ) : modalMessage && !result ? (
                <div className="border border-rose-200 bg-rose-50 p-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  <p className="font-semibold">Unable to complete the check</p>
                  <p className="mt-2 text-sm leading-7">{modalMessage}</p>
                </div>
              ) : result ? (
                <div className="grid gap-5">
                  <div className={`border p-5 ${tone(result.status)}`}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em]">
                          {statusIcon(result.status)}
                          {readableStatus(result.status)}
                        </p>

                        <h4 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                          {result.title}
                        </h4>

                        <p className="mt-2 text-sm leading-7">
                          {formatRangeLabel(result.from, result.to)}
                        </p>

                        <p className="mt-3 max-w-3xl text-sm leading-7">
                          {result.description}
                        </p>

                        <p className="mt-2 max-w-3xl text-sm leading-7">
                          {result.note}
                        </p>
                      </div>

                      <div className="grid min-w-48 gap-2 text-sm">
                        <Metric label="Days" value={result.days_count ?? result.results.length} />
                        <Metric label="Open" value={result.available_days ?? 0} />
                        <Metric label="Limited" value={result.limited_days ?? 0} />
                        <Metric label="Blocked" value={result.blocked_days ?? 0} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {result.results.map((day) => (
                      <DayResultCard key={day.date} day={day} />
                    ))}
                  </div>

                  <div className="grid gap-4 border border-[#eadfc9] bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#a1762d]">
                        Booking Summary
                      </p>

                      <p className="mt-2 text-sm leading-7 text-[#69665d] dark:text-white/62">
                        Range: {formatRangeLabel(result.from, result.to)} · Area: {result.venue} · Event: {result.event_type || eventType} · Guests: {result.guests || guests}
                      </p>

                      <p className="mt-1 text-sm leading-7 text-[#69665d] dark:text-white/62">
                        {result.recommended_action || 'Review each date before continuing.'}
                      </p>
                    </div>

                    <Link
                      href={bookingHref(result)}
                      className={`inline-flex min-h-11 items-center justify-center px-5 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                        result.can_proceed === false
                          ? 'pointer-events-none bg-[#b7afa0] text-white opacity-60'
                          : 'bg-[#11392f] text-white hover:-translate-y-0.5 hover:bg-[#0d2c25] dark:bg-[#d7b46a] dark:text-[#10130f]'
                      }`}
                    >
                      Continue to Booking
                    </Link>

                    <Link
                      href="/calendar"
                      className="inline-flex min-h-11 items-center justify-center border border-[#d9c79d] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d2018] transition hover:-translate-y-0.5 dark:border-white/10 dark:text-white"
                    >
                      Open Full Calendar
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-current/20 px-3 py-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
