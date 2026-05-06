import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as React from 'react';

type BlockKey = 'AM' | 'PM' | 'EVE';

type BlockAvailability = {
    key: BlockKey;
    label: string;
    from: string;
    to: string;
    is_available: boolean;
};

type AvailabilityResponse = {
    date: string;
    window?: { from: string; to: string };
    blocks?: Record<BlockKey, BlockAvailability>;
    is_fully_booked?: boolean;
    is_warning?: boolean;
};

const ORDER: BlockKey[] = ['AM', 'PM', 'EVE'];

const UI = {
    AM: { title: 'AM', desc: 'Morning', time: '6:00 AM – 12:00 PM' },
    PM: { title: 'PM', desc: 'Afternoon', time: '12:00 PM – 6:00 PM' },
    EVE: { title: 'EVE', desc: 'Evening', time: '6:00 PM – 12:00 AM' },
} as const;

function addDays(ymd: string, days: number): string {
    const [y, m, d] = ymd.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function toIso(date: string, time: string): string {
    // "24:00" = next-day 00:00
    if (time === '24:00') {
        const next = addDays(date, 1);
        return `${next}T00:00`;
    }
    return `${date}T${time}`;
}

function normalizeToContiguous(blocks: BlockKey[]): BlockKey[] {
    if (blocks.length === 0) return [];
    const idx = blocks.map((b) => ORDER.indexOf(b));
    const min = Math.min(...idx);
    const max = Math.max(...idx);
    return ORDER.slice(min, max + 1);
}

function labelFor(blocks: BlockKey[]): string {
    const key = blocks.join(',');
    if (key === 'AM') return 'AM (Morning)';
    if (key === 'PM') return 'PM (Afternoon)';
    if (key === 'EVE') return 'EVE (Evening)';
    if (key === 'AM,PM') return 'Whole Day';
    if (key === 'PM,EVE') return 'Afternoon + Evening';
    if (key === 'AM,PM,EVE') return 'Whole Day (till evening)';
    return key;
}

function rangeFor(date: string, blocks: BlockKey[]) {
    if (!date || blocks.length === 0) return null;

    const normalized = normalizeToContiguous(blocks);
    const first = normalized[0];
    const last = normalized[normalized.length - 1];

    const fromTime =
        first === 'AM' ? '06:00' : first === 'PM' ? '12:00' : '18:00';
    const toTime = last === 'AM' ? '12:00' : last === 'PM' ? '18:00' : '24:00';

    return {
        label: labelFor(normalized),
        blocks: normalized,
        fromIso: toIso(date, fromTime),
        toIso: toIso(date, toTime),
        display: `${fromTime} – ${toTime === '24:00' ? '12:00 AM' : toTime}`,
    };
}

export default function BookingTimeBlocksPicker(props: {
    date: string;
    onDateChange: (date: string) => void;

    value: BlockKey[];
    onChange: (blocks: BlockKey[]) => void;

    excludeBookingId?: number;

    // When date/blocks change we can push the ISO range to the parent form
    onRangeChange?: (range: {
        fromIso: string;
        toIso: string;
        label: string;
    }) => void;

    contactNumber?: string; // optional note display
}) {
    const {
        date,
        onDateChange,
        value,
        onChange,
        excludeBookingId,
        onRangeChange,
        contactNumber,
    } = props;

    const [loading, setLoading] = React.useState(false);
    const [availability, setAvailability] =
        React.useState<AvailabilityResponse | null>(null);
    const [hint, setHint] = React.useState<string | null>(null);

    const blocksInfo = availability?.blocks;

    React.useEffect(() => {
        let ignore = false;

        async function load() {
            if (!date) {
                setAvailability(null);
                return;
            }

            setLoading(true);
            setHint(null);

            try {
                const url = new URL(
                    '/bookings/availability',
                    window.location.origin,
                );
                url.searchParams.set('date', date);
                if (excludeBookingId)
                    url.searchParams.set(
                        'exclude_booking_id',
                        String(excludeBookingId),
                    );

                const res = await fetch(url.toString(), {
                    headers: { Accept: 'application/json' },
                });

                const json = (await res.json()) as AvailabilityResponse;
                if (!ignore) setAvailability(json);
            } catch (e) {
                if (!ignore) setAvailability(null);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        load();

        return () => {
            ignore = true;
        };
    }, [date, excludeBookingId]);

    // Push computed range to parent
    React.useEffect(() => {
        if (!onRangeChange) return;
        const r = rangeFor(date, value);
        if (!r) return;
        onRangeChange({ fromIso: r.fromIso, toIso: r.toIso, label: r.label });
    }, [date, value, onRangeChange]);

    const selected = normalizeToContiguous(value);
    const selectedRange = date ? rangeFor(date, selected) : null;

    function isAvailable(key: BlockKey) {
        if (!blocksInfo) return true; // if API not loaded yet, don't block UI
        return !!blocksInfo[key]?.is_available;
    }

    function toggle(key: BlockKey) {
        setHint(null);

        // If the API says it's unavailable, don't allow selection
        if (blocksInfo && !isAvailable(key)) return;

        const set = new Set<BlockKey>(selected);
        if (set.has(key)) {
            set.delete(key);
        } else {
            set.add(key);
        }

        const next = normalizeToContiguous(Array.from(set));

        // If contiguity forces selecting a booked middle block, prevent it
        if (blocksInfo) {
            const bad = next.find((k) => !isAvailable(k));
            if (bad) {
                setHint(
                    'That combination crosses a booked block. Please choose another option.',
                );
                return;
            }
        }

        onChange(next);
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <label className="text-sm font-medium">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                    Choose a date first, then choose AM / PM / EVE (you can
                    select multiple).
                </p>
            </div>

            <div className="space-y-3 rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Time Blocks</div>
                    {loading && (
                        <div className="text-xs text-muted-foreground">
                            Checking availability…
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {(ORDER as BlockKey[]).map((k) => {
                        const active = selected.includes(k);
                        const available = isAvailable(k);

                        return (
                            <Button
                                key={k}
                                type="button"
                                variant={active ? 'default' : 'outline'}
                                onClick={() => toggle(k)}
                                disabled={
                                    !date || (blocksInfo ? !available : false)
                                }
                                className={cn(
                                    'h-auto flex-col items-start gap-1 px-3 py-2',
                                    !available && 'opacity-60',
                                )}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <span className="text-sm font-semibold">
                                        {UI[k].title}
                                    </span>
                                    {!available && (
                                        <span className="rounded-full bg-muted px-2 py-[2px] text-[10px]">
                                            Booked
                                        </span>
                                    )}
                                </div>
                                <div className="text-left text-xs">
                                    {UI[k].desc}
                                </div>
                                <div className="text-left text-[11px] text-muted-foreground">
                                    {UI[k].time}
                                </div>
                            </Button>
                        );
                    })}
                </div>

                {hint && <div className="text-xs text-destructive">{hint}</div>}

                {availability?.is_fully_booked && (
                    <div className="text-xs text-destructive">
                        This date is fully booked (AM, PM, and EVE are all
                        unavailable).
                    </div>
                )}

                {selectedRange && (
                    <div className="rounded-md bg-muted/40 p-3 text-sm">
                        <div className="font-medium">Selected:</div>
                        <div className="text-muted-foreground">
                            {selectedRange.label} — {selectedRange.display}
                        </div>
                    </div>
                )}

                <div className="rounded-md border p-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Note:</span>{' '}
                    12:00 AM – 6:00 AM bookings are{' '}
                    <span className="font-medium">admin-only</span>.
                    {contactNumber ? (
                        <>
                            {' '}
                            Please contact{' '}
                            <span className="font-medium">
                                {contactNumber}
                            </span>{' '}
                            for assistance.
                        </>
                    ) : (
                        <> Please contact the admin for assistance.</>
                    )}
                </div>
            </div>
        </div>
    );
}
