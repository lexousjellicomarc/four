import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import BookingProgressPanel from '@/components/bookings/booking-progress-panel';
import { Building2, ClipboardList, FileSpreadsheet, MessageSquareMore } from 'lucide-react';

type BookingItem = {
  service_id?: number | null;
  service_name?: string | null;
  area?: string | null;
  line_total?: number | null;
};

type BookingPayment = {
  id: number;
  status?: string | null;
  payment_method?: string | null;
  payment_gateway?: string | null;
  payment_type?: string | null;
  amount?: number | null;
  transaction_reference?: string | null;
  remarks?: string | null;
  proof_image_url?: string | null;
  payer_name?: string | null;
  card_last_four?: string | null;
  marketing_consent?: boolean | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type BookingPayload = {
  id: number;
  company_name?: string | null;
  client_name?: string | null;
  client_contact_number?: string | null;
  client_email?: string | null;
  survey_email?: string | null;
  survey_proof_image_url?: string | null;
  client_address?: string | null;
  head_of_organization?: string | null;
  type_of_event?: string | null;
  booking_date_from?: string | null;
  booking_date_to?: string | null;
  number_of_guests?: number | null;
  booking_status?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  items?: BookingItem[];
  payments?: BookingPayment[];
  totals?: {
    items_total?: number | null;
    submitted_payments_total?: number | null;
    confirmed_payments_total?: number | null;
  } | null;
};

type PageProps = {
  booking: BookingPayload;
};

type AuthRole = string | { name?: string | null } | null | undefined;

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Booking details', href: '/bookings' },
];

function getRoleNames(input: any): string[] {
  const roles: AuthRole[] = input?.roles ?? input?.user?.roles ?? [];
  if (!Array.isArray(roles)) return [];
  return roles
    .map((role) => (typeof role === 'string' ? role : role?.name))
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

function formatMoney(value?: number | null) {
  return Number(value ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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

function statusPill(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100',
    confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
    completed: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100',
    declined: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
    cancelled: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
    unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
    partial: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
    refunded: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
    owing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100',
  };

  return cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', map[value] ?? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100');
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>;
}

function trialRedirectLabel(gateway: string) {
  if (gateway === 'paypal') return 'PayPal trial redirect';
  if (gateway === 'gcash') return 'GCash trial redirect';
  return 'Card payment simulation';
}

function PaymentForm({ booking }: { booking: BookingPayload }) {
  const { auth } = usePage<{ auth?: any }>().props;
  const roleNames = useMemo(() => getRoleNames(auth), [auth]);
  const isClient = roleNames.includes('user');
  const canManage = roleNames.includes('admin') || roleNames.includes('administrator') || roleNames.includes('superadmin') || roleNames.includes('manager');

  const itemsTotal = Number(booking.totals?.items_total ?? 0);
  const confirmedTotal = Number(booking.totals?.confirmed_payments_total ?? 0);
  const balance = Math.max(itemsTotal - confirmedTotal, 0);

  const [gateway, setGateway] = useState<'card' | 'paypal' | 'gcash'>('card');
  const [paymentType, setPaymentType] = useState<'down' | 'full'>('down');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  const downAmount = itemsTotal > 0 ? Math.max(itemsTotal * 0.5, 0) : 0;
  const computedAmount = paymentType === 'full' ? balance : Math.min(balance, downAmount || balance);

  const { data, setData, post, processing, errors, reset } = useForm({
    payment_method: 'online',
    payment_gateway: gateway,
    payment_type: paymentType,
    amount: computedAmount > 0 ? computedAmount.toFixed(2) : '',
    transaction_reference: '',
    remarks: '',
    status: canManage ? 'confirmed' : 'pending',
    proof_image: null as File | null,
    payer_name: booking.client_name ?? '',
    card_holder_name: booking.client_name ?? '',
    card_number: '',
    card_expiration: '',
    card_cvc: '',
    marketing_consent: false,
  });

  useEffect(() => {
    setData((current) => ({
      ...current,
      payment_gateway: gateway,
      payment_type: paymentType,
      amount: computedAmount > 0 ? computedAmount.toFixed(2) : '',
      status: canManage ? 'confirmed' : current.status,
    }));
  }, [gateway, paymentType, computedAmount, canManage]);

  useEffect(() => {
    if (!data.proof_image) {
      setProofPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(data.proof_image);
    setProofPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [data.proof_image]);

  const isCard = gateway === 'card';
  const requiresReferenceAndProof = gateway === 'paypal' || gateway === 'gcash';

  function submit(e: React.FormEvent) {
    e.preventDefault();

    post(`/bookings/${booking.id}/payments`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset(
          'transaction_reference',
          'remarks',
          'proof_image',
          'card_number',
          'card_expiration',
          'card_cvc',
        );
        setProofPreviewUrl(null);
      },
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle>Selected services and balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.items?.length ? (
            booking.items.map((item, index) => (
              <div key={`${item.service_id ?? 'item'}-${index}`} className="rounded-2xl border p-4">
                <div className="font-semibold">{item.service_name ?? 'Selected service'}</div>
                <div className="mt-1 text-sm text-muted-foreground">Area: {item.area ?? '—'}</div>
                <div className="mt-2 text-sm">₱ {formatMoney(item.line_total ?? 0)}</div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-sm text-muted-foreground">
              No selected services were attached to this booking.
            </div>
          )}

          <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Services total</span>
              <span className="font-semibold">₱ {formatMoney(itemsTotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Confirmed online payments</span>
              <span className="font-semibold">₱ {formatMoney(confirmedTotal)}</span>
            </div>
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Remaining balance</span>
                <span>₱ {formatMoney(balance)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
            {paymentType === 'down'
              ? 'Down payment uses 50% of the services total or the remaining outstanding amount, whichever is lower.'
              : 'Full payment uses the entire remaining outstanding amount.'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment options</CardTitle>
        </CardHeader>
        <Button type="button" variant="outline" asChild>
  <Link href="/payments/review">
    Review Payments
  </Link>
</Button>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Payment amount type</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    'rounded-xl border px-4 py-3 text-sm font-medium',
                    paymentType === 'down' ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-background',
                  )}
                  onClick={() => setPaymentType('down')}
                >
                  Down payment
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-xl border px-4 py-3 text-sm font-medium',
                    paymentType === 'full' ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-background',
                  )}
                  onClick={() => setPaymentType('full')}
                >
                  Full payment
                </button>
              </div>
            </div>

            <div>
              <Label>Gateway</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['card', 'paypal', 'gcash'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      'rounded-xl border px-4 py-3 text-sm font-medium capitalize',
                      gateway === value ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-background',
                    )}
                    onClick={() => setGateway(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" value={data.amount} onChange={(e) => setData('amount', e.target.value)} />
              <ErrorText message={errors.amount} />
            </div>

            <div>
              <Label htmlFor="payer_name">Payer name *</Label>
              <Input id="payer_name" value={data.payer_name} onChange={(e) => setData('payer_name', e.target.value)} />
              <ErrorText message={errors.payer_name} />
            </div>
          </div>

          {isCard ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="card_holder_name">Card holder name *</Label>
                <Input id="card_holder_name" value={data.card_holder_name} onChange={(e) => setData('card_holder_name', e.target.value)} />
                <ErrorText message={errors.card_holder_name} />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="card_number">Card number *</Label>
                <Input id="card_number" placeholder="4111 1111 1111 1111" value={data.card_number} onChange={(e) => setData('card_number', e.target.value)} />
                <ErrorText message={errors.card_number} />
              </div>

              <div>
                <Label htmlFor="card_expiration">Expiration *</Label>
                <Input id="card_expiration" placeholder="MM/YY" value={data.card_expiration} onChange={(e) => setData('card_expiration', e.target.value)} />
                <ErrorText message={errors.card_expiration} />
              </div>

              <div>
                <Label htmlFor="card_cvc">CVC *</Label>
                <Input id="card_cvc" placeholder="123" value={data.card_cvc} onChange={(e) => setData('card_cvc', e.target.value)} />
                <ErrorText message={errors.card_cvc} />
              </div>

              <div className="md:col-span-2 rounded-2xl border bg-muted/20 p-4 text-sm">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={data.marketing_consent}
                    onChange={(e) => setData('marketing_consent', e.target.checked)}
                  />
                  <span>
                    By signing up, you allow us to tailor offers and content to your interests by monitoring how you use Booking.com through tracking technologies. Unsubscribe anytime through your account settings or the link in any marketing email.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
              <div className="font-semibold">{trialRedirectLabel(gateway)}</div>
              <p className="mt-2 text-muted-foreground">
                After clicking complete booking, the client would normally be redirected to the selected payment provider in a live integration.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="transaction_reference">
                Reference number{requiresReferenceAndProof ? ' *' : ''}
              </Label>
              <Input
                id="transaction_reference"
                value={data.transaction_reference}
                onChange={(e) => setData('transaction_reference', e.target.value)}
              />
              <ErrorText message={errors.transaction_reference} />
            </div>

            <div>
              <Label htmlFor="proof_image">
                Payment screenshot{requiresReferenceAndProof ? ' *' : ''}
              </Label>
              <Input
                id="proof_image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setData('proof_image', e.target.files?.[0] ?? null)}
              />
              <ErrorText message={errors.proof_image} />
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <textarea
              id="remarks"
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.remarks}
              onChange={(e) => setData('remarks', e.target.value)}
            />
            <ErrorText message={errors.remarks} />
          </div>

          {proofPreviewUrl ? (
            <div className="rounded-2xl border p-4">
              <div className="mb-2 text-sm font-semibold">Proof preview</div>
              <img src={proofPreviewUrl} alt="Payment proof preview" className="max-h-72 rounded-xl border object-contain" />
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href={`/bookings/${booking.id}/edit`}>Edit booking</Link>
            </Button>
            <Button type="submit" disabled={processing || computedAmount <= 0}>
              {processing ? 'Submitting payment…' : 'Complete booking payment'}
            </Button>
          </div>

          {isClient ? (
            <p className="text-xs text-muted-foreground">
              Trial flow only: online card / PayPal / GCash UI is enabled for demo and record capture, not for live settlement.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </form>
  );
}

export default function ShowBooking() {
  const { booking } = usePage<PageProps>().props;

  const itemsTotal = Number(booking.totals?.items_total ?? 0);
  const submittedPayments = Number(booking.totals?.submitted_payments_total ?? 0);
  const confirmedPayments = Number(booking.totals?.confirmed_payments_total ?? 0);
  const balance = Math.max(itemsTotal - confirmedPayments, 0);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Booking #${booking.id}`} />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Booking details and payment flow</h1>
            <p className="text-sm text-muted-foreground">
              Includes status timeline, payment snapshot, proof state, and client payment submission in one page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={statusPill(booking.booking_status)}>{booking.booking_status ?? 'pending'}</span>
            <span className={statusPill(booking.payment_status)}>{booking.payment_status ?? 'unpaid'}</span>
            <Button asChild variant="outline">
              <Link href={`/bookings/${booking.id}/edit`}>Edit booking</Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-black/5 dark:border-white/10">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#0f8b6d] dark:border-[#7aa6ff]/20 dark:bg-[#16212b] dark:text-[#9dc0ff]">
                Backend workflow bridge
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">Booking, survey, registry, and inquiry tools in one session</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                Use these shortcuts when the booking needs survey completion, a linked MICE registry entry, calendar review, or backend references.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { href: `/bookings/${booking.id}/survey`, label: 'Survey Step', note: 'Attach survey email and proof image.', icon: ClipboardList },
                { href: `/reports/mice-registry/create?booking_id=${booking.id}`, label: 'New MICE Entry', note: 'Open a registry form already linked to this booking.', icon: FileSpreadsheet },
                { href: '/admin/inquiries', label: 'Inquiries', note: 'Check related messages and public coordination requests.', icon: MessageSquareMore },
                { href: '/admin/guidelines-contacts', label: 'Backend Guidelines', note: 'Open the internal policy board, contacts, and rates.', icon: Building2 },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-2xl border border-black/10 bg-[#f8f6f0] p-4 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white p-2 text-[#174f40] shadow-sm dark:bg-[#10131b] dark:text-[#9dc0ff]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{item.label}</div>
                        <div className="mt-1 text-xs leading-6 text-muted-foreground">{item.note}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking overview</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Client</div>
                  <div className="mt-2 font-semibold">{booking.client_name ?? '—'}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{booking.client_email ?? '—'}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{booking.client_contact_number ?? '—'}</div>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Organization</div>
                  <div className="mt-2 font-semibold">{booking.company_name ?? '—'}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Head: {booking.head_of_organization ?? '—'}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Guests: {booking.number_of_guests ?? 0}</div>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 md:col-span-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Event and schedule</div>
                  <div className="mt-2 font-semibold">{booking.type_of_event ?? '—'}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatDateTime(booking.booking_date_from)} → {formatDateTime(booking.booking_date_to)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Address: {booking.client_address ?? '—'}</div>
                </div>
              </CardContent>
            </Card>

            <PaymentForm booking={booking} />

            <Card>
              <CardHeader>
                <CardTitle>Payment records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.payments?.length ? (
                  booking.payments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold">₱ {formatMoney(payment.amount)}</div>
                            <span className={statusPill(payment.status)}>{payment.status ?? 'submitted'}</span>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {payment.payment_gateway ?? payment.payment_method ?? 'payment'} • {payment.payment_type ?? '—'}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Reference: {payment.transaction_reference ?? '—'}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Paid at: {formatDateTime(payment.paid_at ?? payment.created_at)}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Payer: {payment.payer_name ?? '—'}{payment.card_last_four ? ` • **** ${payment.card_last_four}` : ''}
                          </div>
                          {payment.remarks ? (
                            <div className="mt-2 rounded-xl border bg-muted/20 px-3 py-2 text-sm">{payment.remarks}</div>
                          ) : null}
                        </div>

                        {payment.proof_image_url ? (
                          <a href={payment.proof_image_url} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={payment.proof_image_url}
                              alt={`Payment proof ${payment.id}`}
                              className="h-28 w-40 rounded-xl border object-cover"
                            />
                          </a>
                        ) : (
                          <div className="rounded-xl border border-dashed px-4 py-10 text-sm text-muted-foreground">
                            No proof image
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed px-4 py-10 text-sm text-muted-foreground">
                    No payment records yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <BookingProgressPanel booking={booking} />

            <Card>
              <CardHeader>
                <CardTitle>Quick totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                  <span>Items total</span>
                  <span className="font-semibold">₱ {formatMoney(itemsTotal)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                  <span>Submitted payments</span>
                  <span className="font-semibold">₱ {formatMoney(submittedPayments)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                  <span>Confirmed payments</span>
                  <span className="font-semibold">₱ {formatMoney(confirmedPayments)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm font-semibold">
                  <span>Outstanding balance</span>
                  <span className={balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    ₱ {formatMoney(balance)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
