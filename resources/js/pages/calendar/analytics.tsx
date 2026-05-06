import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    BarChart3,
    CalendarDays,
    Download,
    FileText,
    Layers3,
    Search,
    TrendingUp,
} from 'lucide-react';
import type { FormEvent } from 'react';

type CountRow = {
    block?: string;
    status?: string;
    weekday?: string;
    count?: number;
    label?: string;
    value?: number;
};

type AreaRow = {
    area: string;
    bookings: number;
    calendar_blocks: number;
    public_events: number;
    total: number;
};

type DateRow = {
    date: string;
    occupied_blocks: number;
    bookings: number;
    calendar_blocks: number;
    public_events: number;
    total_activity: number;
};

type Props = {
    filters: {
        start_date?: string;
        end_date?: string;
    };
    generated_at?: string;
    summary: Record<string, unknown>;
    block_usage: CountRow[];
    block_status_mix: CountRow[];
    weekday_usage: CountRow[];
    area_usage: AreaRow[];
    busiest_dates: DateRow[];
    date_series: DateRow[];
};

function currentCalendarBase() {
    if (window.location.pathname.startsWith('/admin')) return '/admin/calendar';
    if (window.location.pathname.startsWith('/manager'))
        return '/manager/calendar';

    return '/calendar';
}

function breadcrumbs(): BreadcrumbItem[] {
    const base = currentCalendarBase();

    return [
        { title: 'Calendar', href: base },
        { title: 'Analytics', href: `${base}/analytics` },
    ];
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function cleanLabel(value: unknown): string {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function getSummary(summary: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        if (summary[key] !== undefined && summary[key] !== null) {
            return numberValue(summary[key]);
        }
    }

    return 0;
}

function maxValue<T>(items: T[], getter: (item: T) => number) {
    return Math.max(1, ...items.map((item) => getter(item)));
}

function countLabel(row: CountRow) {
    return row.block || row.status || row.weekday || row.label || '—';
}

function countValue(row: CountRow) {
    return numberValue(row.count ?? row.value);
}

function StatCard({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    helper: string;
    icon: LucideIcon;
}) {
    return (
        <article className="calendar-analytics-kpi">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="backend-booking-label">{label}</p>
                    <strong>{value}</strong>
                </div>

                <div className="alh-admin-kpi-icon">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <p>{helper}</p>
        </article>
    );
}

function MiniBar({
    label,
    value,
    max,
}: {
    label: string;
    value: number;
    max: number;
}) {
    const width = Math.max(4, Math.min(100, (value / Math.max(max, 1)) * 100));

    return (
        <div className="calendar-analytics-mini-bar">
            <div className="flex items-center justify-between gap-3">
                <span>{label}</span>
                <strong>{value}</strong>
            </div>

            <div className="calendar-analytics-bar-track">
                <div style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}

function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="calendar-analytics-empty">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}

export default function CalendarAnalytics({
    filters,
    generated_at,
    summary = {},
    block_usage = [],
    block_status_mix = [],
    weekday_usage = [],
    area_usage = [],
    busiest_dates = [],
    date_series = [],
}: Props) {
    const base = currentCalendarBase();
    const analyticsPath = `${base}/analytics`;

    const startDate = filters.start_date || '';
    const endDate = filters.end_date || '';

    const query = new URLSearchParams();

    if (startDate) query.set('start_date', startDate);
    if (endDate) query.set('end_date', endDate);

    const queryString = query.toString();
    const exportHref = queryString
        ? `${analyticsPath}/export?${queryString}`
        : `${analyticsPath}/export`;
    const printHref = queryString
        ? `${analyticsPath}/print?${queryString}`
        : `${analyticsPath}/print`;

    const totalActivity = getSummary(summary, [
        'total_activity',
        'activity_total',
    ]);
    const occupiedBlocks = getSummary(summary, [
        'occupied_blocks',
        'occupied_block_days',
    ]);
    const bookings = getSummary(summary, [
        'bookings',
        'booking_count',
        'total_bookings',
    ]);
    const calendarBlocks = getSummary(summary, [
        'calendar_blocks',
        'block_count',
    ]);
    const publicEvents = getSummary(summary, [
        'public_events',
        'public_event_count',
    ]);
    const rangeDays = getSummary(summary, ['range_days', 'total_days', 'days']);

    const maxBlockUsage = maxValue(block_usage, countValue);
    const maxStatusMix = maxValue(block_status_mix, countValue);
    const maxWeekday = maxValue(weekday_usage, countValue);
    const maxArea = maxValue(area_usage, (item) => numberValue(item.total));
    const maxDateActivity = maxValue(date_series, (item) =>
        numberValue(item.total_activity),
    );

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        router.get(
            analyticsPath,
            {
                start_date: String(form.get('start_date') || '') || undefined,
                end_date: String(form.get('end_date') || '') || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs()}>
            <Head title="Calendar Analytics" />

            <div className="backend-admin-page space-y-5">
                <section className="calendar-analytics-hero">
                    <div>
                        <p className="backend-booking-label">
                            Calendar Analytics
                        </p>
                        <h1>
                            Calendar activity, venue use, and occupancy
                            patterns.
                        </h1>
                        <span>
                            Review occupied time blocks, busiest dates, weekday
                            demand, area usage, public events, bookings, and
                            internal calendar blocks in one clean report.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={base} className="alh-secondary-button">
                            Calendar
                        </Link>

                        <Link
                            href={`${base}/manage`}
                            className="alh-secondary-button"
                        >
                            Manage
                        </Link>

                        <a href={exportHref} className="alh-secondary-button">
                            <Download className="h-4 w-4" />
                            Export
                        </a>

                        <a
                            href={printHref}
                            target="_blank"
                            rel="noreferrer"
                            className="alh-primary-button"
                        >
                            <FileText className="h-4 w-4" />
                            Print
                        </a>
                    </div>
                </section>

                <section className="calendar-analytics-filter">
                    <form
                        onSubmit={applyFilters}
                        className="calendar-analytics-filter-grid"
                    >
                        <label>
                            <span className="backend-booking-label">
                                Start Date
                            </span>
                            <input
                                type="date"
                                name="start_date"
                                defaultValue={startDate}
                                className="backend-booking-input"
                            />
                        </label>

                        <label>
                            <span className="backend-booking-label">
                                End Date
                            </span>
                            <input
                                type="date"
                                name="end_date"
                                defaultValue={endDate}
                                className="backend-booking-input"
                            />
                        </label>

                        <button
                            type="submit"
                            className="alh-primary-button justify-center"
                        >
                            <Search className="h-4 w-4" />
                            Apply Range
                        </button>

                        <Link
                            href={analyticsPath}
                            className="alh-secondary-button justify-center"
                        >
                            Reset
                        </Link>
                    </form>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total Activity"
                        value={totalActivity}
                        helper={`${rangeDays || 'Selected'} day range. Generated ${formatDateTime(generated_at)}.`}
                        icon={Activity}
                    />

                    <StatCard
                        label="Occupied Blocks"
                        value={occupiedBlocks}
                        helper="AM, PM, and EVE block-day usage from bookings and blocks."
                        icon={Layers3}
                    />

                    <StatCard
                        label="Bookings"
                        value={bookings}
                        helper="Booking records touching the selected date range."
                        icon={CalendarDays}
                    />

                    <StatCard
                        label="Public + Internal"
                        value={publicEvents + calendarBlocks}
                        helper={`${publicEvents} public events · ${calendarBlocks} internal blocks.`}
                        icon={BarChart3}
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-3">
                    <div className="calendar-analytics-panel">
                        <div className="calendar-analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Block Usage
                                </p>
                                <h2>AM / PM / EVE</h2>
                            </div>
                        </div>

                        <div className="grid gap-3 p-5">
                            {block_usage.length > 0 ? (
                                block_usage.map((row) => (
                                    <MiniBar
                                        key={countLabel(row)}
                                        label={cleanLabel(countLabel(row))}
                                        value={countValue(row)}
                                        max={maxBlockUsage}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    title="No block usage"
                                    description="Occupied block data will appear here."
                                />
                            )}
                        </div>
                    </div>

                    <div className="calendar-analytics-panel">
                        <div className="calendar-analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Status Mix
                                </p>
                                <h2>Calendar status</h2>
                            </div>
                        </div>

                        <div className="grid gap-3 p-5">
                            {block_status_mix.length > 0 ? (
                                block_status_mix.map((row) => (
                                    <MiniBar
                                        key={countLabel(row)}
                                        label={cleanLabel(countLabel(row))}
                                        value={countValue(row)}
                                        max={maxStatusMix}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    title="No status mix"
                                    description="Blocked/private/public status mix will appear here."
                                />
                            )}
                        </div>
                    </div>

                    <div className="calendar-analytics-panel">
                        <div className="calendar-analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Weekday Demand
                                </p>
                                <h2>Activity by day</h2>
                            </div>
                        </div>

                        <div className="grid gap-3 p-5">
                            {weekday_usage.length > 0 ? (
                                weekday_usage.map((row) => (
                                    <MiniBar
                                        key={countLabel(row)}
                                        label={cleanLabel(countLabel(row))}
                                        value={countValue(row)}
                                        max={maxWeekday}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    title="No weekday usage"
                                    description="Activity by weekday will appear here."
                                />
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <main className="calendar-analytics-panel overflow-hidden">
                        <div className="calendar-analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Area Utilization
                                </p>
                                <h2>Venue/area use</h2>
                                <span>
                                    Combines booking services, calendar blocks,
                                    and public event activity by area.
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {area_usage.length > 0 ? (
                                area_usage.map((row) => {
                                    const width = Math.max(
                                        4,
                                        Math.min(
                                            100,
                                            (numberValue(row.total) / maxArea) *
                                                100,
                                        ),
                                    );

                                    return (
                                        <article
                                            key={row.area}
                                            className="calendar-area-row"
                                        >
                                            <div className="min-w-0">
                                                <h3>{row.area}</h3>
                                                <p>
                                                    {row.bookings} booking
                                                    services ·{' '}
                                                    {row.calendar_blocks} blocks
                                                    · {row.public_events} public
                                                    events
                                                </p>
                                            </div>

                                            <div className="calendar-analytics-bar-track">
                                                <div
                                                    style={{
                                                        width: `${width}%`,
                                                    }}
                                                />
                                            </div>

                                            <strong>{row.total}</strong>
                                        </article>
                                    );
                                })
                            ) : (
                                <EmptyState
                                    title="No area utilization"
                                    description="Area usage will appear here when calendar data exists."
                                />
                            )}
                        </div>
                    </main>

                    <aside className="calendar-analytics-panel overflow-hidden">
                        <div className="calendar-analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Busiest Dates
                                </p>
                                <h2>Top activity days</h2>
                            </div>
                        </div>

                        <div className="grid gap-3 p-5">
                            {busiest_dates.length > 0 ? (
                                busiest_dates.slice(0, 10).map((row) => (
                                    <div
                                        key={row.date}
                                        className="calendar-busy-date-card"
                                    >
                                        <div>
                                            <strong>
                                                {formatDate(row.date)}
                                            </strong>
                                            <span>
                                                {row.bookings} bookings ·{' '}
                                                {row.calendar_blocks} blocks ·{' '}
                                                {row.public_events} public
                                                events
                                            </span>
                                        </div>

                                        <p>{row.total_activity}</p>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="No busy date data"
                                    description="The busiest calendar days will appear here."
                                />
                            )}
                        </div>
                    </aside>
                </section>

                <section className="calendar-analytics-panel overflow-hidden">
                    <div className="calendar-analytics-panel-header">
                        <div>
                            <p className="backend-booking-label">Date Series</p>
                            <h2>Daily activity timeline</h2>
                            <span>
                                Compact daily bars show how calendar load is
                                distributed across the selected range.
                            </span>
                        </div>

                        <TrendingUp className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {date_series.length > 0 ? (
                            date_series.map((row) => {
                                const width = Math.max(
                                    4,
                                    Math.min(
                                        100,
                                        (numberValue(row.total_activity) /
                                            maxDateActivity) *
                                            100,
                                    ),
                                );

                                return (
                                    <article
                                        key={row.date}
                                        className="calendar-date-row"
                                    >
                                        <div>
                                            <h3>{formatDate(row.date)}</h3>
                                            <p>
                                                {row.occupied_blocks} occupied
                                                blocks · {row.bookings} bookings
                                                · {row.calendar_blocks} blocks ·{' '}
                                                {row.public_events} public
                                                events
                                            </p>
                                        </div>

                                        <div className="calendar-analytics-bar-track">
                                            <div
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>

                                        <strong>{row.total_activity}</strong>
                                    </article>
                                );
                            })
                        ) : (
                            <EmptyState
                                title="No date series"
                                description="Daily activity rows will appear here after the report loads."
                            />
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
