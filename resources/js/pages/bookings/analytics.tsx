import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CalendarDays,
    CircleDollarSign,
    Download,
    FileText,
    Gauge,
    PieChart,
    Search,
    ShieldAlert,
    TrendingUp,
    Wallet,
} from 'lucide-react';

type Option = {
    id: number;
    name: string;
};

type Breakdown = {
    label: string;
    value: number;
};

type TrendPoint = {
    label: string;
    bookings: number;
    guests: number;
    confirmed_revenue: number;
};

type ServicePoint = {
    label: string;
    usage_count: number;
    revenue_total: number;
};

type WorkloadPoint = {
    label: string;
    bookings: number;
    guests: number;
};

type RiskBooking = {
    id: number;
    client_name: string;
    company_name: string;
    type_of_event: string;
    booking_status: string;
    payment_status: string;
    booking_date_from: string | null;
    booking_date_to: string | null;
    created_at: string | null;
    number_of_guests: number;
    items_total: number;
    submitted_total: number;
    confirmed_total: number;
    outstanding: number;
    policy?: {
        state?: string;
        label?: string;
        half_required?: number;
        half_paid_met?: boolean;
        fully_paid_met?: boolean;
        down_payment_due_at?: string | null;
        full_payment_due_at?: string | null;
        hours_since_created?: number | null;
    };
};

type Props = {
    filters: {
        q?: string;
        booking_status?: string;
        payment_status?: string;
        service_id?: string;
        date_from?: string;
        date_to?: string;
    };
    services: Option[];
    summary: {
        total_bookings: number;
        total_guests: number;
        pending: number;
        active: number;
        confirmed: number;
        completed: number;
        cancelled_declined: number;
        submitted_revenue: number;
        confirmed_revenue: number;
        outstanding_balance: number;
        due_24h_soon: number;
        due_24h_overdue: number;
        due_48h_soon: number;
        due_48h_overdue: number;
        half_paid_met: number;
        fully_paid_met: number;
        automation_events_7d: number;
        auto_declined_7d: number;
        auto_deleted_7d: number;
    };
    statusBreakdown: Breakdown[];
    paymentBreakdown: Breakdown[];
    monthlyTrend: TrendPoint[];
    upcomingWorkload: WorkloadPoint[];
    topServices: ServicePoint[];
    highRiskBookings: RiskBooking[];
};

function currentBookingsBase() {
    if (window.location.pathname.startsWith('/admin')) return '/admin/bookings';
    if (window.location.pathname.startsWith('/manager'))
        return '/manager/bookings';

    return '/bookings';
}

function breadcrumbs(): BreadcrumbItem[] {
    return [
        { title: 'Bookings', href: currentBookingsBase() },
        { title: 'Analytics', href: `${currentBookingsBase()}/analytics` },
    ];
}

function money(value: unknown) {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function numberValue(value: unknown) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function cleanLabel(value: unknown) {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function queryString(filters: Props['filters']) {
    const params = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ''
        ) {
            params.set(key, String(value));
        }
    });

    return params.toString();
}

function maxValue<T>(items: T[], getter: (item: T) => number) {
    return Math.max(1, ...items.map((item) => getter(item)));
}

function policyTone(state?: string) {
    const value = String(state || '').toLowerCase();

    if (value.includes('overdue')) return 'is-bad';
    if (value.includes('soon')) return 'is-warn';
    if (value.includes('watch')) return 'is-public';

    return 'is-good';
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
        <article className="analytics-kpi-card">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="backend-booking-label">{label}</p>
                    <p className="mt-3 text-3xl font-black tracking-[-0.055em] text-slate-950 dark:text-white">
                        {value}
                    </p>
                </div>

                <div className="alh-admin-kpi-icon">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {helper}
            </p>
        </article>
    );
}

function MiniBar({
    label,
    value,
    max,
    suffix,
}: {
    label: string;
    value: number;
    max: number;
    suffix?: string;
}) {
    const width = Math.max(4, Math.min(100, (value / Math.max(max, 1)) * 100));

    return (
        <div className="analytics-mini-bar">
            <div className="flex items-center justify-between gap-3">
                <span>{label}</span>
                <strong>
                    {value}
                    {suffix || ''}
                </strong>
            </div>

            <div className="analytics-mini-bar-track">
                <div style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}

function RevenueBar({
    label,
    bookings,
    guests,
    revenue,
    maxBookings,
    maxRevenue,
}: {
    label: string;
    bookings: number;
    guests: number;
    revenue: number;
    maxBookings: number;
    maxRevenue: number;
}) {
    const bookingWidth = Math.max(
        4,
        Math.min(100, (bookings / Math.max(maxBookings, 1)) * 100),
    );
    const revenueWidth = Math.max(
        4,
        Math.min(100, (revenue / Math.max(maxRevenue, 1)) * 100),
    );

    return (
        <article className="analytics-trend-row">
            <div>
                <p>{label}</p>
                <span>
                    {bookings} booking{bookings === 1 ? '' : 's'} · {guests}{' '}
                    guest
                    {guests === 1 ? '' : 's'}
                </span>
            </div>

            <div className="analytics-trend-bars">
                <div>
                    <span style={{ width: `${bookingWidth}%` }} />
                </div>
                <div>
                    <span style={{ width: `${revenueWidth}%` }} />
                </div>
            </div>

            <strong>{money(revenue)}</strong>
        </article>
    );
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="analytics-empty-state">
            <Icon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}

export default function BookingAnalytics({
    filters,
    services = [],
    summary,
    statusBreakdown = [],
    paymentBreakdown = [],
    monthlyTrend = [],
    upcomingWorkload = [],
    topServices = [],
    highRiskBookings = [],
}: Props) {
    const basePath = currentBookingsBase();
    const analyticsPath = `${basePath}/analytics`;
    const query = queryString(filters);
    const exportHref = query
        ? `${analyticsPath}/export?${query}`
        : `${analyticsPath}/export`;
    const printHref = query
        ? `${analyticsPath}/print?${query}`
        : `${analyticsPath}/print`;

    const maxStatus = maxValue(statusBreakdown, (item) =>
        numberValue(item.value),
    );
    const maxPayment = maxValue(paymentBreakdown, (item) =>
        numberValue(item.value),
    );
    const maxMonthlyBookings = maxValue(monthlyTrend, (item) =>
        numberValue(item.bookings),
    );
    const maxMonthlyRevenue = maxValue(monthlyTrend, (item) =>
        numberValue(item.confirmed_revenue),
    );
    const maxServiceUsage = maxValue(topServices, (item) =>
        numberValue(item.usage_count),
    );
    const maxWorkload = maxValue(upcomingWorkload, (item) =>
        numberValue(item.bookings),
    );

    function applyFilters(formData: FormData) {
        router.get(
            analyticsPath,
            {
                q: String(formData.get('q') || '') || undefined,
                booking_status:
                    String(formData.get('booking_status') || '') || undefined,
                payment_status:
                    String(formData.get('payment_status') || '') || undefined,
                service_id:
                    String(formData.get('service_id') || '') || undefined,
                date_from: String(formData.get('date_from') || '') || undefined,
                date_to: String(formData.get('date_to') || '') || undefined,
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
            <Head title="Booking Analytics" />

            <div className="backend-admin-page space-y-5">
                <section className="analytics-hero">
                    <div>
                        <p className="backend-booking-label">
                            Booking Analytics
                        </p>
                        <h1>
                            Booking performance, payments, workload, and
                            deadline risk.
                        </h1>
                        <span>
                            A compact monitoring page for reservation trends,
                            payment compliance, high-risk records, and
                            operational demand.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link href={basePath} className="alh-secondary-button">
                            Back to Bookings
                        </Link>

                        <a href={exportHref} className="alh-secondary-button">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </a>

                        <a
                            href={printHref}
                            target="_blank"
                            rel="noreferrer"
                            className="alh-primary-button"
                        >
                            <FileText className="h-4 w-4" />
                            Print Report
                        </a>
                    </div>
                </section>

                <section className="analytics-filter-panel">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters(new FormData(event.currentTarget));
                        }}
                        className="analytics-filter-grid"
                    >
                        <div className="relative lg:col-span-2">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                name="q"
                                defaultValue={filters.q || ''}
                                placeholder="Search client, company, email, event..."
                                className="backend-booking-input pl-10"
                            />
                        </div>

                        <select
                            name="booking_status"
                            defaultValue={filters.booking_status || ''}
                            className="backend-booking-input"
                        >
                            <option value="">All booking statuses</option>
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="declined">Declined</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            name="payment_status"
                            defaultValue={filters.payment_status || ''}
                            className="backend-booking-input"
                        >
                            <option value="">All payment statuses</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="owing">Owing</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                        </select>

                        <select
                            name="service_id"
                            defaultValue={filters.service_id || ''}
                            className="backend-booking-input"
                        >
                            <option value="">All venue/rental options</option>
                            {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>

                        <input
                            name="date_from"
                            type="date"
                            defaultValue={filters.date_from || ''}
                            className="backend-booking-input"
                            aria-label="Date from"
                        />

                        <input
                            name="date_to"
                            type="date"
                            defaultValue={filters.date_to || ''}
                            className="backend-booking-input"
                            aria-label="Date to"
                        />

                        <button
                            type="submit"
                            className="alh-primary-button justify-center"
                        >
                            Apply Filters
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
                        label="Filtered Bookings"
                        value={summary.total_bookings}
                        helper={`${summary.total_guests} total guests in the filtered result set.`}
                        icon={Gauge}
                    />

                    <StatCard
                        label="Confirmed Revenue"
                        value={money(summary.confirmed_revenue)}
                        helper={`Submitted total: ${money(summary.submitted_revenue)}.`}
                        icon={CircleDollarSign}
                    />

                    <StatCard
                        label="Outstanding Balance"
                        value={money(summary.outstanding_balance)}
                        helper={`${summary.half_paid_met} records reached the 50% threshold.`}
                        icon={Wallet}
                    />

                    <StatCard
                        label="Automation 7 Days"
                        value={summary.automation_events_7d}
                        helper={`${summary.auto_declined_7d} auto-declined · ${summary.auto_deleted_7d} auto-deleted.`}
                        icon={Activity}
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    <div className="analytics-panel">
                        <div className="analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Status Mix
                                </p>
                                <h2>Booking status distribution</h2>
                            </div>
                            <PieChart className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="grid gap-3 p-5">
                            {statusBreakdown.length > 0 ? (
                                statusBreakdown.map((item) => (
                                    <MiniBar
                                        key={item.label}
                                        label={cleanLabel(item.label)}
                                        value={numberValue(item.value)}
                                        max={maxStatus}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    icon={PieChart}
                                    title="No status data"
                                    description="Booking status distribution will appear when data exists."
                                />
                            )}
                        </div>
                    </div>

                    <div className="analytics-panel">
                        <div className="analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Payment Mix
                                </p>
                                <h2>Payment status distribution</h2>
                            </div>
                            <CircleDollarSign className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="grid gap-3 p-5">
                            {paymentBreakdown.length > 0 ? (
                                paymentBreakdown.map((item) => (
                                    <MiniBar
                                        key={item.label}
                                        label={cleanLabel(item.label)}
                                        value={numberValue(item.value)}
                                        max={maxPayment}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    icon={CircleDollarSign}
                                    title="No payment data"
                                    description="Payment status distribution will appear when data exists."
                                />
                            )}
                        </div>
                    </div>
                </section>

                <section className="analytics-panel overflow-hidden">
                    <div className="analytics-panel-header">
                        <div>
                            <p className="backend-booking-label">Trend</p>
                            <h2>Monthly bookings and confirmed revenue</h2>
                            <span>
                                Two-bar rows show booking volume and confirmed
                                revenue in the same period.
                            </span>
                        </div>
                        <TrendingUp className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {monthlyTrend.length > 0 ? (
                            monthlyTrend.map((item) => (
                                <RevenueBar
                                    key={item.label}
                                    label={item.label}
                                    bookings={numberValue(item.bookings)}
                                    guests={numberValue(item.guests)}
                                    revenue={numberValue(
                                        item.confirmed_revenue,
                                    )}
                                    maxBookings={maxMonthlyBookings}
                                    maxRevenue={maxMonthlyRevenue}
                                />
                            ))
                        ) : (
                            <EmptyState
                                icon={TrendingUp}
                                title="No monthly trend yet"
                                description="Monthly booking volume and revenue will appear here."
                            />
                        )}
                    </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <main className="analytics-panel overflow-hidden">
                        <div className="analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Service Demand
                                </p>
                                <h2>Top venue/rental options</h2>
                            </div>
                            <BarChart3 className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {topServices.length > 0 ? (
                                topServices.map((item) => (
                                    <article
                                        key={item.label}
                                        className="analytics-service-row"
                                    >
                                        <div>
                                            <h3>{item.label}</h3>
                                            <p>
                                                {item.usage_count} usage
                                                {item.usage_count === 1
                                                    ? ''
                                                    : 's'}{' '}
                                                · {money(item.revenue_total)}
                                            </p>
                                        </div>

                                        <div className="analytics-mini-bar-track">
                                            <div
                                                style={{
                                                    width: `${Math.max(
                                                        4,
                                                        Math.min(
                                                            100,
                                                            (numberValue(
                                                                item.usage_count,
                                                            ) /
                                                                maxServiceUsage) *
                                                                100,
                                                        ),
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <EmptyState
                                    icon={BarChart3}
                                    title="No service demand data"
                                    description="Top venue and rental option usage will appear here."
                                />
                            )}
                        </div>
                    </main>

                    <aside className="analytics-panel overflow-hidden">
                        <div className="analytics-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Upcoming
                                </p>
                                <h2>Workload forecast</h2>
                            </div>
                            <CalendarDays className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="grid gap-3 p-5">
                            {upcomingWorkload.length > 0 ? (
                                upcomingWorkload.map((item) => (
                                    <MiniBar
                                        key={item.label}
                                        label={`${item.label} · ${item.guests} guests`}
                                        value={numberValue(item.bookings)}
                                        max={maxWorkload}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    icon={CalendarDays}
                                    title="No upcoming workload"
                                    description="Upcoming booking workload will appear here."
                                />
                            )}
                        </div>
                    </aside>
                </section>

                <section className="analytics-panel overflow-hidden">
                    <div className="analytics-panel-header">
                        <div>
                            <p className="backend-booking-label">Risk Queue</p>
                            <h2>High-risk booking records</h2>
                            <span>
                                These are the bookings most likely to need
                                payment follow-up or lifecycle review.
                            </span>
                        </div>
                        <ShieldAlert className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {highRiskBookings.length > 0 ? (
                            highRiskBookings.map((booking) => (
                                <article
                                    key={booking.id}
                                    className="analytics-risk-row"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            <span
                                                className={`alh-status-chip ${policyTone(booking.policy?.state)}`}
                                            >
                                                {booking.policy?.label ||
                                                    cleanLabel(
                                                        booking.policy?.state ||
                                                            'Watch',
                                                    )}
                                            </span>
                                            <span className="booking-mini-pill">
                                                {cleanLabel(
                                                    booking.booking_status,
                                                )}
                                            </span>
                                            <span className="booking-mini-pill">
                                                {cleanLabel(
                                                    booking.payment_status,
                                                )}
                                            </span>
                                        </div>

                                        <h3>
                                            {booking.type_of_event ||
                                                `Booking #${booking.id}`}
                                        </h3>
                                        <p>
                                            {booking.company_name ||
                                                booking.client_name ||
                                                'Client'}{' '}
                                            ·{' '}
                                            {formatDateTime(
                                                booking.booking_date_from,
                                            )}
                                        </p>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                            <div className="alh-admin-mini-box">
                                                <span>Total</span>
                                                <strong>
                                                    {money(booking.items_total)}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Submitted</span>
                                                <strong>
                                                    {money(
                                                        booking.submitted_total,
                                                    )}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Confirmed</span>
                                                <strong>
                                                    {money(
                                                        booking.confirmed_total,
                                                    )}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Outstanding</span>
                                                <strong>
                                                    {money(booking.outstanding)}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`${basePath}/${booking.id}`}
                                        className="alh-primary-button"
                                    >
                                        Open
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </article>
                            ))
                        ) : (
                            <EmptyState
                                icon={AlertTriangle}
                                title="No high-risk bookings"
                                description="Bookings with payment deadline risk will appear here."
                            />
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
