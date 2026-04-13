
import AppLayout from '@/layouts/app-layout';
import ActionFeedbackModal from '@/components/ui/action-feedback-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock3, CreditCard, Eye, RefreshCcw, Search, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatDeadlineDateTime, getDeadlineSummary } from '@/lib/booking-deadlines';
import OpsPageHeader from '@/components/ui/ops-page-header';
import OpsKpiCard from '@/components/ui/ops-kpi-card';
import OpsStatusChip from '@/components/ui/ops-status-chip';
import OpsEmptyState from '@/components/ui/ops-empty-state';

type ReviewPayment = {
  id: number;
  status: string;
  payment_method?: string | null;
  payment_gateway?: string | null;
  payment_type?: string | null;
  amount: number;
  transaction_reference?: string | null;
  remarks?: string | null;
  payer_name?: string | null;
  card_holder_name?: string | null;
  card_last_four?: string | null;
  marketing_consent?: boolean;
  proof_image_url?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  booking?: {
    id: number;
    company_name?: string | null;
    client_name?: string | null;
    client_email?: string | null;
    type_of_event?: string | null;
    booking_status?: string | null;
    payment_status?: string | null;
    booking_date_from?: string | null;
    booking_date_to?: string | null;
    created_at?: string | null;
    created_by_name?: string | null;
    items?: Array<{ id: number; service_name?: string | null; area?: string | null; line_total?: number | null }>;
    totals?: {
      items_total?: number | null;
      submitted_payments_total?: number | null;
      confirmed_payments_total?: number | null;
      remaining_balance?: number | null;
    };
  } | null;
};

type Props = {
  filters: {
    q?: string;
    status?: string;
    gateway?: string;
    payment_type?: string;
    booking_status?: string;
    deadline?: string;
  };
  payments: {
    data: ReviewPayment[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
  };
  stats: {
    all: number;
    pending: number;
    confirmed: number;
    failed: number;
    declined: number;
    refunded: number;
    review_needed: number;
    due_soon: number;
    overdue: number;
  };
};

const breadcrumbs = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Payment Review', href: '/payments/review' },
];

function formatMoney(value?: number | null) {
  return `₱ ${Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusTone(status?: string | null) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'confirmed') return 'emerald';
  if (s === 'pending') return 'amber';
  if (s === 'failed' || s === 'declined') return 'red';
  if (s === 'refunded') return 'slate';
  return 'slate';
}

function bookingStatusTone(status?: string | null) {
  const s = String(status ?? '').toLowerCase();
  if (['confirmed', 'active', 'completed'].includes(s)) return 'sky';
  if (s === 'pending') return 'amber';
  if (['declined', 'cancelled'].includes(s)) return 'red';
  return 'slate';
}

function normalizeLabel(label: string) {
  return label.replace(/&laquo;|&raquo;/g, '').replace(/<[^>]*>/g, '').trim();
}

function deadlineTone(label?: string | null) {
  const s = String(label ?? '').toLowerCase();
  if (s.includes('overdue')) return 'red';
  if (s.includes('soon') || s.includes('24h')) return 'amber';
  if (s.includes('met') || s.includes('ok') || s.includes('paid')) return 'emerald';
  return 'slate';
}

export default function PaymentReviewPage({ filters, payments, stats }: Props) {
  const [q, setQ] = useState(filters.q ?? '');
  const [status, setStatus] = useState(filters.status ?? '');
  const [gateway, setGateway] = useState(filters.gateway ?? '');
  const [paymentType, setPaymentType] = useState(filters.payment_type ?? '');
  const [bookingStatus, setBookingStatus] = useState(filters.booking_status ?? '');
  const [deadline, setDeadline] = useState(filters.deadline ?? '');
  const [modal, setModal] = useState<{ open: boolean; title: string; description: string; onConfirm?: () => void }>(
    { open: false, title: '', description: '' },
  );

  const items = payments?.data ?? [];

  const totalAmountVisible = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
    [items],
  );

  function applyFilters() {
    router.get(
      '/payments/review',
      {
        q: q || undefined,
        status: status || undefined,
        gateway: gateway || undefined,
        payment_type: paymentType || undefined,
        booking_status: bookingStatus || undefined,
        deadline: deadline || undefined,
      },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  }

  function resetFilters() {
    setQ('');
    setStatus('');
    setGateway('');
    setPaymentType('');
    setBookingStatus('');
    setDeadline('');
    router.get('/payments/review', {}, { preserveState: true, preserveScroll: true, replace: true });
  }

  function updatePayment(payment: ReviewPayment, nextStatus: 'confirmed' | 'failed' | 'declined') {
    const bookingId = payment.booking?.id;
    if (!bookingId) return;

    router.put(
      `/bookings/${bookingId}/payments/${payment.id}`,
      {
        status: nextStatus,
        payment_method: payment.payment_method || 'online',
        payment_gateway: payment.payment_gateway || null,
        payment_type: payment.payment_type || null,
        amount: payment.amount,
        transaction_reference: payment.transaction_reference || null,
        remarks:
          nextStatus === 'confirmed'
            ? ((payment.remarks || '').trim() ? `${payment.remarks}\nApproved in payment review.` : 'Approved in payment review.')
            : nextStatus === 'failed'
              ? ((payment.remarks || '').trim() ? `${payment.remarks}\nMarked failed in payment review.` : 'Marked failed in payment review.')
              : ((payment.remarks || '').trim() ? `${payment.remarks}\nDeclined in payment review.` : 'Declined in payment review.'),
        payer_name: payment.payer_name || null,
        card_holder_name: payment.card_holder_name || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setModal({ open: false, title: '', description: '' });
        },
      },
    );
  }

  const metricCards = [
    { label: 'Visible queue', value: items.length, icon: CreditCard, tone: 'sky' as const },
    { label: 'Review needed', value: stats.review_needed, icon: AlertTriangle, tone: 'amber' as const },
    { label: 'Due soon', value: stats.due_soon, icon: Clock3, tone: 'amber' as const },
    { label: 'Overdue', value: stats.overdue, icon: XCircle, tone: 'red' as const },
    { label: 'Visible amount', value: formatMoney(totalAmountVisible), icon: CheckCircle2, tone: 'emerald' as const },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Payment Review" />

      <div className="space-y-6 p-4 md:p-6">
        <OpsPageHeader
          eyebrow="Payment Review Center"
          title="Review screenshot proofs, approve payments, and clear the pending queue faster."
          description="This page is the missing bridge between client-submitted payment proofs and the final confirmed payment status used by the booking lifecycle engine."
          actions={
            <>
              <Button type="button" variant="outline" onClick={applyFilters}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button asChild variant="outline">
                <Link href="/bookings/operations">Operations center</Link>
              </Button>
              <Button asChild>
                <Link href="/bookings">Back to bookings</Link>
              </Button>
            </>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {metricCards.map((metric) => (
            <OpsKpiCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} tone={metric.tone} />
          ))}
        </div>

        <Card className="rounded-[2rem] border-black/5 shadow-sm dark:border-white/10">
          <CardHeader className="space-y-5 px-6 py-6">
            <CardTitle className="text-xl">Filter the review queue</CardTitle>

            <div className="grid gap-2 lg:grid-cols-6">
              <div className="relative lg:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search booking, payer, reference number" />
              </div>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All payment statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="failed">Failed</option>
                <option value="declined">Declined</option>
                <option value="refunded">Refunded</option>
              </select>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={gateway} onChange={(e) => setGateway(e.target.value)}>
                <option value="">All gateways</option>
                <option value="card">Card</option>
                <option value="paypal">PayPal</option>
                <option value="gcash">GCash</option>
                <option value="manual">Manual</option>
              </select>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="">All payment types</option>
                <option value="down_payment">Down payment</option>
                <option value="full_payment">Full payment</option>
                <option value="balance">Balance</option>
              </select>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
                <option value="">All booking statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={deadline} onChange={(e) => setDeadline(e.target.value)}>
                <option value="">All deadline states</option>
                <option value="due_soon">Due soon</option>
                <option value="overdue">Overdue</option>
                <option value="normal">Normal</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={applyFilters}>Apply filters</Button>
              <Button variant="outline" onClick={resetFilters}>Reset</Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="rounded-[2rem] border-black/5 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-xl">Review queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <OpsEmptyState
                title="No payment proofs matched the current filter set"
                description="Try widening the filter rules or refresh the queue again."
              />
            ) : (
              items.map((payment) => {
                const summary = getDeadlineSummary(payment.booking as any);
                const totals = payment.booking?.totals ?? {};
                const itemsList = payment.booking?.items ?? [];

                return (
                  <div key={payment.id} className="rounded-[1.8rem] border p-4 shadow-sm">
                    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                      <div className="space-y-4">
                        <div className="overflow-hidden rounded-[1.4rem] border bg-slate-50 dark:bg-slate-950/40">
                          {payment.proof_image_url ? (
                            <img
                              src={payment.proof_image_url}
                              alt={`Payment proof ${payment.id}`}
                              className="h-[260px] w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                              No proof image uploaded
                            </div>
                          )}
                        </div>

                        <div className="rounded-[1.4rem] border bg-muted/20 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payer details</div>
                          <div className="mt-2 text-sm">Name: <span className="font-medium">{payment.payer_name || payment.card_holder_name || '—'}</span></div>
                          <div className="mt-1 text-sm">Reference: <span className="font-medium">{payment.transaction_reference || '—'}</span></div>
                          <div className="mt-1 text-sm">Gateway: <span className="font-medium">{payment.payment_gateway || '—'}</span></div>
                          <div className="mt-1 text-sm">Type: <span className="font-medium">{payment.payment_type || '—'}</span></div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-xl font-semibold text-slate-900 dark:text-white">
                            {payment.booking?.company_name || payment.booking?.client_name || `Payment #${payment.id}`}
                          </div>
                          <OpsStatusChip label={payment.status || '—'} tone={statusTone(payment.status)} />
                          <OpsStatusChip label={payment.booking?.booking_status || '—'} tone={bookingStatusTone(payment.booking?.booking_status)} />
                          <OpsStatusChip label={summary.label || 'Deadline'} tone={deadlineTone(summary.label)} />
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {payment.booking?.client_name || '—'} • {payment.booking?.client_email || 'No email'}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-[1.4rem] border bg-muted/20 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Booking schedule</div>
                            <div className="mt-2 text-sm">{formatDateTime(payment.booking?.booking_date_from)}</div>
                            <div className="mt-1 text-sm text-muted-foreground">to {formatDateTime(payment.booking?.booking_date_to)}</div>
                            <div className="mt-2 text-sm">Event: <span className="font-medium">{payment.booking?.type_of_event || '—'}</span></div>
                          </div>

                          <div className="rounded-[1.4rem] border bg-muted/20 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment snapshot</div>
                            <div className="mt-2 text-sm">This payment: <span className="font-semibold">{formatMoney(payment.amount)}</span></div>
                            <div className="mt-1 text-sm">Items total: <span className="font-semibold">{formatMoney(Number(totals.items_total ?? 0))}</span></div>
                            <div className="mt-1 text-sm">Submitted: <span className="font-semibold">{formatMoney(Number(totals.submitted_payments_total ?? 0))}</span></div>
                            <div className="mt-1 text-sm">Confirmed: <span className="font-semibold">{formatMoney(Number(totals.confirmed_payments_total ?? 0))}</span></div>
                            <div className="mt-1 text-sm text-red-600">Remaining: <span className="font-semibold">{formatMoney(Number(totals.remaining_balance ?? 0))}</span></div>
                          </div>
                        </div>

                        <div className="rounded-[1.4rem] border bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
                          24H deadline: {formatDeadlineDateTime(summary.down_deadline)} • 48H deadline: {formatDeadlineDateTime(summary.full_deadline)} • {summary.recommended}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Services: {itemsList.length > 0 ? itemsList.map((item) => item.service_name || 'Service').join(', ') : 'No service items attached'}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() =>
                              setModal({
                                open: true,
                                title: 'Approve this payment?',
                                description: 'This will move the payment into confirmed state and affect booking payment totals.',
                                onConfirm: () => updatePayment(payment, 'confirmed'),
                              })
                            }
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() =>
                              setModal({
                                open: true,
                                title: 'Mark this payment as failed?',
                                description: 'Use this when the payment proof is invalid or the payment attempt did not succeed.',
                                onConfirm: () => updatePayment(payment, 'failed'),
                              })
                            }
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" /> Mark Failed
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={() =>
                              setModal({
                                open: true,
                                title: 'Decline this payment?',
                                description: 'Use this when the payment submission should not be accepted for the booking.',
                                onConfirm: () => updatePayment(payment, 'declined'),
                              })
                            }
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Decline
                          </Button>

                          {payment.booking?.id ? (
                            <Button asChild variant="outline">
                              <Link href={`/bookings/${payment.booking.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Open Booking
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {Array.isArray(payments?.links) && payments.links.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {payments.links.map((link, index) => (
                  <button
                    key={`${link.label}-${index}`}
                    type="button"
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true, replace: true })}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${link.active ? 'bg-primary text-primary-foreground' : 'bg-background'} ${!link.url ? 'cursor-not-allowed opacity-40' : ''}`}
                  >
                    {normalizeLabel(link.label)}
                  </button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <ActionFeedbackModal
          open={modal.open}
          onOpenChange={(open) => setModal((prev) => ({ ...prev, open }))}
          variant="warning"
          title={modal.title}
          description={modal.description}
          confirmText="Proceed"
          cancelText="Cancel"
          onConfirm={() => modal.onConfirm?.()}
        />
      </div>
    </AppLayout>
  );
}
