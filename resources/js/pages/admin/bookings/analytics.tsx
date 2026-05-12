import {
    ResourceActionLink,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    BarChart3,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileBarChart,
} from 'lucide-react';

type AnalyticsSummary = {
    total_bookings?: number;
    totalBookings?: number;
    pending_bookings?: number;
    pendingBookings?: number;
    approved_bookings?: number;
    approvedBookings?: number;
    completed_bookings?: number;
    completedBookings?: number;
    revenue?: number | string;
    total_revenue?: number | string;
    totalRevenue?: number | string;
};

type StatusCount = {
    label?: string;
    booking_status?: string;
    status?: string;
    total?: number;
    count?: number;
};

type MonthlyCount = {
    month?: string;
    label?: string;
    total?: number;
    count?: number;
};

type PageProps = {
    summary?: AnalyticsSummary;
    statusCounts?: StatusCount[];
    monthly?: MonthlyCount[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Analytics', href: '/admin/bookings/analytics' },
];

function money(value?: number | string) {
    const numeric = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(Number.isFinite(numeric) ? numeric : 0);
}

function cleanStatus(value?: string) {
    return String(value || 'Unknown')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function maxValue(items: Array<{ value: number }>) {
    return Math.max(...items.map((item) => item.value), 1);
}

export default function AdminBookingAnalytics() {
    const { props } = usePage<PageProps>();
    const summary = props.summary ?? {};

    const total = summary.total_bookings ?? summary.totalBookings ?? 0;
    const pending = summary.pending_bookings ?? summary.pendingBookings ?? 0;
    const approved = summary.approved_bookings ?? summary.approvedBookings ?? 0;
    const completed = summary.completed_bookings ?? summary.completedBookings ?? 0;
    const revenue = summary.total_revenue ?? summary.totalRevenue ?? summary.revenue ?? 0;

    const statusCounts = (props.statusCounts ?? []).map((item) => ({
        label: cleanStatus(item.label || item.booking_status || item.status),
        value: Number(item.total ?? item.count ?? 0),
    }));

    const monthly = (props.monthly ?? []).map((item, index) => ({
        label: item.month || item.label || `Month ${index + 1}`,
        value: Number(item.total ?? item.count ?? 0),
    }));

    const statusMax = maxValue(statusCounts);
    const monthlyMax = maxValue(monthly);

    return (
        <ResourcePageShell
            title="Booking Analytics"
            eyebrow="Review & Reports"
            icon={BarChart3}
            breadcrumbs={breadcrumbs}
            subtitle="Monitor booking volume, status distribution, and operational metrics."
            actions={
                <>
                    <ResourceActionLink href="/admin/bookings" variant="secondary">
                        Bookings
                    </ResourceActionLink>

                    <ResourceActionLink href="/admin/reports/mice-registry">
                        MICE Registry
                    </ResourceActionLink>
                </>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <ResourceStatCard
                    label="Total Bookings"
                    value={total}
                    description="All tracked booking records."
                    icon={CalendarDays}
                />

                <ResourceStatCard
                    label="Pending"
                    value={pending}
                    description="Requests needing action."
                    icon={Clock3}
                />

                <ResourceStatCard
                    label="Approved"
                    value={approved}
                    description="Approved or active bookings."
                    icon={CheckCircle2}
                />

                <ResourceStatCard
                    label="Completed"
                    value={completed}
                    description="Finished booking records."
                    icon={FileBarChart}
                />

                <ResourceStatCard
                    label="Revenue"
                    value={money(revenue)}
                    description="Reported payment total."
                    icon={CreditCard}
                />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <ResourceSection
                    title="Status distribution"
                    eyebrow="Booking Status"
                    description="A compact operational view of booking lifecycle distribution."
                >
                    {statusCounts.length === 0 ? (
                        <EmptyChart message="No status analytics available." />
                    ) : (
                        <div className="grid gap-3">
                            {statusCounts.map((item, index) => (
                                <BarRow
                                    key={`${item.label}-${index}`}
                                    label={item.label}
                                    value={item.value}
                                    max={statusMax}
                                />
                            ))}
                        </div>
                    )}
                </ResourceSection>

                <ResourceSection
                    title="Monthly booking trend"
                    eyebrow="Monthly"
                    description="Monthly booking totals for quick reporting checks."
                >
                    {monthly.length === 0 ? (
                        <EmptyChart message="No monthly analytics available." />
                    ) : (
                        <div className="grid gap-3">
                            {monthly.slice(0, 12).map((item, index) => (
                                <BarRow
                                    key={`${item.label}-${index}`}
                                    label={item.label}
                                    value={item.value}
                                    max={monthlyMax}
                                />
                            ))}
                        </div>
                    )}
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}

function EmptyChart({ message }: { message: string }) {
    return (
        <p className="rounded-[1.25rem] border border-dashed border-[#d9c7a6]/80 bg-[#fffaf0]/58 p-6 text-center text-sm font-semibold text-[#21180d] dark:border-white/10 dark:bg-white/[0.035] dark:text-white">
            {message}
        </p>
    );
}

function BarRow({
    label,
    value,
    max,
}: {
    label: string;
    value: number;
    max: number;
}) {
    const width = `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`;

    return (
        <article className="rounded-[1.1rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#21180d] dark:text-white">
                    {label}
                </p>

                <p className="text-xl font-semibold text-[#21180d] dark:text-white">
                    {value}
                </p>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#eadcc2] dark:bg-white/10">
                <div
                    className="h-full rounded-full bg-[#2f2517] dark:bg-[#f1d89b]"
                    style={{ width }}
                />
            </div>
        </article>
    );
}
