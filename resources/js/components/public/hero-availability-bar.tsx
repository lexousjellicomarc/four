import { BcccLogoLoader } from '@/components/shared/bccc-logo-loader';
import {
    blockMeta,
    cx,
    daysBetween,
    deriveDayStatus,
    formatRangeLabel,
    normalizeBlocks,
    normalizeStatus,
    postAvailabilityCheck,
    publicEventTypeOptions,
    rangeBookingHref,
    statusDescription,
    statusDot,
    statusLabel,
    todayKey,
    type AvailabilityRangeResponse,
    type AvailabilityStatus,
    type PublicDayStatus,
} from '@/lib/public-availability';
import type { VenueOption } from '@/types/public-content';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    Clock3,
    LayoutGrid,
    LoaderCircle,
    Search,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
    venueOptions: VenueOption[];
};

const ease = [0.22, 1, 0.36, 1] as const;

const blockOrderPreview = [
    { key: 'AM', display: blockMeta.AM.display },
    { key: 'PM', display: blockMeta.PM.display },
    { key: 'EVE', display: blockMeta.EVE.display },
];

function readableNumber(value?: number | null) {
    return Number(value ?? 0).toLocaleString('en-PH');
}

function asRangePayload(
    payload: unknown,
    form: {
        from: string;
        to: string;
        venue: string;
        eventType: string;
        guests: string;
    },
): AvailabilityRangeResponse {
    const raw = payload as Partial<AvailabilityRangeResponse> & Partial<PublicDayStatus>;

    if (Array.isArray(raw.results)) {
        return {
            mode: 'range',
            from: raw.from || form.from,
            to: raw.to || form.to,
            venue: raw.venue || form.venue,
            event_type: raw.event_type || form.eventType,
            guests: raw.guests || Number(form.guests),
            status: normalizeStatus(raw.status),
            title: raw.title || 'Availability checked',
            description: raw.description || 'The selected range was checked.',
            note: raw.note || raw.recommended_action || 'Review each day before continuing.',
            recommended_action: raw.recommended_action || null,
            can_proceed: raw.can_proceed !== false,
            days_count: raw.days_count || raw.results.length,
            available_days: raw.available_days,
            limited_days: raw.limited_days,
            blocked_days: raw.blocked_days,
            results: raw.results,
            event_titles: raw.event_titles || [],
            calendar_blocks: raw.calendar_blocks || [],
        };
    }

    const singleDay = payload as PublicDayStatus;
    const status = deriveDayStatus(singleDay);

    return {
        mode: 'range',
        from: singleDay.date || form.from,
        to: singleDay.date || form.to,
        date: singleDay.date || form.from,
        venue: singleDay.venue || form.venue,
        event_type: singleDay.event_type || form.eventType,
        guests: singleDay.guests || Number(form.guests),
        status,
        title: singleDay.title || statusLabel(status),
        description: singleDay.description || statusDescription(status),
        note: singleDay.note || 'Review the available time blocks before continuing.',
        recommended_action: singleDay.recommended_action || null,
        can_proceed: singleDay.can_proceed !== false,
        days_count: 1,
        available_days: status === 'available' ? 1 : 0,
        limited_days: status === 'limited' ? 1 : 0,
        blocked_days: status === 'blocked' || status === 'private_booked' ? 1 : 0,
        results: [singleDay],
        event_titles: singleDay.event_titles || [],
        calendar_blocks: singleDay.calendar_blocks || [],
    };
}

function useAvailabilityDockLayout() {
    const dockRef = useRef<HTMLElement | null>(null);
    const [footerLift, setFooterLift] = useState(0);

    useEffect(() => {
        function update() {
            const footerElement = document.querySelector<HTMLElement>('footer');

            if (!footerElement) {
                setFooterLift(0);
                return;
            }

            const rect = footerElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            /*
             * Lift the fixed dock only when the footer enters the viewport.
             * Do not add inline body/footer padding because that creates the
             * large blank space after the public footer.
             */
            const overlap = Math.max(0, viewportHeight - rect.top);
            setFooterLift(Math.ceil(overlap));
        }

        update();

        const observer = new ResizeObserver(update);

        if (dockRef.current) {
            observer.observe(dockRef.current);
        }

        const footerElement = document.querySelector<HTMLElement>('footer');
        if (footerElement) {
            observer.observe(footerElement);
        }

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    return {
        dockRef,
        footerLift,
    };
}

function FieldShell({
    label,
    icon,
    children,
}: {
    label: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <label className="group grid min-w-0 gap-1 rounded-[1rem] border border-[#d9c7a6]/70 bg-white/86 px-3 py-2 shadow-sm transition focus-within:border-[#b08d48] focus-within:ring-4 focus-within:ring-[#b08d48]/15 dark:border-white/10 dark:bg-white/[0.075]">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b672d] dark:text-[#f1d89b]">
                {icon}
                {label}
            </span>

            {children}
        </label>
    );
}
function availabilityTone(status: AvailabilityStatus | string) {
    const normalized = normalizeStatus(status);

    if (normalized === 'available') {
        return {
            shell: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100',
            icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
            accent: 'text-emerald-700 dark:text-emerald-200',
        };
    }

    if (normalized === 'limited' || normalized === 'public_booked') {
        return {
            shell: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100',
            icon: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200',
            badge: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200',
            accent: 'text-amber-700 dark:text-amber-200',
        };
    }

    return {
        shell: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100',
        icon: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
        accent: 'text-rose-700 dark:text-rose-200',
    };
}

function blockTone(isAvailable?: boolean) {
    if (isAvailable) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100';
    }

    return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100';
}
function ResultStatusIcon({ status }: { status: AvailabilityStatus | string }) {
    const normalized = normalizeStatus(status);

    if (normalized === 'available') {
        return <CheckCircle2 className="h-5 w-5" />;
    }

    if (normalized === 'limited' || normalized === 'public_booked') {
        return <AlertTriangle className="h-5 w-5" />;
    }

    return <CircleAlert className="h-5 w-5" />;
}

function DayResultCard({ day }: { day: PublicDayStatus }) {
    const status = deriveDayStatus(day);
    const blocks = normalizeBlocks(day.blocks);

    const availableBlocks = blocks.filter((block) => block.is_available);
    const unavailableBlocks = blocks.filter((block) => !block.is_available);

    return (
        <article className="rounded-[1.2rem] border border-[#eadcc2]/80 bg-white/76 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        {day.date}
                    </p>

                    <h4 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#21180d] dark:text-white">
                        {statusLabel(status)}
                    </h4>
                </div>

                <span className={cx('w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em]', statusDot(status))}>
                    {statusLabel(status)}
                </span>
            </div>

            {availableBlocks.length > 0 ? (
                <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                        Available time
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {availableBlocks.map((block) => (
                            <span
                                key={block.key}
                                className="inline-flex min-h-9 items-center gap-2 rounded-full bg-emerald-50 px-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-100 dark:ring-emerald-400/20"
                            >
                                {block.key} · {block.label}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="mt-4 rounded-[1rem] bg-rose-50 p-3 text-sm font-semibold leading-6 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-100 dark:ring-rose-400/20">
                    No available time block for this date.
                </p>
            )}

            {unavailableBlocks.length > 0 && availableBlocks.length > 0 ? (
                <p className="mt-3 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                    Some time blocks are already unavailable. You can still continue using the available time shown above.
                </p>
            ) : null}
        </article>
    );
}

function AvailabilityResultModal({
    open,
    loading,
    message,
    result,
    onClose,
}: {
    open: boolean;
    loading: boolean;
    message: string;
    result: AvailabilityRangeResponse | null;
    onClose: () => void;
}) {
    const reduceMotion = useReducedMotion();

    const normalized = result ? normalizeStatus(result.status) : 'limited';
    const canProceed = result?.can_proceed !== false && normalized !== 'blocked' && normalized !== 'private_booked';

    const resultTitle =
        normalized === 'available'
            ? 'Good news, this schedule is available.'
            : normalized === 'limited' || normalized === 'public_booked'
              ? 'Some time blocks are still available.'
              : 'This schedule is not available.';

    const resultMessage =
        normalized === 'available'
            ? 'You may continue with your booking request.'
            : normalized === 'limited' || normalized === 'public_booked'
              ? 'Please choose from the available time blocks shown below.'
              : 'Please choose another date, area, or check the full calendar.';

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/45 px-3 py-6 backdrop-blur-xl"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[1.7rem] border border-[#d9c7a6]/70 bg-[#f8f5ef] text-[#21180d] shadow-[0_30px_110px_rgba(0,0,0,0.32)] dark:border-white/10 dark:bg-[#101419] dark:text-white"
                        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 12, scale: 0.97, filter: 'blur(10px)' }}
                        transition={{ duration: 0.32, ease }}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[#eadcc2]/80 p-5 dark:border-white/10">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                    Availability Result
                                </p>

                                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                                    {loading ? 'Checking schedule...' : resultTitle}
                                </h3>

                                {result ? (
                                    <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                        {formatRangeLabel(result.from, result.to)} · {result.venue}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white/80 text-[#2f2517] transition hover:bg-[#fffaf0] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                aria-label="Close availability result"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[calc(90vh-6rem)] overflow-y-auto p-5">
                            {loading ? (
                                <div className="grid min-h-[18rem] place-items-center text-center">
                                    <div>
                                        <BcccLogoLoader size="md" />

                                        <h4 className="mt-5 text-xl font-bold text-[#21180d] dark:text-white">
                                            Please wait
                                        </h4>

                                        <p className="mx-auto mt-2 max-w-[54ch] text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                            Checking the selected date and venue area.
                                        </p>
                                    </div>
                                </div>
                            ) : message && !result ? (
                                <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 p-5 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                                    <h4 className="text-lg font-bold">Unable to check availability</h4>
                                    <p className="mt-2 text-sm leading-6">{message}</p>
                                </div>
                            ) : result ? (
                                <div className="grid gap-5">
                                    <section
                                        className={cx(
                                            'rounded-[1.35rem] border p-5',
                                            normalized === 'available'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100'
                                                : normalized === 'limited' || normalized === 'public_booked'
                                                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100'
                                                  : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100',
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <span className="mt-0.5">
                                                <ResultStatusIcon status={result.status} />
                                            </span>

                                            <div>
                                                <h4 className="text-xl font-bold">
                                                    {resultTitle}
                                                </h4>

                                                <p className="mt-2 text-sm leading-6">
                                                    {resultMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                            Available Schedule
                                        </p>

                                        <div className="grid gap-3">
                                            {result.results.map((day) => (
                                                <DayResultCard key={day.date} day={day} />
                                            ))}
                                        </div>
                                    </section>

                                    <section className="rounded-[1.25rem] border border-[#eadcc2]/80 bg-white/76 p-5 dark:border-white/10 dark:bg-white/[0.045]">
                                        <p className="text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                            {canProceed
                                                ? 'Ready to continue? The booking form will use your selected date, area, event type, and guest count.'
                                                : 'Try another date or check the full calendar for open schedules.'}
                                        </p>

                                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                            {canProceed ? (
                                                <Link
                                                    href={rangeBookingHref({
                                                        from: result.from,
                                                        to: result.to,
                                                        venue: result.venue,
                                                        event_type: result.event_type,
                                                        guests: result.guests,
                                                    })}
                                                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-bold text-white transition hover:bg-[#4a3921] dark:bg-[#f1d89b] dark:text-[#17120b]"
                                                >
                                                    Continue to Booking
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            ) : null}

                                            <Link
                                                href="/calendar"
                                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white"
                                            >
                                                View Calendar
                                                <LayoutGrid className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </section>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

function SummaryStat({
    label,
    value,
    tone = 'neutral',
}: {
    label: string;
    value?: string | number | null;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
    const toneClass =
        tone === 'success'
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100'
            : tone === 'warning'
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-100'
              : tone === 'danger'
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-400/10 dark:text-rose-100'
                : 'bg-white/76 text-[#21180d] dark:bg-white/[0.045] dark:text-white';

    return (
        <div className={cx('rounded-[1.2rem] border border-[#eadcc2]/80 p-4 shadow-sm dark:border-white/10', toneClass)}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
                {label}
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.06em]">
                {value ?? '—'}
            </p>
        </div>
    );
}

export default function HeroAvailabilityBar({ venueOptions }: Props) {
    const options = venueOptions.length > 0 ? venueOptions : [];
    const defaultVenue = options[0]?.value || '';

    const [dateFrom, setDateFrom] = useState(todayKey());
    const [dateTo, setDateTo] = useState(todayKey());
    const [eventType, setEventType] = useState('');
    const [venue, setVenue] = useState(defaultVenue);
    const [guests, setGuests] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [result, setResult] = useState<AvailabilityRangeResponse | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const { dockRef, footerLift } = useAvailabilityDockLayout();

    const selectedVenue = useMemo(
        () => options.find((item) => item.value === venue) ?? null,
        [venue, options],
    );

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
            const payload = await postAvailabilityCheck({
                date: dateFrom,
                start_date: dateFrom,
                end_date: dateTo,
                date_from: dateFrom,
                date_to: dateTo,
                venue,
                event_type: eventType,
                guests: Number(guests),
            });

            setResult(
                asRangePayload(payload, {
                    from: dateFrom,
                    to: dateTo,
                    venue,
                    eventType,
                    guests,
                }),
            );

            setModalMessage('');
        } catch (error) {
            setModalMessage(error instanceof Error ? error.message : 'Unable to check availability right now.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <motion.section
    ref={dockRef}
    className="bccc-availability-dock fixed inset-x-0 z-[8500] w-screen px-0"
    style={{
        bottom: `calc(${footerLift}px + env(safe-area-inset-bottom))`,
    }}
    initial={{ y: 28, opacity: 0, filter: 'blur(10px)' }}
    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
    transition={{ duration: 0.42, ease }}
    aria-label="Sticky availability checker"
>
    <div className="bccc-availability-dock-panel w-full rounded-none border-y border-[#d9c7a6]/80 bg-[#fffaf0]/96 p-2 shadow-[0_-12px_60px_rgba(47,37,23,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/96">
    <form
    onSubmit={handleSubmit}
    className="bccc-availability-form mx-auto grid w-full max-w-[1800px] gap-2 px-3 sm:px-4 lg:grid-cols-[1fr_1fr_1.1fr_1.1fr_0.85fr_auto] lg:px-6"
>
                        <FieldShell label="From" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    setDateFrom(next);

                                    if (!dateTo || next > dateTo) {
                                        setDateTo(next);
                                    }
                                }}
                                className="h-8 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                            />
                        </FieldShell>

                        <FieldShell label="To" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(event) => setDateTo(event.target.value)}
                                className="h-8 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                            />
                        </FieldShell>

                        <FieldShell label="Event Type" icon={<Sparkles className="h-3.5 w-3.5" />}>
                            <select
                                value={eventType}
                                onChange={(event) => setEventType(event.target.value)}
                                className="h-8 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                            >
                                <option value="">Select type</option>
                                {publicEventTypeOptions.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </FieldShell>

                        <FieldShell label="Area" icon={<LayoutGrid className="h-3.5 w-3.5" />}>
                            <select
                                value={venue}
                                onChange={(event) => setVenue(event.target.value)}
                                className="h-8 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none dark:text-white"
                            >
                                <option value="">Select area</option>
                                {options.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </FieldShell>

                        <FieldShell label="Guests" icon={<Users className="h-3.5 w-3.5" />}>
                            <input
                                type="number"
                                min="1"
                                value={guests}
                                onChange={(event) => setGuests(event.target.value)}
                                placeholder="Estimated"
                                className="h-8 w-full bg-transparent text-sm font-semibold text-[#2f2517] outline-none placeholder:text-[#85755d] dark:text-white dark:placeholder:text-white/42"
                            />
                        </FieldShell>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex min-h-[4.1rem] items-center justify-center gap-2 rounded-[1rem] bg-[#2f2517] px-5 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_16px_40px_rgba(47,37,23,0.20)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-65 dark:bg-[#f1d89b] dark:text-[#17120b]"
                        >
                            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {loading ? 'Checking' : 'Check'}
                        </button>
                    </form>

                    <div className="mx-auto mt-2 flex w-full max-w-[1800px] flex-col gap-2 px-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                        <div className="min-w-0 text-xs leading-5 text-[#6e604c] dark:text-white/56">
                            {selectedVenue ? (
                                <>
                                    <span className="font-bold text-[#2f2517] dark:text-white">{selectedVenue.label}</span>
                                    {selectedVenue.category ? ` • ${selectedVenue.category}` : ''}
                                    {selectedVenue.capacity ? ` • Capacity: ${selectedVenue.capacity}` : ''}
                                </>
                            ) : (
                                'Select a venue area to begin checking availability.'
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {blockOrderPreview.map((item) => (
                                <span
                                    key={item.key}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-[#d9c7a6]/70 bg-white/70 px-2.5 py-1 text-[11px] font-bold text-[#6e604c] dark:border-white/10 dark:bg-white/7 dark:text-white/56"
                                >
                                    <Clock3 className="h-3 w-3 text-[#9d7b3d] dark:text-[#f1d89b]" />
                                    {item.key} {item.display}
                                </span>
                            ))}
                        </div>
                    </div>

                    {validationMessage ? (
                        <div className="mx-auto mt-2 max-w-[1800px] rounded-[0.9rem] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                            {validationMessage}
                        </div>
                    ) : null}
                </div>
            </motion.section>

            <AvailabilityResultModal
                open={modalOpen}
                loading={loading}
                message={modalMessage}
                result={result}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}
