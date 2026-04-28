import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
  bookingCreatePath,
  bookingShowPath,
  bookingWorkspaceCopy,
  cleanLabel,
  extractBookings,
  extractPagination,
  formatDateTime,
  formatMoney,
  normalizeWorkspaceRole,
  type BookingLike,
} from '@/lib/booking-role-ui';
import { Link, router, usePage } from '@inertiajs/react';
import {
  CalendarDays,
  ClipboardList,
  Filter,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type BookingListPageProps = {
  workspaceRole?: string;
  bookings?: unknown;
  filters?: {
    q?: string;
    booking_status?: string;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    sort?: string;
    [key: string]: unknown;
  };
  statusCounts?: Record<string, number>;
  canCreateBooking?: boolean;
  isStaffWorkspace?: boolean;
};

function bookingTitle(booking: BookingLike): string {
  return (
    String(booking.type_of_event || '').trim() ||
    String(booking.company_name || '').trim() ||
    `Booking #${booking.id}`
  );
}

function bookingClient(booking: BookingLike): string {
  return (
    String(booking.company_name || '').trim() ||
    String(booking.client_name || '').trim() ||
    'Client'
  );
}

export function BookingListPage() {
  const { props, url } = usePage<BookingListPageProps>();
  const role = normalizeWorkspaceRole(props.workspaceRole);
  const copy = bookingWorkspaceCopy(role);
  const bookings = useMemo(() => extractBookings(props.bookings), [props.bookings]);
  const pagination = useMemo(() => extractPagination(props.bookings), [props.bookings]);
  const [q, setQ] = useState(String(props.filters?.q ?? ''));
  const [status, setStatus] = useState(String(props.filters?.booking_status ?? ''));

  const canCreate = Boolean(props.canCreateBooking ?? copy.canCreate);
  const basePath =
    role === 'admin'
      ? '/admin/bookings'
      : role === 'manager'
        ? '/manager/bookings'
        : role === 'staff'
          ? '/staff/bookings'
          : '/my-bookings';

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    router.get(
      basePath,
      {
        q: q || undefined,
        booking_status: status || undefined,
      },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
      },
    );
  }

  return (
    <BookingRolePageShell
      role={role}
      actions={
        canCreate ? (
          <Link
            href={bookingCreatePath(role)}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
          >
            <Plus className="mr-2 h-4 w-4" />
            {copy.createLabel}
          </Link>
        ) : null
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {['pending', 'confirmed', 'active', 'completed'].map((key) => (
          <div
            key={key}
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
              {cleanLabel(key)}
            </p>
            <p className="mt-3 text-3xl font-black">
              {Number(props.statusCounts?.[key] ?? 0)}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-sm backdrop-blur sm:p-5">
        <form
          onSubmit={submitFilters}
          className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={
                role === 'user'
                  ? 'Search your bookings...'
                  : 'Search client, company, event, email...'
              }
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 pl-11 pr-4 text-sm outline-none transition placeholder:text-current/40 focus:border-white/25 focus:bg-black/15"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none transition focus:border-white/25"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="declined">Declined</option>
          </select>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-black transition hover:bg-white/15"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-sm backdrop-blur">
        <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
              {copy.listLabel}
            </p>
            <h2 className="mt-1 text-xl font-black">Booking records</h2>
          </div>

          <p className="text-sm opacity-65">
            Showing {bookings.length} record{bookings.length === 1 ? '' : 's'}
          </p>
        </div>

        {bookings.length > 0 ? (
          <div className="divide-y divide-white/10">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={bookingShowPath(role, booking.id)}
                className="grid gap-4 p-5 transition hover:bg-white/[0.06] lg:grid-cols-[1.2fr_0.9fr_0.8fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/15">
                      <ClipboardList className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-base font-black">
                        {bookingTitle(booking)}
                      </p>
                      <p className="mt-1 truncate text-sm opacity-65">
                        {bookingClient(booking)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <CalendarDays className="h-4 w-4 shrink-0 opacity-50" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {formatDateTime(booking.booking_date_from)}
                    </p>
                    <p className="truncate text-xs opacity-55">
                      to {formatDateTime(booking.booking_date_to)}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <Users className="h-4 w-4 shrink-0 opacity-50" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {booking.number_of_guests ?? '—'} guests
                    </p>
                    <p className="truncate text-xs opacity-55">
                      {formatMoney(booking.totals?.items_total)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <BookingStatusBadge value={booking.booking_status} />
                  <BookingStatusBadge value={booking.payment_status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
              <ClipboardList className="h-7 w-7 opacity-70" />
            </div>
            <h3 className="mt-5 text-xl font-black">{copy.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 opacity-65">
              {copy.emptyDescription}
            </p>

            {canCreate ? (
              <Link
                href={bookingCreatePath(role)}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-black transition hover:bg-white/15"
              >
                <Plus className="mr-2 h-4 w-4" />
                {copy.createLabel}
              </Link>
            ) : null}
          </div>
        )}

        {pagination.links.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-white/10 p-5">
            {pagination.links.map((link, index) =>
              link.url ? (
                <Link
                  key={`${link.label}-${index}`}
                  href={link.url}
                  preserveScroll
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    link.active
                      ? 'border-white/20 bg-white/15'
                      : 'border-white/10 bg-black/10 hover:bg-white/10'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label ?? '' }}
                />
              ) : (
                <span
                  key={`${link.label}-${index}`}
                  className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs font-bold opacity-40"
                  dangerouslySetInnerHTML={{ __html: link.label ?? '' }}
                />
              ),
            )}
          </div>
        ) : null}

        {copy.showClientHelp ? (
          <div className="border-t border-white/10 bg-black/[0.08] p-5 text-sm leading-6 opacity-75">
            Your booking is initially treated as a request. BCCC staff will review your details,
            schedule, survey reference, and payment proof before the reservation becomes confirmed.
          </div>
        ) : null}
      </section>
    </BookingRolePageShell>
  );
}
