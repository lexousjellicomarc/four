import AppLayout from '@/layouts/app-layout';
import { Booking, Service, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import BookingStatusBadge from '@/components/ui/booking-status-badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import DeleteBookingDialog from './DeleteBookingDialog';
import bookingsRoutes from '@/routes/bookings';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Bookings', href: bookingsRoutes.index.url() }];

interface LaravelPaginationLink {
  url: string | null;
  label: string;
  page?: number;
  active: boolean;
}

type SortKey =
  | 'upcoming'
  | 'ending_soon'
  | 'newest'
  | 'oldest'
  | 'farthest'
  | 'guests_desc'
  | 'priority'
  | 'unviewed_first';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'upcoming', label: 'Nearest schedule (Upcoming first)' },
  { value: 'ending_soon', label: 'Ending soon' },
  { value: 'priority', label: 'Priority (Pending/Active + Upcoming)' },
  { value: 'unviewed_first', label: 'NEW (unviewed) first' },
  { value: 'newest', label: 'Newest booking (Created)' },
  { value: 'oldest', label: 'Oldest booking (Created)' },
  { value: 'farthest', label: 'Farthest schedule' },
  { value: 'guests_desc', label: 'Most guests' },
];

interface BookingsPageProps {
  bookings: any; // supports resource paginator OR direct paginator
  services: Service[];
  filters: Partial<{
    booking_status: string;
    payment_status: string;
    service_id: string | number;
    q: string;
    date_from: string;
    date_to: string;
    sort: SortKey | string;
  }>;
  statusCounts: {
    all: number;
    pending: number;
    active: number;
    confirmed: number;
    cancelled: number;
    declined: number;
    completed: number;
  };
}

function getRoleNames(auth: any): string[] {
  const raw = auth?.user?.roles ?? auth?.roles ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r: any) => (typeof r === 'string' ? r : r?.name))
    .filter(Boolean)
    .map((s: string) => s.toLowerCase());
}

/* ============================================================
 * ✅ FIX: Schedule "to" showing wrong time/day
 *
 * Your symptom:
 *   from: Jan 30, 2026 6:00 AM
 *   to:   Jan 30, 2026 6:00 PM
 * was showing as:
 *   Jan 30, 2026, 2:00 PM
 *   to Jan 31, 2026, 2:00 AM
 *
 * That happens when the browser is applying timezone conversion
 * (usually because the string contains `Z` / `+00:00` etc).
 *
 * So here we parse booking schedule as "floating local time":
 * - We EXTRACT the YYYY-MM-DD HH:mm:ss parts and IGNORE timezone suffix.
 * - That means "06:00" always displays as 06:00, not shifted.
 * ============================================================ */

function isDateOnlyString(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parseScheduleDateTime(
  input: unknown,
  opts?: { dateOnlyAsEnd?: boolean },
): Date | null {
  if (input === null || input === undefined) return null;

  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;

  if (typeof input === 'number') {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const s = String(input).trim();
  if (!s) return null;

  // Capture ONLY the leading datetime part, ignore any trailing timezone.
  // Examples supported:
  // - 2026-01-30
  // - 2026-01-30 06:00
  // - 2026-01-30 06:00:00
  // - 2026-01-30T06:00:00
  // - 2026-01-30T06:00:00.000000Z
  // - 2026-01-30T06:00:00+00:00
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?)?/,
  );

  if (!m) {
    // Fallback: last resort
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);

  const dateOnly = isDateOnlyString(s);

  let hh = m[4] ? Number(m[4]) : 0;
  let mm = m[5] ? Number(m[5]) : 0;
  let ss = m[6] ? Number(m[6]) : 0;

  // microseconds -> milliseconds (take first 3 digits, pad if needed)
  let ms = 0;
  if (m[7]) {
    const frac = String(m[7]);
    ms = Number.parseInt(frac.padEnd(3, '0').slice(0, 3), 10);
    if (!Number.isFinite(ms)) ms = 0;
  }

  // If it is date-only and used as "to", treat as end-of-day for duration/tag
  if (dateOnly && opts?.dateOnlyAsEnd) {
    hh = 23;
    mm = 59;
    ss = 59;
    ms = 999;
  }

  const d = new Date(y, mo, da, hh, mm, ss, ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatScheduleDateTime(input: unknown): string {
  if (input === null || input === undefined) return '-';
  const s = String(input).trim();
  const dateOnly = isDateOnlyString(s);

  const d = parseScheduleDateTime(input);
  if (!d) return '-';

  // Date-only → show only date (no misleading midnight)
  if (dateOnly) {
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  // Datetime → show date + time
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatScheduleTimeOnly(input: unknown): string {
  const d = parseScheduleDateTime(input);
  if (!d) return '-';
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function diffCalendarDays(a: Date, b: Date) {
  // DST-safe calendar difference
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((aUTC - bUTC) / 86400000);
}

function formatDuration(fromInput: unknown, toInput: unknown) {
  const start = parseScheduleDateTime(fromInput);
  const end = parseScheduleDateTime(toInput, { dateOnlyAsEnd: true });
  if (!start || !end) return null;

  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (!Number.isFinite(mins) || mins <= 0) return null;

  if (mins < 60) return `${mins}m`;

  if (mins < 24 * 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  const days = Math.floor(mins / (24 * 60));
  const rem = mins - days * 24 * 60;
  const h = Math.floor(rem / 60);

  return h ? `${days}d ${h}h` : `${days}d`;
}

function getScheduleTag(fromInput: unknown, toInput: unknown) {
  const start = parseScheduleDateTime(fromInput);
  const end = parseScheduleDateTime(toInput, { dateOnlyAsEnd: true });
  if (!start) return null;

  const now = new Date();

  // ongoing
  if (end && start <= now && end > now) {
    return { label: 'ONGOING', className: 'bg-sky-600 text-white' };
  }

  // ended
  if (end && end <= now) {
    return { label: 'PAST', className: 'bg-muted text-muted-foreground border border-border' };
  }

  // if no end but already started
  if (!end && start <= now) {
    return { label: 'ONGOING', className: 'bg-sky-600 text-white' };
  }

  const days = diffCalendarDays(start, now);

  if (days === 0) return { label: 'TODAY', className: 'bg-emerald-600 text-white' };
  if (days === 1) return { label: 'TOMORROW', className: 'bg-emerald-500 text-white' };
  if (days > 1 && days <= 7) return { label: `IN ${days}D`, className: 'bg-amber-500 text-black' };
  if (days > 7) return { label: `IN ${days}D`, className: 'bg-muted text-foreground border border-border' };

  return { label: 'PAST', className: 'bg-muted text-muted-foreground border border-border' };
}

function PaymentStatusBadge({ status }: { status?: string | null }) {
  const s = (status || '').toLowerCase();

  const cls =
    s === 'paid'
      ? 'bg-emerald-600 text-white'
      : s === 'partial'
        ? 'bg-amber-500 text-black'
        : s === 'unpaid'
          ? 'bg-red-600 text-white'
          : 'bg-muted text-foreground border border-border';

  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : '-';
  return <Badge className={cls}>{label}</Badge>;
}

function getCreatedByLabel(b: any): string {
  const createdBy = b?.created_by ?? b?.createdBy ?? b?.creator ?? null;
  const name = b?.created_by_name ?? createdBy?.name ?? null;
  const email = b?.created_by_email ?? createdBy?.email ?? null;

  if (name && email) return `${name} (${email})`;
  if (name) return name;
  if (email) return email;
  return '-';
}

function buildIndexHref(params: Record<string, string | undefined>) {
  const base = bookingsRoutes.index.url();
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') sp.set(k, v);
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

function extractPaginationLinks(bookings: any): LaravelPaginationLink[] {
  const metaLinks = bookings?.meta?.links;
  if (Array.isArray(metaLinks)) return metaLinks;

  const directLinks = bookings?.links;
  if (Array.isArray(directLinks)) return directLinks;

  return [];
}

function normalizeLabel(label: any): string {
  const raw = String(label ?? '');
  return raw.replace(/&laquo;|&raquo;/g, '').replace(/<[^>]*>/g, '').trim();
}

export default function Bookings(props: BookingsPageProps) {
  const page = usePage().props as any;
  const roleNames = getRoleNames(page?.auth);
  const isClient = roleNames.includes('user');

  const defaultSort: SortKey = isClient ? 'newest' : 'upcoming';

  const bookings = props.bookings ?? { data: [] };
  const services = Array.isArray(props.services) ? props.services : [];
  const filters = props.filters ?? {};
  const statusCounts = props.statusCounts ?? {
    all: 0,
    pending: 0,
    active: 0,
    confirmed: 0,
    cancelled: 0,
    declined: 0,
    completed: 0,
  };

  const bookingRows: Booking[] = Array.isArray(bookings?.data) ? bookings.data : [];
  const paginationLinks = extractPaginationLinks(bookings);

  const [selected, setSelected] = useState<Booking | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [bookingStatus, setBookingStatus] = useState<string>(filters.booking_status ?? '');
  const [paymentStatus, setPaymentStatus] = useState<string>(filters.payment_status ?? '');
  const [serviceId, setServiceId] = useState<string>(filters.service_id ? String(filters.service_id) : '');
  const [q, setQ] = useState<string>(filters.q ?? '');
  const [dateFrom, setDateFrom] = useState<string>(filters.date_from ?? '');
  const [dateTo, setDateTo] = useState<string>(filters.date_to ?? '');
  const [sort, setSort] = useState<SortKey>(((filters.sort as SortKey) ?? defaultSort) as SortKey);

  const serviceOptions = useMemo(() => {
    return [...services].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [services]);

  function openDelete(booking: Booking) {
    setSelected(booking);
    setDeleteOpen(true);
  }

  function applyQuery(next?: Partial<Record<string, string | undefined>>) {
    router.get(
      bookingsRoutes.index.url(),
      {
        booking_status: bookingStatus || undefined,
        payment_status: paymentStatus || undefined,
        service_id: serviceId || undefined,
        q: q || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort: sort || undefined,
        ...next,
      },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  }

  const handlePagination = (url: string | null) => (e: React.MouseEvent) => {
    if (!url) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    router.visit(url, { preserveScroll: true, preserveState: true, replace: true });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Bookings" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 px-6">
            <div className="flex items-center justify-between">
              <CardTitle>Bookings</CardTitle>

              <Button asChild size="sm">
                <Link href={bookingsRoutes.create.url()}>New Booking</Link>
              </Button>
            </div>

            {/* Status summary */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { key: 'all', label: 'All', count: statusCounts.all },
                { key: 'pending', label: 'Pending', count: statusCounts.pending },
                { key: 'active', label: 'Active', count: statusCounts.active },
                { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
                { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
                { key: 'declined', label: 'Declined', count: statusCounts.declined },
                { key: 'completed', label: 'Completed', count: statusCounts.completed },
              ].map(({ key, label, count }) => {
                const href = buildIndexHref({
                  booking_status: key === 'all' ? undefined : key,
                  payment_status: paymentStatus || undefined,
                  service_id: serviceId || undefined,
                  q: q || undefined,
                  date_from: dateFrom || undefined,
                  date_to: dateTo || undefined,
                  sort: sort || undefined,
                });

                const activeStatus = String(filters.booking_status ?? '');
                const isActive = key === 'all' ? !activeStatus : activeStatus === key;

                return (
                  <Link key={key} href={href} preserveScroll replace>
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {label}: {count}
                    </Badge>
                  </Link>
                );
              })}
            </div>

            {/* Filters + Sort */}
            <form
              className="grid grid-cols-1 gap-2 lg:grid-cols-8"
              onSubmit={(e) => {
                e.preventDefault();
                applyQuery();
              }}
            >
              <select
                className="border bg-background rounded-md px-2 py-1 text-sm"
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="declined">Declined</option>
                <option value="completed">Completed</option>
              </select>

              <select
                className="border bg-background rounded-md px-2 py-1 text-sm"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="">All payments</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>

              <select
                className="border bg-background rounded-md px-2 py-1 text-sm"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                <option value="">All services</option>
                {serviceOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>

              <Input
                placeholder="Search client/company/email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />

              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

              <select
                className="border bg-background rounded-md px-2 py-1 text-sm"
                value={sort}
                onChange={(e) => {
                  const v = e.target.value as SortKey;
                  setSort(v);

                  router.get(
                    bookingsRoutes.index.url(),
                    {
                      booking_status: bookingStatus || undefined,
                      payment_status: paymentStatus || undefined,
                      service_id: serviceId || undefined,
                      q: q || undefined,
                      date_from: dateFrom || undefined,
                      date_to: dateTo || undefined,
                      sort: v,
                    },
                    { preserveScroll: true, preserveState: true, replace: true },
                  );
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBookingStatus('');
                    setPaymentStatus('');
                    setServiceId('');
                    setQ('');
                    setDateFrom('');
                    setDateTo('');
                    setSort(defaultSort);
                    router.get(bookingsRoutes.index.url(), {}, { preserveScroll: true, replace: true });
                  }}
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardHeader>

          <CardContent>
            <Table>
              <TableCaption>Bookings list</TableCaption>

              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right w-[130px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {bookingRows.map((b) => {
                  const clientEmail = (b as any).client_email ?? '-';
                  const createdBy = getCreatedByLabel(b as any);
                  const isUnviewed = (b as any).is_unviewed_for_current_user === true;

                  const fromRaw = (b as any).booking_date_from ?? null;
                  const toRaw = (b as any).booking_date_to ?? null;

                  const tag = getScheduleTag(fromRaw, toRaw);
                  const duration = formatDuration(fromRaw, toRaw);

                  const startDate = parseScheduleDateTime(fromRaw);
                  const endDate = parseScheduleDateTime(toRaw);

                  const fromIsDateOnly =
                    fromRaw !== null && fromRaw !== undefined
                      ? isDateOnlyString(String(fromRaw).trim())
                      : false;

                  const toIsDateOnly =
                    toRaw !== null && toRaw !== undefined
                      ? isDateOnlyString(String(toRaw).trim())
                      : false;

                  const showToTimeOnly =
                    !!startDate &&
                    !!endDate &&
                    !fromIsDateOnly &&
                    !toIsDateOnly &&
                    sameCalendarDay(startDate, endDate);

                  return (
                    <TableRow
                      key={b.id}
                      className={
                        isUnviewed
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 transition-colors'
                          : 'transition-colors'
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <Link
                            href={bookingsRoutes.show.url({ booking: b.id })}
                            className="hover:underline"
                          >
                            {(b as any).client_name ?? '-'}
                          </Link>

                          <span className="text-xs text-muted-foreground">{clientEmail}</span>

                          {isUnviewed && (
                            <span className="mt-1 inline-flex w-fit items-center rounded-md bg-amber-200/70 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                              NEW
                            </span>
                          )}

                          <span className="text-[11px] text-muted-foreground">
                            Created by: {createdBy}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{(b as any).company_name ?? '-'}</TableCell>
                      <TableCell>{(b as any).type_of_event ?? '-'}</TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {tag && (
                            <Badge className={`w-fit text-[10px] px-2 py-0.5 ${tag.className}`}>
                              {tag.label}
                            </Badge>
                          )}

                          <span>{formatScheduleDateTime(fromRaw)}</span>

                          {toRaw ? (
                            <span className="text-muted-foreground text-xs">
                              to{' '}
                              {showToTimeOnly
                                ? formatScheduleTimeOnly(toRaw) // ✅ if same date, show time only (fixes confusion)
                                : formatScheduleDateTime(toRaw)}{' '}
                              {duration ? ` • ${duration}` : ''}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              No end time{duration ? ` • ${duration}` : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{(b as any).number_of_guests ?? '-'}</TableCell>

                      <TableCell>
                        <BookingStatusBadge status={(b as any).booking_status ?? null} />
                      </TableCell>

                      <TableCell>
                        <PaymentStatusBadge status={(b as any).payment_status ?? null} />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <Link href={bookingsRoutes.edit.url({ booking: b.id })}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>

                          {!isClient && (
                            <Button variant="destructive" size="icon" onClick={() => openDelete(b)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {bookingRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {paginationLinks.length > 0 && (
              <Pagination>
                <PaginationContent>
                  {paginationLinks.map((link: LaravelPaginationLink, i: number) => {
                    const label = normalizeLabel(link.label);
                    const lower = label.toLowerCase();

                    const isPrev = lower.includes('previous');
                    const isNext = lower.includes('next');
                    const isDots = label === '...';

                    return (
                      <PaginationItem key={i}>
                        {isPrev ? (
                          <PaginationPrevious
                            href={link.url ?? '#'}
                            aria-disabled={!link.url}
                            tabIndex={link.url ? 0 : -1}
                            onClick={handlePagination(link.url)}
                          />
                        ) : isNext ? (
                          <PaginationNext
                            href={link.url ?? '#'}
                            aria-disabled={!link.url}
                            tabIndex={link.url ? 0 : -1}
                            onClick={handlePagination(link.url)}
                          />
                        ) : isDots ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={!!link.active}
                            href={link.url ?? '#'}
                            aria-current={link.active ? 'page' : undefined}
                            aria-disabled={!link.url}
                            tabIndex={link.url ? 0 : -1}
                            onClick={handlePagination(link.url)}
                          >
                            {label}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    );
                  })}
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prevent crash: only render when selected exists */}
      {selected && (
        <DeleteBookingDialog
          open={deleteOpen}
          onOpenChange={(v: boolean) => {
            setDeleteOpen(v);
            if (!v) setSelected(null);
          }}
          booking={selected}
        />
      )}
    </AppLayout>
  );
}
