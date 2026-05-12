import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    CalendarClock,
    ChevronDown,
    CreditCard,
    MessageSquareText,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type NotificationSummary = {
    totalUnread?: number;
    newInquiries?: number;
    pendingBookings?: number;
    pendingPayments?: number;
};

type PageProps = {
    notificationSummary?: NotificationSummary;
};

function count(value?: number) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

function currentRoleBase() {
    if (typeof window === 'undefined') {
        return '/admin';
    }

    const path = window.location.pathname;

    if (path.startsWith('/manager')) {
        return '/manager';
    }

    if (path.startsWith('/staff')) {
        return '/staff';
    }

    return '/admin';
}

function hrefFor(type: 'inquiries' | 'bookings' | 'payments') {
    const base = currentRoleBase();

    if (type === 'inquiries') {
        return `${base}/inquiries`;
    }

    if (type === 'payments') {
        return base === '/staff' ? '/staff/bookings' : `${base}/payments/review`;
    }

    return `${base}/bookings`;
}

export default function BackendNotificationBell() {
    const { props } = usePage<PageProps>();
    const [open, setOpen] = useState(false);

    const summary = props.notificationSummary ?? {};

    const items = useMemo(
        () => [
            {
                label: 'Public inquiries',
                description: 'Messages submitted from the public contact page.',
                value: count(summary.newInquiries),
                href: hrefFor('inquiries'),
                icon: MessageSquareText,
            },
            {
                label: 'Pending bookings',
                description: 'Booking requests waiting for review.',
                value: count(summary.pendingBookings),
                href: hrefFor('bookings'),
                icon: CalendarClock,
            },
            {
                label: 'Payment review',
                description: 'Submitted proofs requiring verification.',
                value: count(summary.pendingPayments),
                href: hrefFor('payments'),
                icon: CreditCard,
            },
        ],
        [summary.newInquiries, summary.pendingBookings, summary.pendingPayments],
    );

    const total =
        count(summary.totalUnread) ||
        items.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white/78 text-[#2f2517] shadow-[0_14px_34px_rgba(47,37,23,0.09)] transition hover:-translate-y-0.5 hover:border-[#b08d48]/70 hover:bg-white dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                aria-label="Open notifications"
                aria-expanded={open}
            >
                <Bell className="h-4 w-4" />

                {total > 0 ? (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-[0_10px_24px_rgba(225,29,72,0.35)]">
                        {total > 99 ? '99+' : total}
                    </span>
                ) : null}
            </button>

            <AnimatePresence>
                {open ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full z-[90] mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-[1.35rem] border border-[#d9c7a6]/70 bg-white/96 p-2 shadow-[0_24px_70px_rgba(47,37,23,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/96"
                    >
                        <div className="rounded-[1rem] bg-[#f7f0e3] p-3 dark:bg-white/7">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                        Notifications
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-[#21180d] dark:text-white">
                                        {total > 0
                                            ? `${total} item${total === 1 ? '' : 's'} need attention`
                                            : 'No urgent notifications'}
                                    </p>
                                </div>

                                <ChevronDown className="h-4 w-4 text-[#7a6b55] dark:text-white/42" />
                            </div>
                        </div>

                        <div className="mt-2 grid gap-1">
                            {items.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-start gap-3 rounded-[1rem] px-3 py-3 transition hover:bg-[#f7f0e3] dark:hover:bg-white/8"
                                    >
                                        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                            <Icon className="h-4 w-4" />

                                            {item.value > 0 ? (
                                                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-600 ring-2 ring-white dark:ring-[#101419]" />
                                            ) : null}
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="truncate text-sm font-semibold text-[#21180d] dark:text-white">
                                                    {item.label}
                                                </span>

                                                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#7a5a24] dark:bg-white/10 dark:text-[#f1d89b]">
                                                    {item.value}
                                                </span>
                                            </span>

                                            <span className="mt-1 block text-xs leading-5 text-[#6e604c] dark:text-white/52">
                                                {item.description}
                                            </span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
