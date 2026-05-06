import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    BellRing,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Eye,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    X,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type NotificationItem = {
    id: number | string;
    type?: string | null;
    title: string;
    message?: string | null;
    link?: string | null;
    read_at?: string | null;
    created_at?: string | null;
    is_unread?: boolean;
};

type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

type Feed = {
    data?: NotificationItem[];
    links?: PaginationLink[];
};

type Props = {
    notificationFeed?: Feed | NotificationItem[];
    notifications?: Feed | NotificationItem[];
    notificationFilters?: {
        q?: string;
        status?: 'all' | 'unread' | 'read' | string;
        kind?: string;
    };
    notificationStats?: {
        total?: number;
        unread?: number;
        read?: number;
        automation?: number;
        bookings?: number;
        payments?: number;
        calendar?: number;
        services?: number;
        users?: number;
        system?: number;
    };
    automationLatest?: Feed | NotificationItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

const kindOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'automation', label: 'Automation' },
    { value: 'bookings', label: 'Bookings' },
    { value: 'payments', label: 'Payments' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'services', label: 'Services' },
    { value: 'users', label: 'Users' },
    { value: 'system', label: 'System' },
];

function collection(value: unknown): NotificationItem[] {
    if (Array.isArray(value)) return value as NotificationItem[];

    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { data?: unknown[] }).data)
    ) {
        return (value as { data: NotificationItem[] }).data;
    }

    return [];
}

function linksOf(value: unknown): PaginationLink[] {
    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { links?: PaginationLink[] }).links)
    ) {
        return (value as { links: PaginationLink[] }).links;
    }

    return [];
}

function cleanLabel(value?: string | null) {
    return String(value || 'System')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactDateTime(value?: string | null) {
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

function notificationIcon(type?: string | null) {
    const normalized = String(type || '').toLowerCase();

    if (normalized.includes('payment')) return CreditCard;
    if (normalized.includes('booking')) return ShieldCheck;
    if (normalized.includes('calendar')) return CalendarDays;
    if (normalized.includes('automation')) return BellRing;
    if (normalized.includes('system')) return Settings;

    return Bell;
}

function typeClass(type?: string | null) {
    const normalized = String(type || '').toLowerCase();

    if (normalized.includes('payment')) return 'is-payment';
    if (normalized.includes('booking')) return 'is-booking';
    if (normalized.includes('calendar')) return 'is-calendar';
    if (normalized.includes('automation')) return 'is-automation';

    return '';
}

function paginationLabel(label?: string | null) {
    return String(label || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;|&raquo;/g, '')
        .trim();
}

function Pagination({ links }: { links: PaginationLink[] }) {
    if (!links.length) return null;

    return (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-5 dark:border-slate-800">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                            link.active
                                ? 'border-[#20242b] bg-[#20242b] text-white dark:border-white dark:bg-white dark:text-slate-950'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                        aria-label={paginationLabel(link.label)}
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/60"
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                ),
            )}
        </div>
    );
}

function StatCard({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    helper: string;
    icon: typeof Bell;
}) {
    return (
        <article className="notification-kpi">
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

export default function NotificationsIndex({
    notificationFeed,
    notifications,
    notificationFilters,
    notificationStats,
    automationLatest,
}: Props) {
    const feedSource = notificationFeed ?? notifications;
    const feed = useMemo(() => collection(feedSource), [feedSource]);
    const pageLinks = useMemo(() => linksOf(feedSource), [feedSource]);
    const automation = useMemo(
        () => collection(automationLatest),
        [automationLatest],
    );

    const [q, setQ] = useState(String(notificationFilters?.q ?? ''));
    const [status, setStatus] = useState(
        String(notificationFilters?.status ?? 'all'),
    );
    const [kind, setKind] = useState(
        String(notificationFilters?.kind ?? 'all'),
    );

    const stats = notificationStats ?? {};
    const unreadCount =
        stats.unread ??
        feed.filter((item) => item.is_unread || !item.read_at).length;
    const readCount =
        stats.read ??
        feed.filter((item) => !item.is_unread && item.read_at).length;

    function applyFilters(event?: FormEvent<HTMLFormElement>) {
        event?.preventDefault();

        router.get(
            '/notifications',
            {
                q: q || undefined,
                status: status && status !== 'all' ? status : undefined,
                kind: kind && kind !== 'all' ? kind : undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setQ('');
        setStatus('all');
        setKind('all');

        router.get(
            '/notifications',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function markAllRead() {
        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="backend-admin-page space-y-5">
                <section className="notification-hero">
                    <div>
                        <p className="backend-booking-label">Notifications</p>
                        <h1>
                            System alerts, automation notices, and booking
                            updates.
                        </h1>
                        <span>
                            Review all recent BCCC EASE notifications in one
                            page. Filter by unread, automation, booking,
                            payment, calendar, service, user, or system
                            messages.
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={markAllRead}
                        className="alh-primary-button"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark All Read
                    </button>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total"
                        value={stats.total ?? feed.length}
                        helper="All notifications in the filtered feed."
                        icon={Bell}
                    />
                    <StatCard
                        label="Unread"
                        value={unreadCount}
                        helper="Messages still requiring attention."
                        icon={BellRing}
                    />
                    <StatCard
                        label="Read"
                        value={readCount}
                        helper="Already opened or marked read."
                        icon={CheckCircle2}
                    />
                    <StatCard
                        label="Automation"
                        value={stats.automation ?? automation.length}
                        helper="Lifecycle automation notifications."
                        icon={Sparkles}
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <main className="notification-panel overflow-hidden">
                        <div className="notification-panel-header">
                            <div>
                                <p className="backend-booking-label">Feed</p>
                                <h2>
                                    {feed.length} visible notification
                                    {feed.length === 1 ? '' : 's'}
                                </h2>
                                <span>
                                    Notifications are grouped into clean action
                                    rows for faster review.
                                </span>
                            </div>
                        </div>

                        <form
                            onSubmit={applyFilters}
                            className="notification-filter-grid"
                        >
                            <div className="relative xl:col-span-2">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={q}
                                    onChange={(event) =>
                                        setQ(event.target.value)
                                    }
                                    className="backend-booking-input pl-10"
                                    placeholder="Search notification title or message..."
                                />
                            </div>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="backend-booking-input"
                            >
                                <option value="all">All statuses</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                            </select>

                            <select
                                value={kind}
                                onChange={(event) =>
                                    setKind(event.target.value)
                                }
                                className="backend-booking-input"
                            >
                                {kindOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                className="alh-primary-button justify-center"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="alh-secondary-button justify-center"
                            >
                                <X className="h-4 w-4" />
                                Reset
                            </button>
                        </form>

                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {feed.length > 0 ? (
                                feed.map((item) => {
                                    const Icon = notificationIcon(item.type);
                                    const unread =
                                        item.is_unread || !item.read_at;

                                    return (
                                        <article
                                            key={item.id}
                                            className={`notification-row ${unread ? 'is-unread' : ''}`}
                                        >
                                            <div
                                                className={`notification-row-icon ${typeClass(item.type)}`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap gap-2">
                                                    <span
                                                        className={`alh-status-chip ${unread ? 'is-warn' : 'is-good'}`}
                                                    >
                                                        {unread
                                                            ? 'Unread'
                                                            : 'Read'}
                                                    </span>
                                                    <span className="booking-mini-pill">
                                                        {cleanLabel(item.type)}
                                                    </span>
                                                    <span className="booking-mini-pill">
                                                        <Clock3 className="h-3.5 w-3.5" />
                                                        {compactDateTime(
                                                            item.created_at,
                                                        )}
                                                    </span>
                                                </div>

                                                <h3>{item.title}</h3>
                                                {item.message ? (
                                                    <p>{item.message}</p>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-2 xl:justify-end">
                                                <Link
                                                    href={`/notifications/${item.id}/open`}
                                                    className="alh-primary-button"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Open
                                                </Link>

                                                {item.link ? (
                                                    <a
                                                        href={item.link}
                                                        className="alh-secondary-button"
                                                    >
                                                        Direct Link
                                                    </a>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })
                            ) : (
                                <div className="ops-empty-state">
                                    <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                    <h3>No notifications found</h3>
                                    <p>
                                        System and booking notifications will
                                        appear here when available.
                                    </p>
                                </div>
                            )}
                        </div>

                        <Pagination links={pageLinks} />
                    </main>

                    <aside className="space-y-5">
                        <section className="notification-panel overflow-hidden">
                            <div className="notification-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Automation Latest
                                    </p>
                                    <h2>Recent automation</h2>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5">
                                {automation.length > 0 ? (
                                    automation.map((item) => {
                                        const Icon = notificationIcon(
                                            item.type,
                                        );

                                        return (
                                            <Link
                                                key={item.id}
                                                href={`/notifications/${item.id}/open`}
                                                className="notification-side-card"
                                            >
                                                <Icon className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                                <span>
                                                    <strong>
                                                        {item.title}
                                                    </strong>
                                                    <small>
                                                        {compactDateTime(
                                                            item.created_at,
                                                        )}
                                                    </small>
                                                </span>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <div className="ops-empty-state !p-8">
                                        <Sparkles className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-700" />
                                        <h3>No automation alerts</h3>
                                        <p>
                                            Lifecycle notifications will appear
                                            here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="notification-panel overflow-hidden">
                            <div className="notification-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Breakdown
                                    </p>
                                    <h2>Types</h2>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5">
                                {[
                                    ['Bookings', stats.bookings ?? 0],
                                    ['Payments', stats.payments ?? 0],
                                    ['Calendar', stats.calendar ?? 0],
                                    ['Services', stats.services ?? 0],
                                    ['Users', stats.users ?? 0],
                                    ['System', stats.system ?? 0],
                                ].map(([label, value]) => (
                                    <div
                                        key={String(label)}
                                        className="alh-admin-mini-box"
                                    >
                                        <span>{label}</span>
                                        <strong>{value}</strong>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </AppLayout>
    );
}
