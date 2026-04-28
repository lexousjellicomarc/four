import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { PaymentProofPanel } from '@/components/bookings/payment-proof-panel';
import {
  bookingBasePath,
  bookingEditPath,
  bookingProofPath,
  bookingSurveyPath,
  cleanLabel,
  formatDateTime,
  formatMoney,
  normalizeWorkspaceRole,
  type BookingLike,
} from '@/lib/booking-role-ui';
import { Link, router, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  FileImage,
  Trash2,
  UserRound,
} from 'lucide-react';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { pushFeedback } from '@/lib/feedback';

pushFeedback({
  type: 'success',
  title: 'Saved',
  message: 'Your changes were saved successfully.',
});

type BookingShowPageProps = {
  workspaceRole?: string;
  booking?: BookingLike;
  isStaffWorkspace?: boolean;
  canUpdateBooking?: boolean;
  canDeleteBooking?: boolean;
  canManagePayments?: boolean;
};

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-50">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold">{value || 'Not set'}</p>
    </div>
  );
}

export function BookingShowPage() {
  const { props } = usePage<BookingShowPageProps>();
  const role = normalizeWorkspaceRole(props.workspaceRole);
  const booking = props.booking;

  if (!booking) {
    return (
      <BookingRolePageShell role={role} title="Booking not found">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
          <p className="text-sm opacity-70">The booking record could not be loaded.</p>
          <Link
            href={bookingBasePath(role)}
            className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold"
          >
            Back to bookings
          </Link>
        </div>
      </BookingRolePageShell>
    );
  }

  const canUpdate = Boolean(props.canUpdateBooking);
  const canDelete = Boolean(props.canDeleteBooking);
  const canManagePayments = Boolean(props.canManagePayments);
  const isUser = role === 'user';

  function deleteBooking() {
    router.delete(bookingBasePath(role) + `/${booking.id}`, {
      preserveScroll: false,
    });
  }

  return (
    <BookingRolePageShell
      role={role}
      title={String(booking.type_of_event || `Booking #${booking.id}`)}
      description={
        isUser
          ? 'Review your booking request, complete survey proof, and submit payment proof for review.'
          : 'Review booking details, client information, schedule, survey proof, payment proof, and internal actions.'
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={bookingBasePath(role)}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>

          {canUpdate ? (
            <Link
              href={bookingEditPath(role, booking.id)}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </Link>
          ) : null}

          {canDelete ? (
            <ConfirmAction
            tone="danger"
            title="Delete Booking"
            message="Delete this booking record? This action cannot be undone."
            confirmLabel="Delete Booking"
            onConfirm={deleteBooking}
            className="inline-flex items-center justify-center rounded-full border border-red-300/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-100 shadow-sm backdrop-blur transition hover:bg-red-500/15"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ConfirmAction>
          ) : null}
        </div>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                  Booking #{booking.id}
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {booking.type_of_event || 'Event Booking'}
                </h2>
                <p className="mt-1 text-sm opacity-65">
                  {booking.company_name || booking.client_name || 'Client'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <BookingStatusBadge value={booking.booking_status} />
                <BookingStatusBadge value={booking.payment_status} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Client Name" value={booking.client_name} />
            <InfoItem label="Company / Organization" value={booking.company_name} />
            <InfoItem label="Email" value={booking.client_email} />
            <InfoItem label="Contact Number" value={booking.client_contact_number} />
            <InfoItem label="Address" value={booking.client_address} />
            <InfoItem label="Guests" value={booking.number_of_guests} />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 opacity-70" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                  Schedule
                </p>
                <h3 className="text-lg font-black">Booking date and time</h3>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="From" value={formatDateTime(booking.booking_date_from)} />
              <InfoItem label="To" value={formatDateTime(booking.booking_date_to)} />
            </div>
          </div>

          <PaymentProofPanel
            role={role}
            booking={booking}
            canManagePayments={canManagePayments}
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <UserRound className="h-5 w-5 opacity-70" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                  Requirements
                </p>
                <h3 className="text-lg font-black">
                  {isUser ? 'Next steps' : 'Booking checklist'}
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href={bookingSurveyPath(role, booking.id)}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/[0.08] px-4 py-3 text-sm font-bold transition hover:bg-white/[0.06]"
              >
                Continue Survey Reference
                <FileImage className="h-4 w-4 opacity-70" />
              </Link>

              {booking.survey_proof_image_url ? (
                <a
                  href={bookingProofPath(role, booking.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/[0.08] px-4 py-3 text-sm font-bold transition hover:bg-white/[0.06]"
                >
                  View Survey Proof
                  <FileImage className="h-4 w-4 opacity-70" />
                </a>
              ) : (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                  Survey proof is still missing.
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <InfoItem label="Survey Email" value={booking.survey_email} />
              <InfoItem label="Total Charges" value={formatMoney(booking.totals?.items_total)} />
              <InfoItem label="Confirmed Payments" value={formatMoney(booking.totals?.confirmed_payments_total)} />
              <InfoItem label="Remaining Balance" value={formatMoney(booking.totals?.remaining_balance)} />
              <InfoItem label="Payment Status" value={cleanLabel(booking.payment_status)} />
            </div>

            {isUser ? (
              <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                Your booking remains under review until BCCC validates the schedule,
                survey reference, and payment compliance.
              </p>
            ) : null}
          </div>
        </aside>
      </section>
    </BookingRolePageShell>
  );
}
