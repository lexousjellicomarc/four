import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CreditCard,
  Download,
  ExternalLink,
  Filter,
  History,
  Printer,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

type AuditEvent = {
  id: number;
  booking_id: number | null;
  booking_exists: boolean;
  event_key: string;
  title: string;
  from_status?: string | null;
  to_status?: string | null;
  from_payment_status?: string | null;
  to_payment_status?: string | null;
  reason?: string | null;
  meta?: Record<string, unknown> | null;
  event_at?: string | null;
  created_at?: string | null;
  actor?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type Paginated<T> = {
  data: T[];
  links?: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
  events: Paginated<AuditEvent>;
  filters: {
    q?: string;
    event_key?: string;
    status?: string;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    booking_id?: string;
    only_deleted?: boolean;
  };
  stats: {
    total: number;
    status_changes: number;
    payment_changes: number;
    auto_deleted: number;
    today: number;
    unique_bookings: number;
  };
  eventKeys: string[];
  statusOptions: string[];
  paymentStatusOptions: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Audit Trail', href: '/bookings/audit' },
];

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

function eventKeyLabel(key: string) {
  return key.replaceAll('_', ' ');
}

function statusTone(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100',
    confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100',
    completed: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-100',
    declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-100',
    cancelled: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
    deleted: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-100',
    unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-100',
    partial: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100',
    owing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-100',
  };

  return map[value] ?? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100';
}

function eventTone(eventKey: string) {
  if (eventKey === 'booking_auto_deleted') return 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20';
  if (eventKey === 'payment_status_changed') return 'border-sky-200 bg-sky-50 dark:border-sky-900/30 dark:bg-sky-950/20';
  if (eventKey === 'booking_status_changed') return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20';
  return 'border-black/5 bg-white dark:border-white/10 dark:bg-white/5';
}

function isPaginationEllipsis(label: string) {
  const plain = label.replace(/<[^>]+>/g, '').trim();
  return plain === '...';
}

function buildQuery(filters: Props['filters']) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    params.set(key, value === true ? '1' : String(value));
  });
  return params.toString();
}

export default function BookingAuditPage({ events, filters, stats, eventKeys, statusOptions, paymentStatusOptions }: Props) {
  const [q, setQ] = useState(filters.q ?? '');
  const [eventKey, setEventKey] = useState(filters.event_key ?? '');
  const [status, setStatus] = useState(filters.status ?? '');
  const [paymentStatus, setPaymentStatus] = useState(filters.payment_status ?? '');
  const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
  const [dateTo, setDateTo] = useState(filters.date_to ?? '');
  const [bookingId, setBookingId] = useState(filters.booking_id ?? '');
  const [onlyDeleted, setOnlyDeleted] = useState(Boolean(filters.only_deleted));

  const activeFilters = useMemo(
    () => ({
      q,
      event_key: eventKey,
      status,
      payment_status: paymentStatus,
      date_from: dateFrom,
      date_to: dateTo,
      booking_id: bookingId,
      only_deleted: onlyDeleted,
    }),
    [q, eventKey, status, paymentStatus, dateFrom, dateTo, bookingId, onlyDeleted],
  );

  const exportHref = useMemo(() => {
    const qs = buildQuery(activeFilters);
    return qs ? `/bookings/audit/export?${qs}` : '/bookings/audit/export';
  }, [activeFilters]);

  const printHref = useMemo(() => {
    const qs = buildQuery(activeFilters);
    return qs ? `/bookings/audit/print?${qs}` : '/bookings/audit/print';
  }, [activeFilters]);

  const topCards = useMemo(
    () => [
      { label: 'Visible events', value: stats.total, icon: History },
      { label: 'Status changes', value: stats.status_changes, icon: Activity },
      { label: 'Payment changes', value: stats.payment_changes, icon: CreditCard },
      { label: 'Auto-deleted', value: stats.auto_deleted, icon: Trash2 },
      { label: 'Today', value: stats.today, icon: CalendarDays },
      { label: 'Unique bookings', value: stats.unique_bookings, icon: ShieldAlert },
    ],
    [stats],
  );

  function applyFilters() {
    router.get(
      '/bookings/audit',
      {
        q: q || undefined,
        event_key: eventKey || undefined,
        status: status || undefined,
        payment_status: paymentStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        booking_id: bookingId || undefined,
        only_deleted: onlyDeleted ? 1 : undefined,
      },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  }

  function resetFilters() {
    setQ('');
    setEventKey('');
    setStatus('');
    setPaymentStatus('');
    setDateFrom('');
    setDateTo('');
    setBookingId('');
    setOnlyDeleted(false);
    router.get('/bookings/audit', {}, { preserveState: true, preserveScroll: true, replace: true });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Booking Audit Trail" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <Card>
          <CardHeader className="space-y-4 px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl">Booking lifecycle audit trail</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review booking lifecycle changes across the whole system, then export or print the result set for reporting, turnover, and documentation.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={exportHref}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={printHref} target="_blank">
                    <Printer className="mr-2 h-4 w-4" /> Print report
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/bookings">Back to bookings</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              {topCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{card.label}</div>
                        <div className="text-2xl font-semibold">{card.value}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              className="grid grid-cols-1 gap-2 lg:grid-cols-8"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
            >
              <div className="relative lg:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search title, reason, actor, booking ID"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <select className="rounded-md border bg-background px-2 py-1 text-sm" value={eventKey} onChange={(e) => setEventKey(e.target.value)}>
                <option value="">All event types</option>
                {eventKeys.map((key) => (
                  <option key={key} value={key}>{eventKeyLabel(key)}</option>
                ))}
              </select>

              <select className="rounded-md border bg-background px-2 py-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Any booking status</option>
                {statusOptions.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>

              <select className="rounded-md border bg-background px-2 py-1 text-sm" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="">Any payment status</option>
                {paymentStatusOptions.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>

              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              <Input placeholder="Booking ID" value={bookingId} onChange={(e) => setBookingId(e.target.value)} />

              <div className="lg:col-span-8 flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input type="checkbox" checked={onlyDeleted} onChange={(e) => setOnlyDeleted(e.target.checked)} />
                  Show only auto-deleted
                </label>

                <Button type="submit" size="sm"><Filter className="mr-2 h-4 w-4" /> Apply filters</Button>
                <Button type="button" size="sm" variant="outline" onClick={resetFilters}>Reset</Button>
                <Button asChild type="button" size="sm" variant="outline">
                  <Link href={printHref} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open printable view
                  </Link>
                </Button>
              </div>
            </form>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            {events.data.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
                No audit events found for the current filter set.
              </div>
            ) : (
              <div className="space-y-4">
                {events.data.map((event) => (
                  <div key={event.id} className={`rounded-3xl border p-5 shadow-sm ${eventTone(event.event_key)}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-xl font-semibold">{event.title}</div>
                          <Badge variant="secondary">{eventKeyLabel(event.event_key)}</Badge>
                          {event.to_status ? <Badge className={statusTone(event.to_status)}>{event.to_status}</Badge> : null}
                          {event.to_payment_status ? <Badge className={statusTone(event.to_payment_status)}>{event.to_payment_status}</Badge> : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span>Audit ID: #{event.id}</span>
                          {event.booking_id ? <span>Booking ID: #{event.booking_id}</span> : null}
                          <span>{formatDateTime(event.event_at ?? event.created_at)}</span>
                        </div>

                        {event.reason ? (
                          <div className="rounded-2xl border bg-background/70 px-4 py-3 text-sm leading-7">
                            {event.reason}
                          </div>
                        ) : null}

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border bg-background/60 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Booking status</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                              {event.from_status ? <Badge className={statusTone(event.from_status)}>From: {event.from_status}</Badge> : <span className="text-muted-foreground">No previous value</span>}
                              {event.to_status ? <Badge className={statusTone(event.to_status)}>To: {event.to_status}</Badge> : null}
                            </div>
                          </div>

                          <div className="rounded-2xl border bg-background/60 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment status</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                              {event.from_payment_status ? <Badge className={statusTone(event.from_payment_status)}>From: {event.from_payment_status}</Badge> : <span className="text-muted-foreground">No previous value</span>}
                              {event.to_payment_status ? <Badge className={statusTone(event.to_payment_status)}>To: {event.to_payment_status}</Badge> : null}
                            </div>
                          </div>

                          <div className="rounded-2xl border bg-background/60 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Actor</div>
                            <div className="mt-2 text-sm font-medium">{event.actor?.name || 'System automation'}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{event.actor?.email || 'Console / scheduled maintenance'}</div>
                          </div>

                          <div className="rounded-2xl border bg-background/60 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Linked booking</div>
                            {event.booking_id ? (
                              event.booking_exists ? (
                                <Button asChild variant="outline" size="sm" className="mt-2">
                                  <Link href={`/bookings/${event.booking_id}`}>Open booking</Link>
                                </Button>
                              ) : (
                                <div className="mt-2 text-sm text-muted-foreground">Record no longer exists in the bookings table.</div>
                              )
                            ) : (
                              <div className="mt-2 text-sm text-muted-foreground">No linked booking ID.</div>
                            )}
                          </div>
                        </div>

                        {event.meta && Object.keys(event.meta).length > 0 ? (
                          <div className="rounded-2xl border bg-background/60 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Meta</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {Object.entries(event.meta).map(([key, value]) => (
                                <Badge key={key} variant="outline">
                                  {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {Array.isArray(events.links) && events.links.length > 0 ? (
              <Pagination>
                <PaginationContent>
                  {events.links.map((link, index) => {
                    if (isPaginationEllipsis(link.label)) {
                      return (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    const plain = link.label.replace(/<[^>]+>/g, '').trim().toLowerCase();

                    if (plain === 'previous') {
                      return (
                        <PaginationItem key={`prev-${index}`}>
                          <PaginationPrevious href={link.url ?? '#'} onClick={(e) => {
                            if (!link.url) e.preventDefault();
                          }} />
                        </PaginationItem>
                      );
                    }

                    if (plain === 'next') {
                      return (
                        <PaginationItem key={`next-${index}`}>
                          <PaginationNext href={link.url ?? '#'} onClick={(e) => {
                            if (!link.url) e.preventDefault();
                          }} />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={`page-${index}`}>
                        <PaginationLink href={link.url ?? '#'} isActive={link.active} onClick={(e) => {
                          if (!link.url) e.preventDefault();
                        }}>
                          {link.label.replace(/<[^>]+>/g, '').trim()}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                </PaginationContent>
              </Pagination>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
