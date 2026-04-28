import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
  bookingPaymentPath,
  cleanLabel,
  formatDateTime,
  formatMoney,
  normalizeWorkspaceRole,
  type BookingLike,
} from '@/lib/booking-role-ui';
import type { RoleKey } from '@/lib/role-workspaces';
import { router, useForm } from '@inertiajs/react';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileImage,
  Loader2,
  ReceiptText,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type PaymentProofPanelProps = {
  role?: string | null;
  booking: BookingLike;
  canManagePayments?: boolean;
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
  marketing_consent: boolean;
  card_holder_name: string;
  card_number: string;
  card_expiration: string;
  card_cvc: string;
};

function gatewayLabel(value: string) {
  if (value === 'gcash') return 'GCash';
  if (value === 'paypal') return 'PayPal';
  if (value === 'bank') return 'Bank Transfer';
  if (value === 'cash') return 'Cash';
  if (value === 'card') return 'Card';
  return 'Manual';
}

function paymentProofPath(role: RoleKey, bookingId: number | string, paymentId: number | string): string {
  const base = bookingPaymentPath(role, bookingId);
  return `${base}/${paymentId}/proof`;
}

function paymentUpdatePath(role: RoleKey, bookingId: number | string, paymentId: number | string): string {
  const base = bookingPaymentPath(role, bookingId);
  return `${base}/${paymentId}`;
}

export function PaymentProofPanel({
  role,
  booking,
  canManagePayments = false,
}: PaymentProofPanelProps) {
  const normalizedRole = normalizeWorkspaceRole(role);
  const isClient = normalizedRole === 'user';
  const payments = Array.isArray(booking.payments) ? booking.payments : [];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const remainingBalance = useMemo(() => {
    const total = Number(booking.totals?.items_total ?? 0);
    const confirmed = Number(booking.totals?.confirmed_payments_total ?? booking.totals?.payments_total ?? 0);
    const remaining = total - confirmed;

    if (!Number.isFinite(remaining) || remaining <= 0) return '';

    return String(remaining.toFixed(2));
  }, [booking.totals?.confirmed_payments_total, booking.totals?.items_total, booking.totals?.payments_total]);

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
    marketing_consent: false,
    card_holder_name: '',
    card_number: '',
    card_expiration: '',
    card_cvc: '',
  });

  useEffect(() => {
    if (!data.proof_image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(data.proof_image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [data.proof_image]);

  const gatewayNeedsProof = ['gcash', 'paypal'].includes(data.payment_gateway);
  const isCard = data.payment_gateway === 'card';

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    post(bookingPaymentPath(normalizedRole, booking.id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset(
          'transaction_reference',
          'proof_image',
          'remarks',
          'card_holder_name',
          'card_number',
          'card_expiration',
          'card_cvc',
        );
        setData('amount', remainingBalance);
        setData('status', canManagePayments ? 'confirmed' : 'pending');
      },
    });
  }

  function updatePaymentStatus(paymentId: number | string, status: string) {
    const payment = payments.find((item) => String(item.id) === String(paymentId));

    router.put(
      paymentUpdatePath(normalizedRole, booking.id, paymentId),
      {
        status,
        payment_method: payment?.payment_method || 'manual',
        payment_gateway: 'manual',
        payment_type: 'down',
        amount: payment?.amount || 0,
        transaction_reference: payment?.transaction_reference || '',
        payer_name: '',
        remarks:
          status === 'confirmed'
            ? 'Payment proof reviewed and confirmed.'
            : status === 'declined'
              ? 'Payment proof reviewed and declined.'
              : 'Payment status updated.',
      },
      {
        preserveScroll: true,
      },
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
              Payment Compliance
            </p>
            <h3 className="mt-1 text-xl font-black">
              {isClient ? 'Submit payment proof' : 'Record or review payment'}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 opacity-65">
              {isClient
                ? 'Upload your payment screenshot and transaction reference. Staff will review it before marking the payment as confirmed.'
                : 'Record a payment, attach proof when available, and review submitted client payment records.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <BookingStatusBadge value={booking.payment_status} />
            <span className="inline-flex items-center rounded-full border border-white/10 bg-black/[0.08] px-3 py-1 text-xs font-black uppercase tracking-[0.12em]">
              Balance {formatMoney(booking.totals?.remaining_balance)}
            </span>
          </div>
        </div>

        <form onSubmit={submitPayment} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Payer Name
              </span>
              <input
                value={data.payer_name}
                onChange={(event) => setData('payer_name', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none transition focus:border-white/25"
                placeholder="Name of payer"
              />
              {errors.payer_name ? <p className="text-xs font-bold text-red-300">{errors.payer_name}</p> : null}
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Amount
              </span>
              <input
                value={data.amount}
                onChange={(event) => setData('amount', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none transition focus:border-white/25"
                placeholder="0.00"
                inputMode="decimal"
              />
              {errors.amount ? <p className="text-xs font-bold text-red-300">{errors.amount}</p> : null}
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Gateway
              </span>
              <select
                value={data.payment_gateway}
                onChange={(event) => {
                  const gateway = event.target.value;
                  setData('payment_gateway', gateway);
                  setData('payment_method', gateway === 'cash' ? 'cash' : 'online');
                }}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none transition focus:border-white/25"
              >
                <option value="gcash">GCash</option>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="manual">Manual</option>
              </select>
              {errors.payment_gateway ? <p className="text-xs font-bold text-red-300">{errors.payment_gateway}</p> : null}
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Payment Type
              </span>
              <select
                value={data.payment_type}
                onChange={(event) => setData('payment_type', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none transition focus:border-white/25"
              >
                <option value="down">Down Payment</option>
                <option value="full">Full Payment</option>
              </select>
              {errors.payment_type ? <p className="text-xs font-bold text-red-300">{errors.payment_type}</p> : null}
            </label>
          </div>

          {canManagePayments ? (
            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Review Status
              </span>
              <select
                value={data.status}
                onChange={(event) => setData('status', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none transition focus:border-white/25 md:max-w-sm"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="failed">Failed</option>
                <option value="declined">Declined</option>
                <option value="refunded">Refunded</option>
              </select>
              {errors.status ? <p className="text-xs font-bold text-red-300">{errors.status}</p> : null}
            </label>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Transaction Reference
                {gatewayNeedsProof ? <span className="ml-1 text-red-300">*</span> : null}
              </span>
              <input
                value={data.transaction_reference}
                onChange={(event) => setData('transaction_reference', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none transition focus:border-white/25"
                placeholder="Reference number / confirmation code"
              />
              {errors.transaction_reference ? (
                <p className="text-xs font-bold text-red-300">{errors.transaction_reference}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Proof Image
                {gatewayNeedsProof ? <span className="ml-1 text-red-300">*</span> : null}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) => setData('proof_image', event.target.files?.[0] ?? null)}
                className="block h-11 w-full cursor-pointer rounded-2xl border border-white/10 bg-black/10 text-sm file:mr-4 file:h-full file:border-0 file:bg-white/10 file:px-4 file:text-sm file:font-bold file:text-current hover:file:bg-white/15"
              />
              {errors.proof_image ? <p className="text-xs font-bold text-red-300">{errors.proof_image}</p> : null}
            </label>
          </div>

          {isCard ? (
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-black/[0.08] p-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Card Holder
                </span>
                <input
                  value={data.card_holder_name}
                  onChange={(event) => setData('card_holder_name', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none"
                />
                {errors.card_holder_name ? <p className="text-xs font-bold text-red-300">{errors.card_holder_name}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Card Number
                </span>
                <input
                  value={data.card_number}
                  onChange={(event) => setData('card_number', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none"
                  inputMode="numeric"
                />
                {errors.card_number ? <p className="text-xs font-bold text-red-300">{errors.card_number}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Expiration
                </span>
                <input
                  value={data.card_expiration}
                  onChange={(event) => setData('card_expiration', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none"
                  placeholder="MM/YY"
                />
                {errors.card_expiration ? <p className="text-xs font-bold text-red-300">{errors.card_expiration}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  CVC
                </span>
                <input
                  value={data.card_cvc}
                  onChange={(event) => setData('card_cvc', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none"
                  inputMode="numeric"
                />
                {errors.card_cvc ? <p className="text-xs font-bold text-red-300">{errors.card_cvc}</p> : null}
              </label>
            </div>
          ) : null}

          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
              Remarks
            </span>
            <textarea
              value={data.remarks}
              onChange={(event) => setData('remarks', event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm outline-none transition focus:border-white/25"
              placeholder={isClient ? 'Optional note for BCCC staff...' : 'Internal remarks or review notes...'}
            />
            {errors.remarks ? <p className="text-xs font-bold text-red-300">{errors.remarks}</p> : null}
          </label>

          {previewUrl ? (
            <div className="rounded-3xl border border-white/10 bg-black/[0.08] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Proof preview
              </p>
              <img
                src={previewUrl}
                alt="Payment proof preview"
                className="max-h-80 w-full rounded-2xl object-contain"
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={processing}
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/12 px-6 text-sm font-black transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            {isClient ? 'Submit Payment Proof' : 'Save Payment Record'}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
              Payment History
            </p>
            <h3 className="mt-1 text-xl font-black">
              Submitted payments
            </h3>
          </div>

          <ReceiptText className="h-5 w-5 opacity-60" />
        </div>

        {payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((payment) => {
              const proofUrl = payment.proof_image_url || paymentProofPath(normalizedRole, booking.id, payment.id);

              return (
                <div
                  key={payment.id}
                  className="rounded-3xl border border-white/10 bg-black/[0.08] p-4"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <BookingStatusBadge value={payment.status} />
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em]">
                          {gatewayLabel(String(payment.payment_gateway || payment.payment_method || 'manual'))}
                        </span>
                      </div>

                      <p className="mt-3 text-lg font-black">
                        {formatMoney(payment.amount)}
                      </p>

                      <p className="mt-1 text-sm opacity-65">
                        Reference: {payment.transaction_reference || 'No reference'}
                      </p>

                      <p className="mt-1 text-xs opacity-50">
                        Submitted {formatDateTime(payment.created_at)}
                      </p>

                      {payment.remarks ? (
                        <p className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-3 text-sm leading-6 opacity-75">
                          {payment.remarks}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                      {payment.proof_image_url ? (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black transition hover:bg-white/15"
                        >
                          <FileImage className="mr-1.5 h-3.5 w-3.5" />
                          View Proof
                          <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-60" />
                        </a>
                      ) : null}

                      {canManagePayments ? (
                        <>
                          <button
                            type="button"
                            onClick={() => updatePaymentStatus(payment.id, 'confirmed')}
                            className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/15"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Confirm
                          </button>

                          <button
                            type="button"
                            onClick={() => updatePaymentStatus(payment.id, 'declined')}
                            className="inline-flex items-center rounded-full border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-400/15"
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            Decline
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-black/[0.08] p-6 text-center">
            <Banknote className="mx-auto h-8 w-8 opacity-50" />
            <h4 className="mt-3 font-black">No payment submitted yet</h4>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 opacity-65">
              {isClient
                ? 'Submit a payment proof above after completing your transaction.'
                : 'Payment records submitted by the client or encoded by staff will appear here.'}
            </p>
          </div>
        )}

        {isClient ? (
          <div className="mt-4 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            <ShieldCheck className="mb-2 h-5 w-5" />
            Submitted payment proof is for review only. Your payment status changes after BCCC validates the transaction.
          </div>
        ) : null}
      </section>
    </div>
  );
}
