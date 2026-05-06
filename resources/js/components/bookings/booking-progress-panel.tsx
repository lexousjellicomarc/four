import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    CreditCard,
    FileImage,
    Flag,
    ReceiptText,
    ShieldAlert,
    UserCircle2,
} from 'lucide-react';

type BookingItem = {
    service_id?: number | null;
    service_name?: string | null;
    area?: string | null;
    line_total?: number | null;
};

type BookingPayment = {
    id: number;
    status?: string | null;
    payment_method?: string | null;
    payment_gateway?: string | null;
    payment_type?: string | null;
    amount?: number | null;
    transaction_reference?: string | null;
    remarks?: string | null;
    proof_image_url?: string | null;
    payer_name?: string | null;
    card_last_four?: string | null;
    marketing_consent?: boolean | null;
    paid_at?: string | null;
    created_at?: string | null;
};

type BookingLifecycleEvent = {
    id: number;
    event_key?: string | null;
    title?: string | null;
    from_status?: string | null;
    to_status?: string | null;
    from_payment_status?: string | null;
    to_payment_status?: string | null;
    reason?: string | null;
    meta?: Record<string, unknown> | null;
    event_at?: string | null;
    created_at?: string | null;
    actor?: {
        id?: number | null;
        name?: string | null;
        email?: string | null;
    } | null;
};

type BookingPayload = {
    id: number;
    company_name?: string | null;
    client_name?: string | null;
    client_contact_number?: string | null;
    client_email?: string | null;
    survey_email?: string | null;
    survey_proof_image_url?: string | null;
    client_address?: string | null;
    head_of_organization?: string | null;
    type_of_event?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    number_of_guests?: number | null;
    booking_status?: string | null;
    payment_status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    items?: BookingItem[];
    payments?: BookingPayment[];
    lifecycle_events?: BookingLifecycleEvent[];
    totals?: {
        items_total?: number | null;
        submitted_payments_total?: number | null;
        confirmed_payments_total?: number | null;
        remaining_balance?: number | null;
    } | null;
};

type Props = {
    booking: BookingPayload;
    compact?: boolean;
};

function formatMoney(value?: number | null) {
    return Number(value ?? 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function statusPill(status?: string | null) {
    const value = String(status ?? '').toLowerCase();
    const map: Record<string, string> = {
        pending:
            'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
        active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100',
        confirmed:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
        completed:
            'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100',
        declined:
            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
        cancelled:
            'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
        deleted: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
        unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
        partial:
            'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
        paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
        failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
        refunded:
            'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
        owing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100',
    };

    return cn(
        'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase',
        map[value] ??
            'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
    );
}

function latestPayment(payments?: BookingPayment[]) {
    const list = [...(payments ?? [])].filter(
        (payment) => payment.created_at || payment.paid_at,
    );
    list.sort((a, b) => {
        const aTime = new Date(a.paid_at ?? a.created_at ?? '').getTime();
        const bTime = new Date(b.paid_at ?? b.created_at ?? '').getTime();
        return bTime - aTime;
    });
    return list[0] ?? null;
}

function stepsForBooking(booking: BookingPayload) {
    const bookingStatus = String(
        booking.booking_status ?? 'pending',
    ).toLowerCase();
    const paymentStatus = String(
        booking.payment_status ?? 'unpaid',
    ).toLowerCase();
    const hasProof = Boolean(booking.survey_proof_image_url);
    const payments = booking.payments ?? [];
    const hasPaymentSubmission = payments.length > 0;
    const hasConfirmedPayment = payments.some(
        (payment) => String(payment.status ?? '').toLowerCase() === 'confirmed',
    );

    const doneStatuses = new Set(['active', 'confirmed', 'completed']);
    const completeStatuses = new Set(['completed']);

    return [
        {
            key: 'created',
            title: 'Booking submitted',
            description: booking.created_at
                ? `Recorded on ${formatDateTime(booking.created_at)}`
                : 'Booking record has been created.',
            complete: true,
            icon: ClipboardList,
        },
        {
            key: 'survey',
            title: 'Survey proof ready',
            description: hasProof
                ? 'Survey proof image is attached.'
                : 'Survey proof image is still missing or not yet replaced.',
            complete: hasProof,
            icon: FileImage,
        },
        {
            key: 'payment-submitted',
            title: 'Payment submitted',
            description: hasPaymentSubmission
                ? `${payments.length} payment entr${payments.length > 1 ? 'ies' : 'y'} recorded.`
                : 'No payment submission has been recorded yet.',
            complete: hasPaymentSubmission,
            icon: ReceiptText,
        },
        {
            key: 'payment-confirmed',
            title: 'Payment confirmed',
            description:
                hasConfirmedPayment || paymentStatus === 'paid'
                    ? 'At least one payment is already confirmed.'
                    : 'Payment confirmation is still pending.',
            complete:
                hasConfirmedPayment ||
                paymentStatus === 'paid' ||
                paymentStatus === 'partial',
            icon: CreditCard,
        },
        {
            key: 'status-progress',
            title: 'Booking approved / active',
            description: doneStatuses.has(bookingStatus)
                ? `Current booking status is ${bookingStatus}.`
                : 'Booking is still waiting for full operational approval.',
            complete: doneStatuses.has(bookingStatus),
            icon: Flag,
        },
        {
            key: 'completed',
            title: 'Booking completed',
            description: completeStatuses.has(bookingStatus)
                ? 'Booking has been marked completed.'
                : 'Booking has not yet been completed.',
            complete: completeStatuses.has(bookingStatus),
            icon: CheckCircle2,
        },
    ];
}

function fallbackTimelineEntries(booking: BookingPayload) {
    const entries: Array<{
        key: string;
        title: string;
        when: string;
        note: string;
        tone?: string;
        icon: typeof CalendarDays;
    }> = [];

    if (booking.created_at) {
        entries.push({
            key: 'created',
            title: 'Booking record created',
            when: formatDateTime(booking.created_at),
            note: `Client: ${booking.client_name ?? '—'} • Event: ${booking.type_of_event ?? '—'}`,
            tone: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20',
            icon: ClipboardList,
        });
    }

    if (booking.survey_proof_image_url) {
        entries.push({
            key: 'proof',
            title: 'Survey proof available',
            when: booking.updated_at
                ? formatDateTime(booking.updated_at)
                : 'Attached',
            note: booking.survey_email
                ? `Survey email: ${booking.survey_email}`
                : 'Survey proof image is attached.',
            tone: 'border-sky-200 bg-sky-50 dark:border-sky-900/30 dark:bg-sky-950/20',
            icon: FileImage,
        });
    }

    (booking.payments ?? []).forEach((payment) => {
        entries.push({
            key: `payment-${payment.id}`,
            title: `Payment ${String(payment.status ?? 'submitted').toUpperCase()}`,
            when: formatDateTime(payment.paid_at ?? payment.created_at),
            note: `₱ ${formatMoney(payment.amount)} • ${payment.payment_gateway ?? payment.payment_method ?? 'payment'}${payment.transaction_reference ? ` • Ref ${payment.transaction_reference}` : ''}`,
            tone:
                String(payment.status ?? '').toLowerCase() === 'confirmed'
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20',
            icon: CreditCard,
        });
    });

    if (booking.booking_date_from || booking.booking_date_to) {
        entries.push({
            key: 'schedule',
            title: 'Scheduled event window',
            when: formatDateTime(booking.booking_date_from),
            note: `${formatDateTime(booking.booking_date_from)} → ${formatDateTime(booking.booking_date_to)}`,
            tone: 'border-violet-200 bg-violet-50 dark:border-violet-900/30 dark:bg-violet-950/20',
            icon: CalendarDays,
        });
    }

    return entries;
}

function lifecycleTone(event: BookingLifecycleEvent) {
    const key = String(event.event_key ?? '').toLowerCase();
    const toStatus = String(event.to_status ?? '').toLowerCase();

    if (key.includes('auto_deleted') || toStatus === 'deleted') {
        return 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20';
    }

    if (key.includes('payment') || event.to_payment_status) {
        return 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20';
    }

    if (
        toStatus === 'confirmed' ||
        toStatus === 'active' ||
        toStatus === 'completed'
    ) {
        return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20';
    }

    if (toStatus === 'declined' || toStatus === 'cancelled') {
        return 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20';
    }

    return 'border-sky-200 bg-sky-50 dark:border-sky-900/30 dark:bg-sky-950/20';
}

function lifecycleIcon(event: BookingLifecycleEvent) {
    const key = String(event.event_key ?? '').toLowerCase();
    const toStatus = String(event.to_status ?? '').toLowerCase();

    if (key.includes('payment')) return CreditCard;
    if (key.includes('created')) return ClipboardList;
    if (key.includes('updated')) return ShieldAlert;
    if (toStatus === 'completed') return CheckCircle2;
    if (toStatus === 'active') return Clock3;
    if (
        toStatus === 'declined' ||
        toStatus === 'cancelled' ||
        toStatus === 'deleted'
    )
        return Flag;
    return CalendarDays;
}

function buildAuditEntries(booking: BookingPayload) {
    const lifecycle = [...(booking.lifecycle_events ?? [])]
        .filter((entry) => entry.event_at || entry.created_at)
        .sort((a, b) => {
            const aTime = new Date(a.event_at ?? a.created_at ?? '').getTime();
            const bTime = new Date(b.event_at ?? b.created_at ?? '').getTime();
            return aTime - bTime;
        });

    if (lifecycle.length === 0) {
        return fallbackTimelineEntries(booking);
    }

    return lifecycle.map((event) => {
        const Icon = lifecycleIcon(event);
        const changes: string[] = [];

        if (event.from_status || event.to_status) {
            changes.push(
                `Status: ${event.from_status ?? '—'} → ${event.to_status ?? '—'}`,
            );
        }

        if (event.from_payment_status || event.to_payment_status) {
            changes.push(
                `Payment: ${event.from_payment_status ?? '—'} → ${event.to_payment_status ?? '—'}`,
            );
        }

        const actorName =
            event.actor?.name || event.actor?.email || 'System automation';
        const reason = event.reason ? `${event.reason}` : '';
        const note = [reason, changes.join(' • '), `Actor: ${actorName}`]
            .filter(Boolean)
            .join(' • ');

        return {
            key: `lifecycle-${event.id}`,
            title: event.title || 'Lifecycle event',
            when: formatDateTime(event.event_at ?? event.created_at),
            note,
            tone: lifecycleTone(event),
            icon: Icon,
        };
    });
}

export default function BookingProgressPanel({
    booking,
    compact = false,
}: Props) {
    const itemsTotal = Number(booking.totals?.items_total ?? 0);
    const submittedTotal = Number(
        booking.totals?.submitted_payments_total ?? 0,
    );
    const confirmedTotal = Number(
        booking.totals?.confirmed_payments_total ?? 0,
    );
    const outstanding = Math.max(
        Number(
            booking.totals?.remaining_balance ?? itemsTotal - confirmedTotal,
        ),
        0,
    );
    const auditEntries = buildAuditEntries(booking);
    const latest = latestPayment(booking.payments);
    const steps = stepsForBooking(booking);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Booking progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.key} className="flex gap-3">
                                <div
                                    className={cn(
                                        'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                        step.complete
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="font-medium">
                                            {step.title}
                                        </div>
                                        <span
                                            className={statusPill(
                                                step.complete
                                                    ? 'confirmed'
                                                    : 'pending',
                                            )}
                                        >
                                            {step.complete ? 'Done' : 'Waiting'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Financial snapshot</CardTitle>
                </CardHeader>
                <CardContent
                    className={cn(
                        'grid gap-3',
                        compact ? 'grid-cols-1' : 'grid-cols-2',
                    )}
                >
                    <div className="rounded-2xl border p-4">
                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                            Items total
                        </div>
                        <div className="mt-2 text-2xl font-semibold">
                            ₱ {formatMoney(itemsTotal)}
                        </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                            Submitted payments
                        </div>
                        <div className="mt-2 text-2xl font-semibold">
                            ₱ {formatMoney(submittedTotal)}
                        </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                            Confirmed payments
                        </div>
                        <div className="mt-2 text-2xl font-semibold">
                            ₱ {formatMoney(confirmedTotal)}
                        </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                            Outstanding
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-400">
                            ₱ {formatMoney(outstanding)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Latest payment activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {latest ? (
                        <div className="rounded-2xl border p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="font-medium">
                                    ₱ {formatMoney(latest.amount)} •{' '}
                                    {latest.payment_gateway ??
                                        latest.payment_method ??
                                        'Payment'}
                                </div>
                                <span className={statusPill(latest.status)}>
                                    {latest.status ?? 'submitted'}
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                {formatDateTime(
                                    latest.paid_at ?? latest.created_at,
                                )}
                            </div>
                            {latest.transaction_reference ? (
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Reference: {latest.transaction_reference}
                                </div>
                            ) : null}
                            {latest.payer_name ? (
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Payer: {latest.payer_name}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                            No payment activity recorded yet.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Lifecycle audit trail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {auditEntries.length > 0 ? (
                        auditEntries.map((entry) => {
                            const Icon = entry.icon;
                            return (
                                <div
                                    key={entry.key}
                                    className={cn(
                                        'rounded-2xl border p-4',
                                        entry.tone,
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 rounded-full bg-white/80 p-2 text-slate-700 dark:bg-white/10 dark:text-white">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium">
                                                {entry.title}
                                            </div>
                                            <div className="mt-1 text-xs tracking-[0.16em] text-muted-foreground uppercase">
                                                {entry.when}
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                                {entry.note}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                            No lifecycle audit entries are available yet.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Survey proof state</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <FileImage className="h-4 w-4" />
                            <div className="font-medium">
                                {booking.survey_proof_image_url
                                    ? 'Proof available'
                                    : 'Proof missing'}
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                            {booking.survey_proof_image_url
                                ? `Survey email: ${booking.survey_email ?? '—'}`
                                : 'The lifecycle panel can still show the booking, but staff should verify the survey proof upload.'}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Quick status snapshot</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border p-4">
                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                            Booking status
                        </div>
                        <div className="mt-2">
                            <span
                                className={statusPill(booking.booking_status)}
                            >
                                {booking.booking_status ?? '—'}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                            Payment status
                        </div>
                        <div className="mt-2">
                            <span
                                className={statusPill(booking.payment_status)}
                            >
                                {booking.payment_status ?? '—'}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                            Event window
                        </div>
                        <div className="mt-2 text-sm">
                            {formatDateTime(booking.booking_date_from)} →{' '}
                            {formatDateTime(booking.booking_date_to)}
                        </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                        <div className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                            Client
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <UserCircle2 className="h-4 w-4" />
                            <span>
                                {booking.client_name ??
                                    booking.company_name ??
                                    '—'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
