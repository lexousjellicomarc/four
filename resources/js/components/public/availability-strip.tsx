import { type FormEvent, useMemo, useState } from 'react';
import { CalendarRange, CircleAlert, Clock3, LayoutGrid, LoaderCircle, Users } from 'lucide-react';

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
  key?: string;
  label?: string;
  from?: string;
  to?: string;
  is_available?: boolean;
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
  calendar_blocks?: Array<{
    title?: string;
    area?: string;
    block?: string;
    public_status?: string;
  }>;
  venue_capacity_message?: string | null;
};

const eventTypeOptions = [
  'Conference',
  'Convention',
  'Seminar',
  'Exhibit',
  'Wedding',
  'Cultural Program',
  'Community Event',
  'Government Event',
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

function statusUi(status: AvailabilityStatus) {
  switch (status) {
    case 'limited':
      return {
        badge: 'bg-[#c58b16] text-white',
        card: 'border-[#f1d49a] bg-[#fff9ef] dark:border-[#7a5b1d] dark:bg-[#241d12]',
        label: 'Limited Availability',
      };
    case 'public_booked':
      return {
        badge: 'bg-[#1d5bd8] text-white',
        card: 'border-[#cfe0ff] bg-[#f4f8ff] dark:border-[#294984] dark:bg-[#131d32]',
        label: 'Public Event',
      };
    case 'private_booked':
      return {
        badge: 'bg-[#b48a1f] text-white',
        card: 'border-[#ecdba5] bg-[#fffaf0] dark:border-[#6e5721] dark:bg-[#241f12]',
        label: 'Private / Fully Booked',
      };
    case 'blocked':
      return {
        badge: 'bg-[#c53434] text-white',
        card: 'border-[#f2c8c8] bg-[#fff6f6] dark:border-[#6e2a2a] dark:bg-[#241414]',
        label: 'Blocked / Unavailable',
      };
    default:
      return {
        badge: 'bg-[#174f40] text-white dark:bg-[#2d47ff]',
        card: 'border-[#cfe4dc] bg-[#f6fbf9] dark:border-[#314857] dark:bg-[#141920]',
        label: 'Available',
      };
  }
}

function normalizeBlocks(blocks?: AvailabilityResult['blocks']): AvailabilityBlock[] {
  if (!blocks) return [];

  if (Array.isArray(blocks)) {
    return blocks;
  }

  return Object.entries(blocks).map(([key, block]) => ({
    key: block.key || key,
    label: block.label || key,
    from: block.from || '--:--',
    to: block.to || '--:--',
    is_available: Boolean(block.is_available),
  }));
}

export default function AvailabilityStrip({ venueOptions }: { venueOptions: VenueOption[] }) {
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState('');
  const [guests, setGuests] = useState('');
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedVenueMeta = useMemo(
    () => venueOptions.find((item) => item.value === venue) ?? null,
    [venue, venueOptions],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!date || !venue || !eventType || !guests) {
      setValidationMessage('Please complete the date, venue, event type, and guest count first.');
      return;
    }

    setValidationMessage('');
    setLoading(true);

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
          date,
          venue,
          event_type: eventType,
          guests: Number(guests),
        }),
      });

      const payload = await parseResponse(response);

      if (!response.ok) {
        setValidationMessage(payload?.message ?? 'Unable to check availability right now.');
        return;
      }

      if (Array.isArray(payload?.results)) {
        setResult(payload.results[0] as AvailabilityResult);
      } else {
        setResult(payload as AvailabilityResult);
      }
    } catch {
      setValidationMessage('Unable to check availability right now.');
    } finally {
      setLoading(false);
    }
  }

  const currentStatusUi = result ? statusUi(result.status) : null;
  const blocks = result ? normalizeBlocks(result.blocks) : [];

  return (
    <section className="border-y border-[#e2d5bd] bg-[#f9f3e8] py-10 dark:border-white/10 dark:bg-[#090b08]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#a1762d]">
            <CalendarRange className="h-4 w-4" />
            Check Availability
          </p>

          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-[#1f211a] dark:text-white">
            Find an open venue date instantly
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#6e695f] dark:text-white/62">
            This checker reads the same availability layer used by the booking side and public calendar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="border border-[#ded0b6] bg-white/82 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a1762d]">
                <Clock3 className="h-3.5 w-3.5" />
                Event Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
              />
            </label>

            <label className="border border-[#ded0b6] bg-white/82 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a1762d]">
                <LayoutGrid className="h-3.5 w-3.5" />
                Venue
              </span>
              <select
                value={venue}
                onChange={(event) => setVenue(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
              >
                <option value="">Select venue</option>
                {venueOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="border border-[#ded0b6] bg-white/82 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a1762d]">
                <CalendarRange className="h-3.5 w-3.5" />
                Event Type
              </span>
              <select
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                className="mt-2 w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
              >
                <option value="">Select type</option>
                {eventTypeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="border border-[#ded0b6] bg-white/82 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a1762d]">
                <Users className="h-3.5 w-3.5" />
                Guests
              </span>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                placeholder="Estimated guest count"
                className="mt-2 w-full bg-transparent text-sm font-semibold outline-none dark:text-white"
              />
            </label>
          </div>

          {selectedVenueMeta ? (
            <p className="border border-[#ded0b6] bg-white/60 px-4 py-3 text-xs font-semibold text-[#6e695f] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62">
              {selectedVenueMeta.label}
              {selectedVenueMeta.category ? ` • ${selectedVenueMeta.category}` : ''}
              {selectedVenueMeta.capacity ? ` • Capacity: ${selectedVenueMeta.capacity}` : ''}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#174f40] px-5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:bg-[#11392f] disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Checking...' : 'Check Availability'}
          </button>

          {validationMessage ? (
            <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {validationMessage}
            </div>
          ) : null}

          {result && currentStatusUi ? (
            <article className={`border p-5 ${currentStatusUi.card}`}>
              <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${currentStatusUi.badge}`}>
                {currentStatusUi.label}
              </span>

              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#1f211a] dark:text-white">
                {result.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#6e695f] dark:text-white/62">
                {result.description}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <InfoBox label="Date" value={result.date} />
                <InfoBox label="Venue" value={result.venue} />
              </div>

              {blocks.length > 0 ? (
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {blocks.map((block) => (
                    <div key={block.key} className="border border-current/20 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                        {block.label ?? block.key}
                      </p>
                      <p className="mt-1 text-xs">
                        {(block.from ?? '--:--')} - {(block.to ?? '--:--')}
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {block.is_available ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {result.event_titles && result.event_titles.length > 0 ? (
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1762d]">
                    Public Event Titles
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-[#6e695f] dark:text-white/62">
                    {result.event_titles.map((title) => (
                      <li key={title}>• {title}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.venue_capacity_message ? (
                <p className="mt-4 border border-[#d9c79d] bg-white/70 p-3 text-sm leading-6 text-[#6b5221] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#f2d697]">
                  {result.venue_capacity_message}
                </p>
              ) : null}

              <p className="mt-4 text-sm leading-7 text-[#6e695f] dark:text-white/62">
                {result.note}
              </p>
            </article>
          ) : null}
        </form>
      </div>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-current/20 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
