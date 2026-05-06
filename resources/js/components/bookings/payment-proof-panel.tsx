import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
  bookingPaymentPath,
  cleanLabel,
  formatDateTime,
  formatMoney,
  normalizeWorkspaceRole,
  type BookingLike,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { router, useForm } from '@inertiajs/react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileImage,
  LoaderCircle,
  ReceiptText,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';

type PaymentRecord = {
  id: number | string;
  amount?: number | string | null;
  status?: string | null;
  payment_method?: string | null;
  payment_gateway?: string | null;
  payment_type?: string | null;
  transaction_reference?: string | null;
  proof_image_url?: string | null;
  proof_image_name?: string | null;
  created_at?: string | null;
  paid_at?: string | null;
  verified_at?: string | null;
  approved_at?: string | null;
  declined_at?: string | null;
  failed_at?: string | null;
  remarks?: string | null;
  payer_name?: string | null;
};

type PaymentFormData = {
  payment_method: string;
  payment_gateway: string;
  payment_type: string;
  amount: string;
  transaction_reference: string;
  payer_name: string;
  proof_image: File | null;
  remarks: string;
  status: string;
};

type PaymentProofPanelProps = {
  role?: string | null;
  booking: BookingLike;
  canManagePayments?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function totalValue(booking: BookingLike, key: string): number | string | null {
  const totals = booking.totals as Record<string, number | string | null> | null | undefined;

  return totals?.[key] ?? null;
}

function gatewayLabel(value?: string | null) {
  return cleanLabel(value || 'Manual');
}

function proofPath(role: RoleThemeKey, bookingId: number | string, paymentId: number | string): string {
  return `${bookingPaymentPath(role, bookingId)}/${paymentId}/proof`;
}

function updatePath(role: RoleThemeKey, bookingId: number | string, paymentId: number | string): string {
  return `${bookingPaymentPath(role, bookingId)}/${paymentId}`;
}

function isConfirmedPayment(status?: string | null): boolean {
  return ['confirmed', 'verified', 'paid'].includes(String(status || '').toLowerCase());
}

function isPendingPayment(status?: string | null): boolean {
  return String(status || '').toLowerCase() === 'pending';
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="booking-proof-field">
      <span>
        {label}
        {required ? <strong>*</strong> : null}
      </span>

      {children}

      {error ? (
        <small className="booking-proof-error">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </small>
      ) : null}
    </label>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  icon: typeof ReceiptText;
  tone?: 'default' | 'gold' | 'green' | 'red';
}) {
  return (
    <article className={cx('booking-payment-metric', `tone-${tone}`)}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>

      <Icon className="h-5 w-5" />
    </article>
  );
}

function PaymentHistoryRow({
  payment,
  role,
  bookingId,
  canManagePayments,
  busyId,
  onReview,
}: {
  payment: PaymentRecord;
  role: RoleThemeKey;
  bookingId: number | string;
  canManagePayments: boolean;
  busyId: number | string | null;
  onReview: (payment: PaymentRecord, status: 'confirmed' | 'declined') => void;
}) {
  const busy = String(busyId ?? '') === String(payment.id);

  return (
    <article className="booking-payment-row">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge value={payment.status} />

          <span className="booking-proof-chip">
            {gatewayLabel(payment.payment_gateway ?? payment.payment_method)}
          </span>

          <span className="booking-proof-chip">
            {cleanLabel(payment.payment_type || 'payment')}
          </span>
        </div>

        <p className="mt-4 text-2xl font-semibold tracking-[-0.055em] text-[var(--bccc-backend-text)]">
          {formatMoney(payment.amount)}
        </p>

        <p className="mt-1 text-sm leading-7 text-[var(--bccc-backend-muted)]">
          Ref: {payment.transaction_reference || 'No reference'} · Submitted {formatDateTime(payment.created_at)}
        </p>

        {payment.payer_name ? (
          <p className="mt-1 text-sm leading-7 text-[var(--bccc-backend-muted)]">
            Payer: {payment.payer_name}
          </p>
        ) : null}

        {payment.remarks ? (
          <p className="mt-3 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-3 text-sm leading-7 text-[var(--bccc-backend-muted)]">
            {payment.remarks}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {payment.proof_image_url ? (
          <a
            href={payment.proof_image_url || proofPath(role, bookingId, payment.id)}
            target="_blank"
            rel="noreferrer"
            className="booking-proof-action"
          >
            <ExternalLink className="h-4 w-4" />
            Open Proof
          </a>
        ) : (
          <span className="booking-proof-action is-muted">
            <FileImage className="h-4 w-4" />
            No Proof
          </span>
        )}

        {canManagePayments ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onReview(payment, 'confirmed')}
              className="booking-proof-action is-confirm"
            >
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => onReview(payment, 'declined')}
              className="booking-proof-action is-decline"
            >
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Decline
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function PaymentProofPanel({
  role,
  booking,
  canManagePayments = false,
}: PaymentProofPanelProps) {
  const normalizedRole = normalizeWorkspaceRole(role) as RoleThemeKey;
  const isClient = normalizedRole === 'user';
  const payments = Array.isArray(booking.payments) ? (booking.payments as PaymentRecord[]) : [];

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | string | null>(null);

  const itemsTotal = Number(totalValue(booking, 'items_total') ?? 0);
  const submittedTotal = Number(totalValue(booking, 'submitted_payments_total') ?? 0);
  const confirmedTotal = Number(
    totalValue(booking, 'confirmed_payments_total') ??
      totalValue(booking, 'payments_total') ??
      0,
  );

  const remainingBalance = useMemo(() => {
    const direct = Number(totalValue(booking, 'remaining_balance'));

    if (Number.isFinite(direct) && direct > 0) {
      return String(direct.toFixed(2));
    }

    const remaining = itemsTotal - confirmedTotal;

    if (!Number.isFinite(remaining) || remaining <= 0) {
      return '';
    }

    return String(remaining.toFixed(2));
  }, [booking, itemsTotal, confirmedTotal]);

  const confirmedPayments = payments.filter((payment) => isConfirmedPayment(payment.status));
  const pendingPayments = payments.filter((payment) => isPendingPayment(payment.status));

  const { data, setData, post, processing, errors, reset } = useForm<PaymentFormData>({
    payment_method: 'online',
    payment_gateway: isClient ? 'gcash' : 'manual',
    payment_type: 'down',
    amount: remainingBalance,
    transaction_reference: '',
    payer_name: String(booking.client_name || ''),
    proof_image: null,
    remarks: '',
    status: canManagePayments ? 'confirmed' : 'pending',
  });

  useEffect(() => {
    setData('amount', remainingBalance);
  }, [remainingBalance]);

  useEffect(() => {
    if (!data.proof_image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(data.proof_image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [data.proof_image]);

  const gatewayNeedsProof = ['gcash', 'paypal', 'bank'].includes(data.payment_gateway);
  const gatewayNeedsReference = ['gcash', 'paypal', 'bank', 'card'].includes(data.payment_gateway);

  function submitPayment(event: FormEvent) {
    event.preventDefault();

    post(bookingPaymentPath(normalizedRole, booking.id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset('transaction_reference', 'proof_image', 'remarks');
        setData('amount', remainingBalance);
        setData('status', canManagePayments ? 'confirmed' : 'pending');
      },
    });
  }

  function updatePaymentStatus(payment: PaymentRecord, status: 'confirmed' | 'declined') {
    const message =
      status === 'confirmed'
        ? 'Confirm this payment proof?'
        : 'Decline this payment proof?';

    if (!window.confirm(message)) {
      return;
    }

    setBusyId(payment.id);

    router.put(
      updatePath(normalizedRole, booking.id, payment.id),
      {
        status,
        payment_method: payment.payment_method || 'manual',
        payment_gateway: payment.payment_gateway || 'manual',
        payment_type: payment.payment_type || 'down',
        amount: payment.amount || 0,
        transaction_reference: payment.transaction_reference || '',
        payer_name: payment.payer_name || '',
        remarks:
          status === 'confirmed'
            ? 'Payment proof reviewed and confirmed.'
            : 'Payment proof reviewed and declined.',
      },
      {
        preserveScroll: true,
        onFinish: () => setBusyId(null),
      },
    );
  }

  return (
    <section className="booking-payment-panel">
      <header className="booking-section-header">
        <div>
          <p>Payment Compliance</p>
          <h2>{isClient ? 'Submit payment proof' : 'Record or review payment'}</h2>
          <span>
            Upload proof, track pending review, and monitor confirmed payments against the booking total.
          </span>
        </div>

        <CreditCard className="h-8 w-8 text-[var(--bccc-backend-gold)]" />
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Booking Total" value={formatMoney(itemsTotal)} icon={ReceiptText} />
        <MetricCard label="Submitted" value={formatMoney(submittedTotal)} icon={UploadCloud} tone="gold" />
        <MetricCard label="Confirmed" value={formatMoney(confirmedTotal)} icon={ShieldCheck} tone="green" />
        <MetricCard label="Remaining" value={formatMoney(remainingBalance || 0)} icon={Banknote} tone={Number(remainingBalance) > 0 ? 'red' : 'green'} />
      </div>

      {isClient ? (
        <div className="booking-payment-help">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            Your submitted proof starts as <strong>Pending</strong>. BCCC staff must verify it before it counts as confirmed payment.
          </p>
        </div>
      ) : null}

      <form onSubmit={submitPayment} className="booking-payment-form">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Payer Name" error={errors.payer_name}>
            <input
              value={data.payer_name}
              onChange={(event) => setData('payer_name', event.target.value)}
              className="backend-booking-input"
              placeholder="Name of payer"
            />
          </Field>

          <Field label="Amount" required error={errors.amount}>
            <input
              value={data.amount}
              onChange={(event) => setData('amount', event.target.value)}
              className="backend-booking-input"
              placeholder="0.00"
              inputMode="decimal"
            />
          </Field>

          <Field label="Payment Gateway" required error={errors.payment_gateway}>
            <select
              value={data.payment_gateway}
              onChange={(event) => {
                const gateway = event.target.value;

                setData('payment_gateway', gateway);
                setData('payment_method', gateway === 'cash' ? 'cash' : gateway === 'card' ? 'card' : 'online');
              }}
              className="backend-booking-input"
            >
              <option value="gcash">GCash</option>
              <option value="paypal">PayPal</option>
              <option value="bank">Bank Transfer</option>
              {canManagePayments ? <option value="cash">Cash</option> : null}
              {canManagePayments ? <option value="manual">Manual</option> : null}
              <option value="card">Card</option>
            </select>
          </Field>

          <Field label="Payment Type" required error={errors.payment_type}>
            <select
              value={data.payment_type}
              onChange={(event) => setData('payment_type', event.target.value)}
              className="backend-booking-input"
            >
              <option value="down">Down Payment</option>
              <option value="full">Full Payment</option>
              <option value="balance">Remaining Balance</option>
            </select>
          </Field>

          {canManagePayments ? (
            <Field label="Review Status" required error={errors.status}>
              <select
                value={data.status}
                onChange={(event) => setData('status', event.target.value)}
                className="backend-booking-input"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="verified">Verified</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="declined">Declined</option>
                <option value="refunded">Refunded</option>
              </select>
            </Field>
          ) : null}

          <Field
            label="Transaction Reference"
            required={gatewayNeedsReference}
            error={errors.transaction_reference}
          >
            <input
              value={data.transaction_reference}
              onChange={(event) => setData('transaction_reference', event.target.value)}
              className="backend-booking-input"
              placeholder="Reference number / confirmation code"
            />
          </Field>
        </div>

        <Field label="Payment Proof Image" required={gatewayNeedsProof} error={errors.proof_image}>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setData('proof_image', event.target.files?.[0] ?? null)}
            className="backend-booking-file"
          />
        </Field>

        {previewUrl ? (
          <div className="booking-payment-preview">
            <img src={previewUrl} alt="Payment proof preview" />
          </div>
        ) : null}

        <Field label="Remarks" error={errors.remarks}>
          <textarea
            value={data.remarks}
            onChange={(event) => setData('remarks', event.target.value)}
            rows={3}
            className="backend-booking-input min-h-[100px] py-3"
            placeholder="Optional notes"
          />
        </Field>

        <footer className="booking-payment-submit-row">
          <p>
            {gatewayNeedsProof
              ? 'Proof image and transaction reference are required for this gateway.'
              : 'Cash/manual records may only be saved by authorized internal users.'}
          </p>

          <button type="submit" disabled={processing} className="booking-payment-submit">
            {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isClient ? 'Submit Payment Proof' : 'Save Payment Record'}
          </button>
        </footer>
      </form>

      <section className="booking-payment-history">
        <header className="booking-section-subheader">
          <div>
            <p>Payment History</p>
            <h3>
              {payments.length} record{payments.length === 1 ? '' : 's'}
            </h3>
          </div>

          <ReceiptText className="h-5 w-5 text-[var(--bccc-backend-gold)]" />
        </header>

        {payments.length > 0 ? (
          <div className="grid gap-3">
            {payments.map((payment) => (
              <PaymentHistoryRow
                key={payment.id}
                payment={payment}
                role={normalizedRole}
                bookingId={booking.id}
                canManagePayments={canManagePayments}
                busyId={busyId}
                onReview={updatePaymentStatus}
              />
            ))}
          </div>
        ) : (
          <div className="booking-empty-proof">
            <ReceiptText className="mx-auto h-10 w-10 text-[var(--bccc-backend-gold)]" />
            <h4>No payment records yet</h4>
            <p>Payment submissions and staff-recorded payments will appear here.</p>
          </div>
        )}

        {confirmedPayments.length > 0 || pendingPayments.length > 0 ? (
          <div className="booking-payment-review-note">
            <p>
              <strong>{pendingPayments.length}</strong> pending review ·{' '}
              <strong>{confirmedPayments.length}</strong> confirmed/verified/paid record
              {confirmedPayments.length === 1 ? '' : 's'}.
            </p>
          </div>
        ) : null}
      </section>
    </section>
  );
}
