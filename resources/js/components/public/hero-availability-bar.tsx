import { Link } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import {
  CalendarDays,
  CircleAlert,
  CircleX,
  Info,
  LoaderCircle,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

type VenueOption = {
  label: string;
  value: string;
  category?: string | null;
  capacity?: string | null;
};

type AvailabilityStatus = 'available' | 'limited' | 'public_booked' | 'private_booked' | 'blocked';

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
  blocks?: AvailabilityBlock[];
  event_titles?: string[];
  calendar_blocks?: CalendarBlock[];
  recommended_action?: string;
  can_proceed?: boolean;
  venue_capacity_ok?: boolean | null;
  venue_capacity_message?: string | null;
};

type RangeSummary = {
  from: string;
  to: string;
  venue: string;
  eventType: string;
  guests: number;
  status: AvailabilityStatus;
  canProceed: boolean;
  title: string;
  description: string;
  note: string;
  results: AvailabilityResult[];
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
  if (contentType.includes('application/json')) return response.json();

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Unexpected response.' };
  }
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

function blockTone(block: AvailabilityBlock) {
  return block.is_available
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
    : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200';
}

function HeroFieldShell({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[1.45rem] border border-black/5 bg-white/95 px-4 py-3 text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-950/78 dark:text-white">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        <span className="text-slate-400 dark:text-slate-500">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

function formatRangeLabel(from: string, to: string) {
  const first = new Date(`${from}T00:00:00`);
  const last = new Date(`${to}T00:00:00`);

  const formatter = new Intl.DateTimeFormat('en-US', {
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

function toDateKeys(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const keys: string[] = [];

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return keys;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = `${cursor.getMonth() + 1}`.padStart(2, '0');
    const day = `${cursor.getDate()}`.padStart(2, '0');
    keys.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function summarizeStatus(results: AvailabilityResult[]): AvailabilityStatus {
  if (results.some((item) => item.status === 'blocked')) return 'blocked';
  if (results.some((item) => item.status === 'private_booked')) return 'private_booked';
  if (results.some((item) => item.status === 'public_booked')) return 'public_booked';
  if (results.some((item) => item.status === 'limited')) return 'limited';
  return 'available';
}

function summarizeRange(results: AvailabilityResult[], from: string, to: string, venue: string, eventType: string, guests: number): RangeSummary {
  const status = summarizeStatus(results);
  const canProceed = results.every((item) => item.can_proceed !== false);

  const title =
    status === 'available'
      ? 'Selected range is open for booking'
      : status === 'limited'
      ? 'Selected range has limited availability'
      : status === 'public_booked'
      ? 'Selected range has visible public activity'
      : status === 'private_booked'
      ? 'Selected range includes private booking dates'
      : 'Selected range includes blocked dates';

  const description =
    status === 'available'
      ? 'All selected dates are currently available across their visible AM, PM, and EVE blocks.'
      : status === 'limited'
      ? 'Some selected dates still have open time blocks, but at least one part of the range is already occupied.'
      : status === 'public_booked'
      ? 'At least one date has visible public activity. Review the day-by-day time block status below.'
      : status === 'private_booked'
      ? 'At least one date is already privately reserved, so the full date range is not fully open.'
      : 'At least one date is fully blocked or unavailable for public booking.';

  const note = canProceed
    ? 'You may continue to the booking page after reviewing the day-by-day availability.'
    : 'Please adjust the range or venue before proceeding with booking.';

  return {
    from,
    to,
    venue,
    eventType,
    guests,
    status,
    canProceed,
    title,
    description,
    note,
    results,
  };
}

export default function HeroAvailabilityBar({ venueOptions }: { venueOptions: VenueOption[] }) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;

  const [dateFrom, setDateFrom] = useState(todayKey);
  const [dateTo, setDateTo] = useState(todayKey);
  const [eventType, setEventType] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [result, setResult] = useState<RangeSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedVenue = useMemo(() => venueOptions.find((item) => item.value === venue) ?? null, [venue, venueOptions]);

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!dateFrom || !dateTo || !eventType || !venue || !guests) {
      setValidationMessage('Please complete the date range, event type, area, and guest count.');
      return;
    }

    if (dateFrom > dateTo) {
      setValidationMessage('The end date must be the same as or later than the start date.');
      return;
    }

    const rangeKeys = toDateKeys(dateFrom, dateTo);

    if (rangeKeys.length > 14) {
      setValidationMessage('Please keep the quick-check range to 14 days or fewer.');
      return;
    }

    setLoading(true);
    setModalOpen(true);
    setResult(null);
    setValidationMessage('');
    setModalMessage('Checking selected date range and area...');

    try {
      const responses = await Promise.all(
        rangeKeys.map(async (date) => {
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
              date,
              event_type: eventType,
              venue,
              guests: Number(guests),
            }),
          });

          const payload = await parseResponse(response);

          if (!response.ok) {
            throw new Error(payload?.message ?? `Unable to check ${date}.`);
          }

          return payload as AvailabilityResult;
        }),
      );

      setResult(summarizeRange(responses, dateFrom, dateTo, venue, eventType, Number(guests)));
      setModalMessage('');
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : 'Unable to check availability right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="glass-card rounded-[2rem] border-white/20 p-3 shadow-[0_28px_70px_rgba(15,23,42,0.18)] dark:shadow-[0_28px_70px_rgba(2,8,23,0.50)] lg:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/72">Availability Quick Check</div>
            <div className="mt-1 text-sm text-white/86">Select a single date or a multi-day range before starting the booking request.</div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            Multi-date public schedule preview
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 xl:grid-cols-[1.05fr_1.05fr_1.18fr_1.12fr_0.85fr_auto]">
          <HeroFieldShell label="Date From" icon={<CalendarDays className="h-4 w-4" />}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                if (!dateTo || e.target.value > dateTo) {
                  setDateTo(e.target.value);
                }
              }}
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </HeroFieldShell>

          <HeroFieldShell label="Date To" icon={<CalendarDays className="h-4 w-4" />}>
            <input
              type="date"
              min={dateFrom}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </HeroFieldShell>

          <HeroFieldShell label="Event Type" icon={<Sparkles className="h-4 w-4" />}>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none">
              <option value="">Select type</option>
              {eventTypeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </HeroFieldShell>

          <HeroFieldShell label="Venue / Area" icon={<Sparkles className="h-4 w-4" />}>
            <select value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none">
              <option value="">Select area</option>
              {venueOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </HeroFieldShell>

          <HeroFieldShell label="Guests" icon={<Users className="h-4 w-4" />}>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Estimated guests"
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </HeroFieldShell>

          <button
            type="submit"
            className="inline-flex min-h-[66px] items-center justify-center rounded-[1.45rem] bg-[#174f40] px-5 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(23,79,64,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 dark:bg-[#294CFF] dark:shadow-[0_14px_40px_rgba(41,76,255,0.35)]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Checking
              </span>
            ) : (
              'Check Availability'
            )}
          </button>
        </form>

        {selectedVenue ? (
          <div className="mt-3 rounded-[1.25rem] border border-white/14 bg-white/10 px-4 py-3 text-xs text-white/88">
            <span className="font-semibold">{selectedVenue.label}</span>
            {selectedVenue.category ? ` • ${selectedVenue.category}` : ''}
            {selectedVenue.capacity ? ` • Capacity: ${selectedVenue.capacity}` : ''}
          </div>
        ) : null}

        {validationMessage ? (
          <div className="mt-3 flex items-start gap-2 rounded-[1.25rem] border border-red-200/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {validationMessage}
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/10">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Availability Status</div>
                <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                  {loading ? 'Checking selected schedule' : result?.title || 'Availability result'}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-600 dark:border-white/10 dark:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-5 sm:p-6">
              {loading ? (
                <div className="rounded-[1.6rem] border border-black/5 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-white/5">
                  <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-slate-500 dark:text-slate-300" />
                  <div className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Checking availability</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {modalMessage || 'Please wait while the system reviews the selected range, area, and visible schedule.'}
                  </p>
                </div>
              ) : modalMessage && !result ? (
                <div className="rounded-[1.6rem] border border-red-200 bg-red-50 p-6 dark:border-red-400/20 dark:bg-red-500/10">
                  <div className="inline-flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-200">
                    <CircleX className="h-5 w-5" />
                    Unable to complete the check
                  </div>
                  <p className="mt-3 text-sm text-red-700 dark:text-red-200">{modalMessage}</p>
                </div>
              ) : result ? (
                <div className="space-y-5">
                  <div className={`rounded-[1.6rem] border p-5 ${tone(result.status)}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.22em] opacity-80">{result.status.replaceAll('_', ' ')}</div>
                        <div className="mt-1 text-2xl font-semibold">{result.title}</div>
                      </div>
                      <div className="rounded-full bg-black/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] dark:bg-white/10">
                        {formatRangeLabel(result.from, result.to)}
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-7">{result.description}</p>
                    <p className="mt-3 text-sm leading-7">{result.note}</p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                    <div className="space-y-4">
                      {result.results.map((day) => (
                        <div key={day.date} className="rounded-[1.6rem] border border-black/5 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-slate-900 dark:text-white">{day.date}</div>
                              <div className="text-sm text-slate-500 dark:text-slate-300">{day.venue}</div>
                            </div>
                            <span className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${tone(day.status)}`}>
                              {day.status.replaceAll('_', ' ')}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{day.description}</p>

                          {day.blocks && day.blocks.length > 0 ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              {day.blocks.map((block) => (
                                <div key={`${day.date}-${block.key}`} className={`rounded-[1.2rem] border px-4 py-3 ${blockTone(block)}`}>
                                  <div className="text-sm font-semibold uppercase tracking-[0.16em]">{block.key}</div>
                                  <div className="mt-1 text-sm">{block.label}</div>
                                  <div className="mt-1 text-xs opacity-80">
                                    {block.from} - {block.to}
                                  </div>
                                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]">
                                    {block.is_available ? 'Available' : 'Unavailable'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {day.calendar_blocks && day.calendar_blocks.length > 0 ? (
                            <div className="mt-4 rounded-[1.2rem] border border-black/5 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/60">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Calendar Blocks</div>
                              <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
                                {day.calendar_blocks.map((block, index) => (
                                  <li key={`${day.date}-block-${index}`}>
                                    • {block.title || 'Calendar block'}{block.area ? ` — ${block.area}` : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {day.event_titles && day.event_titles.length > 0 ? (
                            <div className="mt-4 rounded-[1.2rem] border border-black/5 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-slate-950/60">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Visible Events on This Date</div>
                              <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
                                {day.event_titles.map((title) => (
                                  <li key={`${day.date}-${title}`}>• {title}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {day.venue_capacity_message ? (
                            <div className="mt-4 rounded-[1.2rem] border border-black/5 bg-white px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300">
                              {day.venue_capacity_message}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.6rem] border border-black/5 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Booking Summary</div>
                        <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                          <div><span className="font-semibold text-slate-900 dark:text-white">Range:</span> {formatRangeLabel(result.from, result.to)}</div>
                          <div><span className="font-semibold text-slate-900 dark:text-white">Area:</span> {result.venue}</div>
                          <div><span className="font-semibold text-slate-900 dark:text-white">Event Type:</span> {result.eventType}</div>
                          <div><span className="font-semibold text-slate-900 dark:text-white">Guests:</span> {result.guests}</div>
                        </div>
                      </div>

                      <div className="rounded-[1.6rem] border border-black/5 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <Info className="h-4 w-4" />
                          What to do next
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          Review each day first. Dates with blocked or private-booked status should be changed before you continue.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/bookings/create?date_from=${encodeURIComponent(result.from)}&date_to=${encodeURIComponent(result.to)}&venue=${encodeURIComponent(result.venue)}`}
                            className="inline-flex items-center rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
                          >
                            Continue to Booking
                          </Link>
                          <Link href="/calendar" className="inline-flex items-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-white">
                            Open Full Calendar
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
