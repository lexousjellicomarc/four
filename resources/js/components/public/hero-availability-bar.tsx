import { FormEvent, useMemo, useState } from 'react';
import { CircleAlert, Info, LoaderCircle } from 'lucide-react';

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

type AvailabilityResult = {
  date: string;
  venue: string;
  status: AvailabilityStatus;
  title: string;
  description: string;
  note: string;
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
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200';
    case 'limited':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200';
    case 'public_booked':
      return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200';
    case 'private_booked':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/40 dark:text-yellow-200';
    default:
      return 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200';
  }
}

export default function HeroAvailabilityBar({ venueOptions }: { venueOptions: VenueOption[] }) {
  const [date, setDate] = useState('');
  const [eventType, setEventType] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const selectedVenue = useMemo(
    () => venueOptions.find((item) => item.value === venue) ?? null,
    [venue, venueOptions],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!date || !eventType || !venue || !guests) {
      setValidationMessage('Please complete the date, event type, area, and guest count.');
      return;
    }

    setLoading(true);
    setValidationMessage('');

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
          event_type: eventType,
          venue,
          guests: Number(guests),
        }),
      });

      const payload = await parseResponse(response);

      if (!response.ok) {
        setValidationMessage(payload?.message ?? 'Unable to check availability right now.');
        return;
      }

      setResult(payload as AvailabilityResult);
    } catch {
      setValidationMessage('Unable to check availability right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-[1.75rem] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:shadow-[0_18px_40px_rgba(2,8,23,0.42)]">
      <form onSubmit={handleSubmit} className="grid gap-2 lg:grid-cols-[1.08fr_1.08fr_1.1fr_0.95fr_auto]">
        <label className="rounded-[1.25rem] bg-white/85 px-4 py-3 text-slate-800 dark:bg-slate-900/80 dark:text-white">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Event Date
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
          />
        </label>

        <label className="rounded-[1.25rem] bg-white/85 px-4 py-3 text-slate-800 dark:bg-slate-900/80 dark:text-white">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Event Type
          </div>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
          >
            <option value="">Select type</option>
            {eventTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-[1.25rem] bg-white/85 px-4 py-3 text-slate-800 dark:bg-slate-900/80 dark:text-white">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Select Area
          </div>
          <select
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
          >
            <option value="">Select area</option>
            {venueOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-[1.25rem] bg-white/85 px-4 py-3 text-slate-800 dark:bg-slate-900/80 dark:text-white">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Guests Count
          </div>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="Estimated guests"
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-[1.25rem] bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70 dark:bg-[#294CFF]"
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
        <div className="mt-2 flex flex-wrap gap-2 rounded-[1rem] bg-black/5 px-4 py-3 text-xs text-slate-700 dark:bg-white/5 dark:text-slate-200">
          <span className="font-semibold">{selectedVenue.label}</span>
          {selectedVenue.category ? <span>• {selectedVenue.category}</span> : null}
          {selectedVenue.capacity ? <span>• Capacity: {selectedVenue.capacity}</span> : null}
        </div>
      ) : null}

      {validationMessage ? (
        <div className="mt-2 inline-flex w-full items-start gap-2 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{validationMessage}</span>
        </div>
      ) : null}

      {result ? (
        <div className={`mt-2 rounded-[1rem] border px-4 py-3 text-sm ${tone(result.status)}`}>
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">{result.title}</div>
              <div className="mt-1 text-sm/6">{result.note || result.description}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
