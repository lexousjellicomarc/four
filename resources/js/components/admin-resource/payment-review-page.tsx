import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    CreditCard,
    ExternalLink,
    Eye,
    Filter,
    Loader2,
    Search,
    ShieldAlert,
    Wallet,
    X,
    XCircle,
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';

type PaymentRecord = {
    id: number | string;
    booking_id?: number | string | null;
    booking?: {
        id?: number | string;
        client_name?: string | null;
        company_name?: string | null;
        client_email?: string | null;
        type_of_event?: string | null;
        booking_status?: string | null;
        payment_status?: string | null;
        booking_date_from?: string | null;
        booking_date_to?: string | null;
    } | null;
    amount?: number | string | null;
    status?: string | null;
    payment_method?: string | null;
    payment_gateway?: string | null;
    payment_type?: string | null;
    transaction_reference?: string | null;
    remarks?: string | null;
    payer_name?: string | null;
    card_holder_name?: string | null;
    card_last_four?: string | null;
    proof_image_url?: string | null;
    paid_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    deadline?: {
        state?: string | null;
        label?: string | null;
        submitted_total?: number | string | null;
        confirmed_total?: number | string | null;
    } | null;
    totals?: {
        items_total?: number | string | null;
        submitted_payments_total?: number | string | null;
        confirmed_payments_total?: number | string | null;
        remaining_balance?: number | string | null;
    } | null;
};

type PageProps = {
    workspaceRole?: string;
    payments?: unknown;
    paymentProofs?: unknown;
    records?: unknown;
    filters?: {
        q?: string;
        status?: string;
        gateway?: string;
        payment_type?: string;
        booking_status?: string;
        deadline?: string;
    };
    stats?: {
        all?: number;
        pending?: number;
        confirmed?: number;
        failed?: number;
        declined?: number;
        refunded?: number;
        review_needed?: number;
        due_soon?: number;
        overdue?: number;
    };
};

type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

function currentWorkspaceRole() {
    const path = window.location.pathname;

    if (path.startsWith('/manager')) return 'manager';
    if (path.startsWith('/staff')) return 'staff';

    return 'admin';
}

function normalizeRole(role?: string | null) {
    const value = String(role || currentWorkspaceRole()).toLowerCase();

    if (value.includes('manager')) return 'manager';
    if (value.includes('staff')) return 'staff';

    return 'admin';
}

function collection<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];

    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { data?: unknown[] }).data)
    ) {
        return (value as { data: T[] }).data;
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

function money(value: unknown): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
}

function compactDateTime(value?: string | null): string {
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

function cleanLabel(value?: string | null): string {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function statusClass(value?: string | null) {
    const status = String(value || '').toLowerCase();

    if (['confirmed', 'paid', 'verified', 'approved'].includes(status)) {
        return 'is-good';
    }

    if (
        ['pending', 'submitted', 'for_review', 'partial', 'unpaid'].includes(
            status,
        )
    ) {
        return 'is-warn';
    }

    if (
        ['failed', 'declined', 'rejected', 'cancelled', 'overdue'].includes(
            status,
        )
    ) {
        return 'is-bad';
    }

    if (['due_soon', 'first_due_soon', 'final_due_soon'].includes(status)) {
        return 'is-public';
    }

    return '';
}

function basePath(role: string) {
    if (role === 'manager') return '/manager/payments/review';
    if (role === 'staff') return '/staff/payments/review';

    return '/admin/payments/review';
}

function bookingBase(role: string) {
    if (role === 'manager') return '/manager/bookings';
    if (role === 'staff') return '/staff/bookings';

    return '/admin/bookings';
}

function operationsPath(role: string) {
    if (role === 'manager') return '/manager/bookings/operations';

    return '/admin/bookings/operations';
}

function bookingHref(role: string, payment: PaymentRecord): string {
    const bookingId = payment.booking_id ?? payment.booking?.id;

    if (!bookingId) return '#';

    return `${bookingBase(role)}/${bookingId}`;
}

function proofHref(role: string, payment: PaymentRecord): string {
    if (payment.proof_image_url) return String(payment.proof_image_url);

    const bookingId = payment.booking_id ?? payment.booking?.id;

    if (!bookingId) return '#';

    return `${bookingBase(role)}/${bookingId}/payments/${payment.id}/proof`;
}

function paymentReviewTitle(payment: PaymentRecord) {
    return (
        payment.booking?.type_of_event ||
        payment.booking?.company_name ||
        payment.booking?.client_name ||
        `Payment #${payment.id}`
    );
}

function paymentClient(payment: PaymentRecord) {
    return (
        payment.booking?.company_name ||
        payment.booking?.client_name ||
        payment.payer_name ||
        'No client'
    );
}

function paginationLabel(label?: string | null) {
    return String(label || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;|&raquo;/g, '')
        .trim();
}

function KpiCard({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: ReactNode;
    helper: string;
    icon: typeof CreditCard;
}) {
    return (
        <article className="ops-review-kpi">
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

function StatusChip({
    value,
    prefix,
}: {
    value?: string | null;
    prefix?: string;
}) {
    return (
        <span className={`alh-status-chip ${statusClass(value)}`}>
            {prefix ? `${prefix}: ` : ''}
            {cleanLabel(value)}
        </span>
    );
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

export function PaymentReviewPage() {
    const { props } = usePage() as unknown as { props: PageProps };
    const role = normalizeRole(props.workspaceRole);
    const path = basePath(role);
    const rawPayments = props.payments ?? props.paymentProofs ?? props.records;

    const payments = useMemo(
        () => collection<PaymentRecord>(rawPayments),
        [rawPayments],
    );
    const pageLinks = useMemo(() => linksOf(rawPayments), [rawPayments]);

    const [q, setQ] = useState(String(props.filters?.q ?? ''));
    const [status, setStatus] = useState(String(props.filters?.status ?? ''));
    const [gateway, setGateway] = useState(
        String(props.filters?.gateway ?? ''),
    );
    const [paymentType, setPaymentType] = useState(
        String(props.filters?.payment_type ?? ''),
    );
    const [bookingStatus, setBookingStatus] = useState(
        String(props.filters?.booking_status ?? ''),
    );
    const [deadline, setDeadline] = useState(
        String(props.filters?.deadline ?? ''),
    );
    const [processingId, setProcessingId] = useState<string | number | null>(
        null,
    );

    const visibleAmount = payments.reduce(
        (sum, payment) => sum + numberValue(payment.amount),
        0,
    );
    const stats = props.stats ?? {};

    function applyFilters(event?: FormEvent<HTMLFormElement>) {
        event?.preventDefault();

        router.get(
            path,
            {
                q: q || undefined,
                status: status || undefined,
                gateway: gateway || undefined,
                payment_type: paymentType || undefined,
                booking_status: bookingStatus || undefined,
                deadline: deadline || undefined,
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
        setStatus('');
        setGateway('');
        setPaymentType('');
        setBookingStatus('');
        setDeadline('');

        router.get(
            path,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function updatePayment(
        payment: PaymentRecord,
        nextStatus: 'confirmed' | 'failed' | 'declined',
    ) {
        const bookingId = payment.booking_id ?? payment.booking?.id;

        if (!bookingId) return;

        const verb =
            nextStatus === 'confirmed'
                ? 'confirm'
                : nextStatus === 'failed'
                  ? 'mark as failed'
                  : 'decline';

        if (!window.confirm(`Are you sure you want to ${verb} this payment?`))
            return;

        setProcessingId(payment.id);

        router.put(
            `${bookingBase(role)}/${bookingId}/payments/${payment.id}`,
            {
                status: nextStatus,
                payment_status: nextStatus,
                payment_method: payment.payment_method || 'manual',
                payment_gateway: payment.payment_gateway || 'manual',
                payment_type: payment.payment_type || 'down',
                amount: payment.amount || 0,
                transaction_reference: payment.transaction_reference || '',
                payer_name: payment.payer_name || '',
                card_holder_name: payment.card_holder_name || '',
                remarks:
                    nextStatus === 'confirmed'
                        ? 'Payment proof reviewed and confirmed.'
                        : nextStatus === 'failed'
                          ? 'Payment proof reviewed and marked failed.'
                          : 'Payment proof reviewed and declined.',
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    }

    return (
        <ResourcePageShell
            role={props.workspaceRole}
            current="Payment Review"
            eyebrow="Payment Compliance"
            title="Payment Review"
            description="Review submitted payment proof, transaction references, payment deadlines, and related booking records."
        >
            <div className="space-y-5">
                <section className="ops-review-hero">
                    <div>
                        <p className="backend-booking-label">
                            Payment Review Center
                        </p>
                        <h1>Confirm, decline, and monitor payment proof.</h1>
                        <span>
                            This page is optimized for daily payment review.
                            Keep the queue clean, verify proof, then open the
                            booking only when deeper review is needed.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={operationsPath(role)}
                            className="alh-secondary-button"
                        >
                            Operations Center
                        </Link>

                        <Link
                            href={bookingBase(role)}
                            className="alh-primary-button"
                        >
                            Bookings
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Review Queue"
                        value={
                            stats.review_needed ??
                            stats.pending ??
                            payments.filter(
                                (p) =>
                                    String(p.status).toLowerCase() ===
                                    'pending',
                            ).length
                        }
                        helper="Payments marked pending or waiting for validation."
                        icon={Clock3}
                    />
                    <KpiCard
                        label="Confirmed"
                        value={
                            stats.confirmed ??
                            payments.filter(
                                (p) =>
                                    String(p.status).toLowerCase() ===
                                    'confirmed',
                            ).length
                        }
                        helper="Payment records already confirmed."
                        icon={CheckCircle2}
                    />
                    <KpiCard
                        label="Deadline Risk"
                        value={(stats.due_soon ?? 0) + (stats.overdue ?? 0)}
                        helper={`${stats.due_soon ?? 0} due soon · ${stats.overdue ?? 0} overdue.`}
                        icon={ShieldAlert}
                    />
                    <KpiCard
                        label="Visible Amount"
                        value={money(visibleAmount)}
                        helper="Total from the currently loaded page."
                        icon={Wallet}
                    />
                </section>

                <section className="ops-review-panel overflow-hidden">
                    <div className="ops-review-panel-header">
                        <div>
                            <p className="backend-booking-label">
                                Payment Submissions
                            </p>
                            <h2>
                                {payments.length} visible record
                                {payments.length === 1 ? '' : 's'}
                            </h2>
                            <span>
                                Use filters to narrow payment proof by status,
                                channel, payment type, booking status, and
                                deadline risk.
                            </span>
                        </div>
                    </div>

                    <form
                        onSubmit={applyFilters}
                        className="ops-review-filter-grid"
                    >
                        <div className="relative lg:col-span-2">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                className="backend-booking-input pl-10"
                                placeholder="Search payer, reference, remarks, booking, client..."
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="backend-booking-input"
                        >
                            <option value="">All payment statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="failed">Failed</option>
                            <option value="declined">Declined</option>
                            <option value="refunded">Refunded</option>
                        </select>

                        <select
                            value={gateway}
                            onChange={(event) => setGateway(event.target.value)}
                            className="backend-booking-input"
                        >
                            <option value="">All gateways</option>
                            <option value="manual">Manual</option>
                            <option value="gcash">GCash</option>
                            <option value="maya">Maya</option>
                            <option value="bank">Bank</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="paypal">PayPal</option>
                        </select>

                        <select
                            value={paymentType}
                            onChange={(event) =>
                                setPaymentType(event.target.value)
                            }
                            className="backend-booking-input"
                        >
                            <option value="">All payment types</option>
                            <option value="down">Down Payment</option>
                            <option value="balance">Balance</option>
                            <option value="full">Full Payment</option>
                            <option value="bond">Bond / Deposit</option>
                            <option value="additional">
                                Additional Charges
                            </option>
                        </select>

                        <select
                            value={bookingStatus}
                            onChange={(event) =>
                                setBookingStatus(event.target.value)
                            }
                            className="backend-booking-input"
                        >
                            <option value="">All booking statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="declined">Declined</option>
                        </select>

                        <select
                            value={deadline}
                            onChange={(event) =>
                                setDeadline(event.target.value)
                            }
                            className="backend-booking-input"
                        >
                            <option value="">All deadline states</option>
                            <option value="review">Needs Review</option>
                            <option value="due_soon">Due Soon</option>
                            <option value="overdue">Overdue</option>
                        </select>

                        <button
                            type="submit"
                            className="alh-primary-button justify-center"
                        >
                            <Filter className="h-4 w-4" />
                            Apply
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
                        {payments.length > 0 ? (
                            payments.map((payment) => {
                                const isBusy = processingId === payment.id;
                                const deadlineState = payment.deadline?.state;
                                const balance =
                                    payment.totals?.remaining_balance;

                                return (
                                    <article
                                        key={payment.id}
                                        className="ops-payment-row"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap gap-2">
                                                <StatusChip
                                                    value={payment.status}
                                                />
                                                <StatusChip
                                                    value={
                                                        payment.booking
                                                            ?.booking_status
                                                    }
                                                    prefix="Booking"
                                                />
                                                {deadlineState ? (
                                                    <span
                                                        className={`alh-status-chip ${statusClass(deadlineState)}`}
                                                    >
                                                        {payment.deadline
                                                            ?.label ||
                                                            cleanLabel(
                                                                deadlineState,
                                                            )}
                                                    </span>
                                                ) : null}
                                                <span className="booking-mini-pill">
                                                    {cleanLabel(
                                                        payment.payment_gateway ||
                                                            payment.payment_method ||
                                                            'manual',
                                                    )}
                                                </span>
                                                <span className="booking-mini-pill">
                                                    {cleanLabel(
                                                        payment.payment_type ||
                                                            'payment',
                                                    )}
                                                </span>
                                            </div>

                                            <h3>
                                                {paymentReviewTitle(payment)}
                                            </h3>
                                            <p>
                                                {paymentClient(payment)} ·{' '}
                                                {money(payment.amount)} ·
                                                Submitted{' '}
                                                {compactDateTime(
                                                    payment.created_at ||
                                                        payment.paid_at,
                                                )}
                                            </p>

                                            <div className="mt-4 grid gap-3 md:grid-cols-4">
                                                <div className="alh-admin-mini-box">
                                                    <span>Reference</span>
                                                    <strong>
                                                        {payment.transaction_reference ||
                                                            'No reference'}
                                                    </strong>
                                                </div>
                                                <div className="alh-admin-mini-box">
                                                    <span>Payer</span>
                                                    <strong>
                                                        {payment.payer_name ||
                                                            payment.card_holder_name ||
                                                            'Not set'}
                                                    </strong>
                                                </div>
                                                <div className="alh-admin-mini-box">
                                                    <span>Booking Total</span>
                                                    <strong>
                                                        {money(
                                                            payment.totals
                                                                ?.items_total,
                                                        )}
                                                    </strong>
                                                </div>
                                                <div className="alh-admin-mini-box">
                                                    <span>Remaining</span>
                                                    <strong>
                                                        {money(balance)}
                                                    </strong>
                                                </div>
                                            </div>

                                            {payment.remarks ? (
                                                <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                                                    {payment.remarks}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap gap-2 xl:justify-end">
                                            <Link
                                                href={bookingHref(
                                                    role,
                                                    payment,
                                                )}
                                                className="alh-admin-neutral-button"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Booking
                                            </Link>

                                            <a
                                                href={proofHref(role, payment)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="alh-admin-neutral-button"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Proof
                                            </a>

                                            {String(
                                                payment.status || '',
                                            ).toLowerCase() === 'pending' ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            updatePayment(
                                                                payment,
                                                                'confirmed',
                                                            )
                                                        }
                                                        className="ops-review-confirm-button"
                                                    >
                                                        {isBusy ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        )}
                                                        Confirm
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            updatePayment(
                                                                payment,
                                                                'declined',
                                                            )
                                                        }
                                                        className="ops-review-decline-button"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Decline
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="ops-empty-state">
                                <AlertTriangle className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                <h3>No payment records found</h3>
                                <p>
                                    Clear filters or wait for new payment proof
                                    submissions.
                                </p>
                            </div>
                        )}
                    </div>

                    <Pagination links={pageLinks} />
                </section>
            </div>
        </ResourcePageShell>
    );
}
