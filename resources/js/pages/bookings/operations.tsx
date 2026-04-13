
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { type BreadcrumbItem } from '@/types';
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Search,
  ShieldAlert,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import OpsPageHeader from '@/components/ui/ops-page-header';
import OpsKpiCard from '@/components/ui/ops-kpi-card';
import OpsStatusChip from '@/components/ui/ops-status-chip';
import OpsEmptyState from '@/components/ui/ops-empty-state';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Operations Center', href: '/bookings/operations' },
];

type PaymentItem = {
  id: number;
  amount: number;
  status: string;
  payment_gateway?: string | null;
  payment_type?: string | null;
  transaction_reference?: string | null;
  payer_name?: string | null;
  proof_image_url?: string | null;
  created_at?: string | null;
  booking?: {
    id: number;
    client_name?: string | null;
    company_name?: string | null;
    booking_status?: string | null;
    payment_status?: string | null;
  } | null;
};

type BookingRow = {
  id: number;
  client_name?: string | null;
  company_name?: string | null;
  client_email?: string | null;
  client_contact_number?: string | null;
  type_of_event?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  booking_date_from?: string | null;
  booking_date_to?: string | null;
  created_at?: string | null;
  created_by_name?: string | null;
  items: Array<{ id: number; service_name?: string | null; area?: string | null; line_total: number }>;
  latest_payment?: PaymentItem | null;
  totals: {
    items_total: number;
    submitted_payments_total: number;
    confirmed_payments_total: number;
    remaining_balance: number;
    down_payment_required: number;
  };
  deadline: {
    risk: string;
    label: string;
    recommended: string;
    down_deadline?: string | null;
    full_deadline?: string | null;
    down_required: number;
    submitted_total: number;
    confirmed_total: number;
  };
};

type AutomationItem = {
  id: number;
  event_key: string;
  title: string;
  reason?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  from_payment_status?: string | null;
  to_payment_status?: string | null;
  event_at?: string | null;
  meta?: Record<string, unknown> | null;
  booking?: { id: number; client_name?: string | null; company_name?: string | null } | null;
};

type Props = {
  filters: {
    q?: string;
    booking_status?: string;
    payment_status?: string;
    risk?: string;
    attention?: string;
    gateway?: string;
  };
  bookings: {
    data: BookingRow[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
  };
  summary: {
    visible: number;
    review_needed: number;
    due_soon: number;
    overdue: number;
    submitted_total: number;
    confirmed_total: number;
    outstanding_total: number;
  };
  pendingPayments: PaymentItem[];
  automationEvents: AutomationItem[];
};

function money(v: number) {
  return `₱ ${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dt(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function riskTone(risk?: string | null) {
  switch (String(risk || '').toLowerCase()) {
    case 'overdue':
      return 'red';
    case 'due_soon':
      return 'amber';
    case 'watch':
      return 'sky';
    case 'normal':
      return 'emerald';
    case 'closed':
      return 'slate';
    default:
      return 'slate';
  }
}

function paymentTone(status?: string | null) {
  switch (String(status || '').toLowerCase()) {
    case 'confirmed':
    case 'paid':
      return 'emerald';
    case 'pending':
    case 'partial':
      return 'amber';
    case 'failed':
    case 'declined':
    case 'unpaid':
      return 'red';
    default:
      return 'slate';
  }
}

function bookingTone(status?: string | null) {
  switch (String(status || '').toLowerCase()) {
    case 'confirmed':
    case 'active':
    case 'completed':
      return 'emerald';
    case 'pending':
      return 'amber';
    case 'declined':
    case 'cancelled':
      return 'red';
    default:
      return 'slate';
  }
}

function stripHtml(label: string) {
  return String(label || '').replace(/<[^>]*>/g, '').replace(/&laquo;|&raquo;/g, '').trim();
}

export default function BookingOperationsPage({ filters, bookings, summary, pendingPayments, automationEvents }: Props) {
  const [q, setQ] = useState(filters.q || '');
  const [bookingStatus, setBookingStatus] = useState(filters.booking_status || '');
  const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
  const [risk, setRisk] = useState(filters.risk || '');
  const [attention, setAttention] = useState(filters.attention || '');
  const [gateway, setGateway] = useState(filters.gateway || '');

  const metrics = useMemo(
    () => [
      { label: 'Visible bookings', value: summary.visible, icon: CalendarDays, tone: 'sky' as const },
      { label: 'Pending review', value: summary.review_needed, icon: CreditCard, tone: 'amber' as const },
      { label: 'Due soon', value: summary.due_soon, icon: Clock3, tone: 'amber' as const },
      { label: 'Overdue', value: summary.overdue, icon: ShieldAlert, tone: 'red' as const },
      { label: 'Confirmed total', value: money(summary.confirmed_total), icon: CheckCircle2, tone: 'emerald' as const },
      { label: 'Outstanding', value: money(summary.outstanding_total), icon: Wallet, tone: 'violet' as const },
    ],
    [summary],
  );

  const applyFilters = () => {
    router.get(
      '/bookings/operations',
      {
        q: q || undefined,
        booking_status: bookingStatus || undefined,
        payment_status: paymentStatus || undefined,
        risk: risk || undefined,
        attention: attention || undefined,
        gateway: gateway || undefined,
      },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const resetFilters = () => {
    setQ('');
    setBookingStatus('');
    setPaymentStatus('');
    setRisk('');
    setAttention('');
    setGateway('');
    router.get('/bookings/operations', {}, { preserveState: true, preserveScroll: true, replace: true });
  };

  const postAction = (url: string) => {
    router.post(url, {}, { preserveScroll: true });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Booking Operations Center" />

      <div className="space-y-6 p-4 md:p-6">
        <OpsPageHeader
          eyebrow="Unified Booking Operations"
          title="Booking Operations Center"
          description="One page for deadline risk, payment review, recent automation activity, and the bookings that need action first."
          actions={
            <>
              <Button asChild variant="outline"><Link href="/bookings">Bookings list</Link></Button>
              <Button asChild variant="outline"><Link href="/payments/review">Payment review</Link></Button>
              <Button asChild><Link href="/bookings/analytics">Analytics</Link></Button>
            </>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metrics.map((metric) => (
            <OpsKpiCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              tone={metric.tone}
            />
          ))}
        </div>

        <Card className="rounded-[2rem] border-black/5 shadow-sm dark:border-white/10">
          <CardHeader className="space-y-5 px-6 py-6">
            <CardTitle className="text-xl">Filter the operations queue</CardTitle>

            <div className="grid gap-2 lg:grid-cols-7">
              <div className="relative lg:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, company, email, event" />
              </div>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
                <option value="">All booking statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="">All payment statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="owing">Owing</option>
              </select>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={risk} onChange={(e) => setRisk(e.target.value)}>
                <option value="">All risk states</option>
                <option value="watch">Watch</option>
                <option value="due_soon">Due soon</option>
                <option value="overdue">Overdue</option>
                <option value="normal">On track</option>
                <option value="closed">Closed</option>
              </select>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={attention} onChange={(e) => setAttention(e.target.value)}>
                <option value="">All attention types</option>
                <option value="needs_review">Needs payment review</option>
                <option value="with_proof">Has proof image</option>
                <option value="outstanding">Has outstanding balance</option>
              </select>

              <select className="rounded-md border bg-background px-3 py-2 text-sm" value={gateway} onChange={(e) => setGateway(e.target.value)}>
                <option value="">All gateways</option>
                <option value="card">Card</option>
                <option value="paypal">PayPal</option>
                <option value="gcash">GCash</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={applyFilters}>Apply filters</Button>
              <Button variant="outline" onClick={resetFilters}>Reset</Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="rounded-[2rem] border-black/5 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-xl">Bookings needing action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookings.data.length === 0 ? (
                  <OpsEmptyState
                    title="No bookings matched the current filter set"
                    description="Try clearing one or more filters to bring back items that need attention."
                  />
                ) : (
                  bookings.data.map((booking) => (
                    <div key={booking.id} className="rounded-[1.6rem] border p-4 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-xl font-semibold text-slate-900 dark:text-white">
                              {booking.company_name || booking.client_name || `Booking #${booking.id}`}
                            </div>
                            <OpsStatusChip label={booking.booking_status || '—'} tone={bookingTone(booking.booking_status)} />
                            <OpsStatusChip label={booking.payment_status || '—'} tone={paymentTone(booking.payment_status)} />
                            <OpsStatusChip label={booking.deadline?.label || '—'} tone={riskTone(booking.deadline?.risk)} />
                          </div>

                          <div className="text-sm text-muted-foreground">
                            {booking.client_name || '—'} • {booking.client_email || 'No email'}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-2xl border bg-muted/20 p-4">
                              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Schedule</div>
                              <div className="mt-2 text-sm font-medium">{dt(booking.booking_date_from)}</div>
                              <div className="mt-1 text-sm text-muted-foreground">to {dt(booking.booking_date_to)}</div>
                            </div>

                            <div className="rounded-2xl border bg-muted/20 p-4">
                              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Totals</div>
                              <div className="mt-2 text-sm">Items: <span className="font-semibold">{money(booking.totals.items_total)}</span></div>
                              <div className="mt-1 text-sm">Submitted: <span className="font-semibold">{money(booking.totals.submitted_payments_total)}</span></div>
                              <div className="mt-1 text-sm">Confirmed: <span className="font-semibold">{money(booking.totals.confirmed_payments_total)}</span></div>
                              <div className="mt-1 text-sm text-red-600">Outstanding: <span className="font-semibold">{money(booking.totals.remaining_balance)}</span></div>
                            </div>

                            <div className="rounded-2xl border bg-muted/20 p-4">
                              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Deadline watch</div>
                              <div className="mt-2 text-sm">50% required: <span className="font-semibold">{money(booking.totals.down_payment_required)}</span></div>
                              <div className="mt-1 text-sm">24H: <span className="font-semibold">{dt(booking.deadline.down_deadline)}</span></div>
                              <div className="mt-1 text-sm">48H: <span className="font-semibold">{dt(booking.deadline.full_deadline)}</span></div>
                            </div>
                          </div>

                          <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
                            {booking.deadline?.recommended || 'No recommendation available.'}
                          </div>

                          <div className="text-sm text-muted-foreground">
                            Services: {booking.items.length > 0 ? booking.items.map((item) => item.service_name || 'Service').join(', ') : 'No items attached'}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:max-w-[220px] lg:flex-col lg:items-stretch">
                          <Button asChild variant="outline"><Link href={`/bookings/${booking.id}`}><Eye className="mr-2 h-4 w-4" /> Open booking</Link></Button>
                          <Button asChild variant="outline"><Link href="/payments/review">Open review queue</Link></Button>
                          {booking.latest_payment?.id ? (
                            <>
                              <Button onClick={() => postAction(`/bookings/operations/payments/${booking.latest_payment?.id}/approve`)}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve latest payment</Button>
                              <Button variant="outline" onClick={() => postAction(`/bookings/operations/payments/${booking.latest_payment?.id}/fail`)}><AlertTriangle className="mr-2 h-4 w-4" /> Mark failed</Button>
                              <Button variant="destructive" onClick={() => postAction(`/bookings/operations/payments/${booking.latest_payment?.id}/decline`)}><XCircle className="mr-2 h-4 w-4" /> Decline payment</Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {Array.isArray(bookings.links) && bookings.links.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {bookings.links.map((link, index) => (
                      <button
                        key={`${link.label}-${index}`}
                        type="button"
                        disabled={!link.url}
                        onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true, replace: true })}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${link.active ? 'bg-primary text-primary-foreground' : 'bg-background'} ${!link.url ? 'cursor-not-allowed opacity-40' : ''}`}
                      >
                        {stripHtml(link.label)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border-black/5 dark:border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xl">Recent payment review queue</CardTitle>
                <BellRing className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingPayments.length === 0 ? (
                  <OpsEmptyState title="No pending payments in the queue" />
                ) : pendingPayments.map((payment) => (
                  <div key={payment.id} className="rounded-[1.4rem] border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {payment.booking?.company_name || payment.booking?.client_name || `Payment #${payment.id}`}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">{payment.transaction_reference || 'No reference number'} • {payment.payment_gateway || 'gateway n/a'}</div>
                        <div className="mt-1 text-sm">Amount: <span className="font-semibold">{money(payment.amount)}</span></div>
                        <div className="mt-1 text-xs text-muted-foreground">Submitted: {dt(payment.created_at)}</div>
                      </div>
                      <OpsStatusChip label={payment.status} tone={paymentTone(payment.status)} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => postAction(`/bookings/operations/payments/${payment.id}/approve`)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => postAction(`/bookings/operations/payments/${payment.id}/fail`)}>Mark failed</Button>
                      <Button size="sm" variant="destructive" onClick={() => postAction(`/bookings/operations/payments/${payment.id}/decline`)}>Decline</Button>
                      {payment.booking?.id ? <Button asChild size="sm" variant="outline"><Link href={`/bookings/${payment.booking.id}`}>Open booking</Link></Button> : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-black/5 dark:border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xl">Recent lifecycle automation activity</CardTitle>
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                {automationEvents.length === 0 ? (
                  <OpsEmptyState title="No lifecycle activity found yet" />
                ) : automationEvents.map((event) => (
                  <div key={event.id} className="rounded-[1.4rem] border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white">{event.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{event.booking?.company_name || event.booking?.client_name || 'Booking record'} • {dt(event.event_at)}</div>
                      </div>
                      <OpsStatusChip label={event.event_key} tone="violet" />
                    </div>

                    {(event.reason || event.to_status || event.to_payment_status) ? (
                      <div className="mt-3 space-y-2 text-sm">
                        {event.reason ? <div>{event.reason}</div> : null}
                        {(event.from_status || event.to_status) ? (
                          <div className="text-muted-foreground">Status: {event.from_status || '—'} → {event.to_status || '—'}</div>
                        ) : null}
                        {(event.from_payment_status || event.to_payment_status) ? (
                          <div className="text-muted-foreground">Payment: {event.from_payment_status || '—'} → {event.to_payment_status || '—'}</div>
                        ) : null}
                      </div>
                    ) : null}

                    {event.booking?.id ? (
                      <div className="mt-3">
                        <Button asChild size="sm" variant="outline"><Link href={`/bookings/${event.booking.id}`}>Open booking</Link></Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
