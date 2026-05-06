import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { PaymentProofPanel } from '@/components/bookings/payment-proof-panel';
import {
  bookingBasePath,
  bookingEditPath,
  bookingSurveyPath,
  cleanLabel,
  formatDateTime,
  formatMoney,
  normalizeWorkspaceRole,
  type BookingLike,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, router, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileSpreadsheet,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react';
import type { ReactNode } from 'react';

type BookingItem = {
  id?: number | string;
  service_id?: number | string;
  service_name?: string | null;
  service_type_name?: string | null;
  area?: string | null;
  quantity?: number | string | null;
  price?: number | string | null;
  unit_price?: number | string | null;
  line_total?: number | string | null;
};

type LifecycleEvent = {
  id?: number | string;
  event_key?: string | null;
  title?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  from_payment_status?: string | null;
  to_payment_status?: string | null;
  reason?: string | null;
  event_at?: string | null;
  created_at?: string | null;
  actor?: {
    id?: number | string;
    name?: string | null;
    email?: string | null;
  } | null;
};

type BookingShowPageProps = {
  workspaceRole?: string;
  booking?: BookingLike;
  canUpdateBooking?: boolean;
  canDeleteBooking?: boolean;
  canManagePayments?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function safeText(value: unknown, fallback = 'Not set'): string {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }

  return String(value);
}

function totalValue(booking: BookingLike, key: string): number | string | null {
  const totals = booking.totals as Record<string, number | string | null> | null | undefined;

  return totals?.[key] ?? null;
}

function bookingItems(booking: BookingLike): BookingItem[] {
  return Array.isArray(booking.items) ? (booking.items as BookingItem[]) : [];
}

function lifecycleEvents(booking: BookingLike): LifecycleEvent[] {
  const rows = Array.isArray(booking.lifecycle_events)
    ? (booking.lifecycle_events as LifecycleEvent[])
    : [];

  return [...rows].reverse();
}

function hasMiceReport(booking: BookingLike): boolean {
  return Boolean(
    (booking as any).mice_report_submitted ||
      (booking as any).mice_report?.submitted_at ||
      (booking as any).mice_report_status === 'submitted',
  );
}

function isPaidEnough(booking: BookingLike): boolean {
  const remaining = Number(totalValue(booking, 'remaining_balance') ?? 0);
  const confirmed = Number(totalValue(booking, 'confirmed_payments_total') ?? totalValue(booking, 'payments_total') ?? 0);
  const total = Number(totalValue(booking, 'items_total') ?? 0);

  return total <= 0 || remaining <= 0 || confirmed >= total;
}

function bookingProgressSteps(booking: BookingLike) {
  const status = String(booking.booking_status || '').toLowerCase();
  const paymentStatus = String(booking.payment_status || '').toLowerCase();

  return [
    {
      label: 'Booking Submitted',
      description: 'The reservation request is recorded in the system.',
      done: Boolean(booking.id),
    },
    {
      label: 'MICE Report',
      description: 'The built-in MICE report must be completed for this booking request.',
      done: hasMiceReport(booking),
    },
    {
      label: 'Payment Compliance',
      description: 'Required payment proof should be submitted and confirmed.',
      done: isPaidEnough(booking) || ['paid'].includes(paymentStatus),
    },
    {
      label: 'Office Confirmation',
      description: 'The office confirms or completes the booking lifecycle.',
      done: ['confirmed', 'active', 'completed'].includes(status),
    },
  ];
}

function DetailCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: ReactNode;
  icon?: typeof UserRound;
}) {
  return (
    <article className="booking-show-detail-card">
      {Icon ? (
        <span>
          <Icon className="h-4 w-4" />
        </span>
      ) : null}

      <div>
        <p>{label}</p>
        <strong>{value || 'Not set'}</strong>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  icon: typeof CalendarDays;
  tone?: 'default' | 'gold' | 'green' | 'red';
}) {
  return (
    <article className={cx('booking-show-summary-card', `tone-${tone}`)}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>

      <Icon className="h-5 w-5" />
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: typeof CalendarDays;
}) {
  return (
    <header className="booking-section-header">
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <span>{description}</span> : null}
      </div>

      <Icon className="h-8 w-8 text-[var(--bccc-backend-gold)]" />
    </header>
  );
}

function TimelineEvent({ item }: { item: LifecycleEvent }) {
  return (
    <article className="booking-timeline-event">
      <div className="booking-timeline-dot" />

      <div className="min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4>{safeText(item.title, cleanLabel(item.event_key || 'Booking activity'))}</h4>
            <p>{formatDateTime(item.event_at || item.created_at)}</p>
          </div>

          {item.actor?.name ? (
            <span className="booking-proof-chip">{item.actor.name}</span>
          ) : null}
        </div>

        {item.reason ? <p className="mt-3 text-sm leading-7 text-[var(--bccc-backend-muted)]">{item.reason}</p> : null}

        {(item.from_status || item.to_status || item.from_payment_status || item.to_payment_status) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.from_status || item.to_status ? (
              <span className="booking-proof-chip">
                {cleanLabel(item.from_status || '—')} → {cleanLabel(item.to_status || '—')}
              </span>
            ) : null}

            {item.from_payment_status || item.to_payment_status ? (
              <span className="booking-proof-chip">
                Payment: {cleanLabel(item.from_payment_status || '—')} → {cleanLabel(item.to_payment_status || '—')}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ProgressTracker({ booking }: { booking: BookingLike }) {
  const steps = bookingProgressSteps(booking);

  return (
    <section className="booking-progress-panel">
      <SectionHeader
        eyebrow="Booking Progress"
        title="Reservation tracking"
        description="Follow the required steps from submission to office confirmation."
        icon={ShieldCheck}
      />

      <div className="booking-progress-grid">
        {steps.map((step, index) => (
          <article key={step.label} className={cx('booking-progress-step', step.done && 'is-done')}>
            <span>{step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>

            <div>
              <h3>{step.label}</h3>
              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ItemsTable({ booking }: { booking: BookingLike }) {
  const items = bookingItems(booking);

  if (items.length === 0) {
    return (
      <div className="booking-empty-proof">
        <PackageCheck className="mx-auto h-10 w-10 text-[var(--bccc-backend-gold)]" />
        <h4>No booking items linked yet</h4>
        <p>The reservation item list will appear once the selected service is synced.</p>
      </div>
    );
  }

  return (
    <div className="booking-items-table">
      {items.map((item, index) => (
        <article key={`${item.id ?? item.service_id ?? index}`} className="booking-item-row">
          <div>
            <p>{item.area || item.service_type_name || 'Venue Area'}</p>
            <h4>{item.service_name || 'Service / rental option'}</h4>
          </div>

          <div>
            <span>Qty {item.quantity ?? 1}</span>
            <strong>{formatMoney(item.line_total ?? item.price ?? item.unit_price ?? 0)}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}

function MiceRequirementPanel({
  role,
  booking,
}: {
  role: RoleThemeKey;
  booking: BookingLike;
}) {
  const submitted = hasMiceReport(booking);
  const report = (booking as any).mice_report;

  return (
    <section className="booking-show-panel">
      <SectionHeader
        eyebrow="Requirements"
        title="MICE report"
        description="Built-in MICE report status for this booking request."
        icon={FileSpreadsheet}
      />

      <div className="grid gap-3">
        <DetailCard
          label="MICE Report Status"
          value={submitted ? 'Submitted' : 'Required'}
          icon={FileSpreadsheet}
        />

        {report?.record_no ? (
          <DetailCard
            label="MICE Record No."
            value={`${report.record_no} / ${report.year_recorded || ''}`}
            icon={ReceiptText}
          />
        ) : null}

        {report?.event_category ? (
          <DetailCard
            label="MICE Category"
            value={report.event_category}
            icon={ShieldCheck}
          />
        ) : null}

        {!submitted ? (
          <div className="booking-missing-proof">
            <FileSpreadsheet className="h-8 w-8" />
            <h4>MICE report required</h4>
            <p>The client must complete the built-in MICE report before payment proof and final confirmation.</p>

            <Link href={bookingSurveyPath(role, booking.id)} className="booking-primary-action">
              Complete MICE Report
            </Link>
          </div>
        ) : (
          <div className="booking-missing-proof is-complete">
            <CheckCircle2 className="h-8 w-8" />
            <h4>MICE report submitted</h4>
            <p>This booking already has a submitted MICE report linked to the registry.</p>

            <Link href={bookingSurveyPath(role, booking.id)} className="booking-secondary-action">
              View / Update MICE Report
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function BookingShowPage() {
  const { props } = usePage<BookingShowPageProps>();
  const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
  const booking = props.booking;

  if (!booking) {
    return (
      <BookingRolePageShell
        role={role}
        title="Booking not found"
        description="The booking record could not be loaded."
      >
        <Link href={bookingBasePath(role)} className="booking-ghost-action">
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>
      </BookingRolePageShell>
    );
  }

  const canUpdate = Boolean(props.canUpdateBooking);
  const canDelete = Boolean(props.canDeleteBooking);
  const canManagePayments = Boolean(props.canManagePayments);
  const isUser = role === 'user';

  const serviceName = safeText(
    booking.service_name ??
      (booking.service as { name?: string | null } | null | undefined)?.name,
    'Venue not set',
  );

  const companyName = safeText(booking.company_name, safeText(booking.client_name, 'Client not set'));

  const itemsTotal = totalValue(booking, 'items_total') ?? 0;
  const submittedTotal = totalValue(booking, 'submitted_payments_total') ?? 0;
  const confirmedTotal = totalValue(booking, 'confirmed_payments_total') ?? totalValue(booking, 'payments_total') ?? 0;
  const remainingBalance =
    totalValue(booking, 'remaining_balance') ??
    Math.max(Number(itemsTotal) - Number(confirmedTotal), 0);

  const events = lifecycleEvents(booking);

  function deleteBooking() {
    if (!window.confirm('Delete this booking record? This action cannot be undone.')) return;

    router.delete(`${bookingBasePath(role)}/${booking.id}`, {
      preserveScroll: false,
    });
  }

  return (
    <BookingRolePageShell
      role={role}
      title={`Booking #${booking.id}`}
      description={`${safeText(booking.type_of_event, 'Event Booking')} · ${companyName} · ${serviceName}`}
      actions={
        <>
          <Link href={bookingBasePath(role)} className="booking-ghost-action">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          {canUpdate ? (
            <Link href={bookingEditPath(role, booking.id)} className="booking-secondary-action">
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          ) : null}

          {canDelete ? (
            <button type="button" onClick={deleteBooking} className="booking-danger-action">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : null}
        </>
      }
    >
      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Booking Status" value={<BookingStatusBadge value={booking.booking_status} />} icon={ShieldCheck} />
          <SummaryCard label="Payment Status" value={<BookingStatusBadge value={booking.payment_status} />} icon={WalletCards} tone={isPaidEnough(booking) ? 'green' : 'gold'} />
          <SummaryCard label="MICE Report" value={hasMiceReport(booking) ? 'Submitted' : 'Required'} icon={FileSpreadsheet} tone={hasMiceReport(booking) ? 'green' : 'red'} />
          <SummaryCard label="Remaining" value={formatMoney(remainingBalance)} icon={ReceiptText} tone={Number(remainingBalance) > 0 ? 'red' : 'green'} />
        </div>

        <ProgressTracker booking={booking} />

        {isUser ? (
          <section className="booking-user-next-actions">
            <div>
              <p>Next Required Actions</p>
              <h2>Complete your requirements</h2>
              <span>
                Your booking remains under review until BCCC validates the schedule, required MICE report, and payment compliance.
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link href={bookingSurveyPath(role, booking.id)} className="booking-primary-action">
                <FileSpreadsheet className="h-4 w-4" />
                Complete MICE Report
              </Link>

              <a href="#payment-proof" className="booking-secondary-action">
                <ReceiptText className="h-4 w-4" />
                Submit Payment Proof
              </a>
            </div>
          </section>
        ) : null}

        <section className="booking-show-grid">
          <main className="grid gap-5">
            <section className="booking-show-panel">
              <SectionHeader
                eyebrow="Reservation Schedule"
                title="Date, venue, and guest count"
                description="Operational schedule and selected venue package for this booking."
                icon={CalendarDays}
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DetailCard label="Venue / Service" value={serviceName} icon={PackageCheck} />
                <DetailCard label="Start" value={formatDateTime(booking.booking_date_from)} icon={Clock3} />
                <DetailCard label="End" value={formatDateTime(booking.booking_date_to)} icon={CalendarDays} />
                <DetailCard label="Guests" value={booking.number_of_guests} icon={Users} />
              </div>
            </section>

            <section className="booking-show-panel">
              <SectionHeader
                eyebrow="Client Information"
                title="Contact and organization details"
                description="These are the official client details attached to the reservation."
                icon={UserRound}
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailCard label="Client Name" value={booking.client_name} icon={UserRound} />
                <DetailCard label="Company / Organization" value={booking.company_name} icon={Building2} />
                <DetailCard label="Email" value={booking.client_email} icon={Mail} />
                <DetailCard label="Contact Number" value={booking.client_contact_number} icon={Phone} />
                <DetailCard label="Address" value={booking.client_address} icon={MapPin} />
                <DetailCard label="Head of Organization" value={booking.head_of_organization as string | null} icon={ShieldCheck} />
              </div>
            </section>

            <section className="booking-show-panel">
              <SectionHeader
                eyebrow="Booking Items"
                title="Venue and rental breakdown"
                description="Items synced from the selected services and booking package."
                icon={PackageCheck}
              />

              <ItemsTable booking={booking} />
            </section>

            <section id="payment-proof">
              <PaymentProofPanel
                role={role}
                booking={booking}
                canManagePayments={canManagePayments}
              />
            </section>
          </main>

          <aside className="grid gap-5 self-start xl:sticky xl:top-28">
            <MiceRequirementPanel role={role} booking={booking} />

            <section className="booking-show-panel">
              <SectionHeader
                eyebrow="Financial Summary"
                title="Payment overview"
                icon={ReceiptText}
              />

              <div className="grid gap-3">
                <DetailCard label="Booking Total" value={formatMoney(itemsTotal)} icon={ReceiptText} />
                <DetailCard label="Submitted Payments" value={formatMoney(submittedTotal)} icon={ReceiptText} />
                <DetailCard label="Confirmed Payments" value={formatMoney(confirmedTotal)} icon={ShieldCheck} />
                <DetailCard label="Remaining Balance" value={formatMoney(remainingBalance)} icon={WalletCards} />
              </div>
            </section>

            <section className="booking-show-panel">
              <SectionHeader
                eyebrow="Activity Timeline"
                title="Lifecycle history"
                description="Recent booking and payment status movement."
                icon={Clock3}
              />

              {events.length > 0 ? (
                <div className="booking-timeline-list">
                  {events.slice(0, 8).map((event) => (
                    <TimelineEvent key={`${event.id}-${event.event_at || event.created_at}`} item={event} />
                  ))}
                </div>
              ) : (
                <div className="booking-empty-proof">
                  <Clock3 className="mx-auto h-10 w-10 text-[var(--bccc-backend-gold)]" />
                  <h4>No timeline yet</h4>
                  <p>Lifecycle updates will appear once the booking is reviewed or updated.</p>
                </div>
              )}
            </section>
          </aside>
        </section>
      </section>
    </BookingRolePageShell>
  );
}
