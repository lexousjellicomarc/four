import { FormEvent, useMemo, useState } from 'react';

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
  return (
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.trim() ?? ''
  );
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

function resultTone(status: AvailabilityStatus) {
  switch (status) {
    case 'available':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'limited':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'public_booked':
      return 'border-blue-200 bg-blue-50 text-blue-800';
    case 'private_booked':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    default:
      return 'border-red-200 bg-red-50 text-red-800';
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

  const selectedVenueMeta = useMemo(
    () => venueOptions.find((item) => item.value === venue) ?? null,
    [venue, venueOptions],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!date || !eventType || !venue || !guests) {
      setValidationMessage('Complete the date, event type, venue, and guest count first.');
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
    <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-[1.1fr_1.1fr_1.2fr_1fr_auto]">
        <label className="rounded-[1.4rem] bg-white/90 px-4 py-3 text-left text-[#1f1f1c]">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Event Date
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
          />
        </label>

        <label className="rounded-[1.4rem] bg-white/90 px-4 py-3 text-left text-[#1f1f1c]">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
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

        <label className="rounded-[1.4rem] bg-white/90 px-4 py-3 text-left text-[#1f1f1c]">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
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

        <label className="rounded-[1.4rem] bg-white/90 px-4 py-3 text-left text-[#1f1f1c]">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Guests Count
          </div>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="Estimated guest count"
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-[1.4rem] bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
        >
          {loading ? 'Checking...' : 'Check Availability'}
        </button>
      </form>

      {selectedVenueMeta ? (
        <div className="mt-2 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/90">
          {selectedVenueMeta.label}
          {selectedVenueMeta.category ? ` • ${selectedVenueMeta.category}` : ''}
          {selectedVenueMeta.capacity ? ` • Capacity: ${selectedVenueMeta.capacity}` : ''}
        </div>
      ) : null}

      {validationMessage ? (
        <div className="mt-2 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {validationMessage}
        </div>
      ) : null}

      {result ? (
        <div className={`mt-2 rounded-[1.2rem] border px-4 py-3 text-sm ${resultTone(result.status)}`}>
          <div className="font-semibold">{result.title}</div>
          <div className="mt-1">{result.note}</div>
        </div>
      ) : null}
    </div>
  );
}
