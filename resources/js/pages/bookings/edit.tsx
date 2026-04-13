import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import BookingProgressPanel from '@/components/bookings/booking-progress-panel';

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
  canEditAll?: boolean;
};

type BlockKey = 'AM' | 'PM' | 'EVE';
type AuthRole = string | { name?: string | null } | null | undefined;

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Edit booking', href: '/bookings' },
];

const BLOCK_META: Record<BlockKey, { label: string; start: string; end: string }> = {
  AM: { label: 'AM', start: '06:00', end: '12:00' },
  PM: { label: 'PM', start: '12:00', end: '18:00' },
  EVE: { label: 'EVE', start: '18:00', end: '23:59' },
};

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

function datePart(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function inferBlocks(from?: string | null, to?: string | null): BlockKey[] {
  const start = String(from ?? '').slice(11, 16);
  const end = String(to ?? '').slice(11, 16);

  if (!start || !end) return [];
  if (start === '06:00' && end === '12:00') return ['AM'];
  if (start === '12:00' && end === '18:00') return ['PM'];
  if (start === '18:00') return ['EVE'];
  if (start === '06:00' && end === '18:00') return ['AM', 'PM'];
  if (start === '12:00' && (end === '23:59' || end === '00:00')) return ['PM', 'EVE'];
  if (start === '06:00' && (end === '23:59' || end === '00:00')) return ['AM', 'PM', 'EVE'];
  return [];
}

function normalizeBlocks(blocks: BlockKey[]) {
  const unique = Array.from(new Set(blocks));
  const order: BlockKey[] = ['AM', 'PM', 'EVE'];

  if (unique.includes('AM') && unique.includes('EVE') && !unique.includes('PM')) {
    unique.push('PM');
  }

  return unique.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function toggleBlock(current: BlockKey[], block: BlockKey) {
  const exists = current.includes(block);
  const next = exists ? current.filter((value) => value !== block) : [...current, block];
  return normalizeBlocks(next);
}

function computeRange(date: string, blocks: BlockKey[]) {
  if (!date || blocks.length === 0) {
    return { from: '', to: '' };
  }

  const normalized = normalizeBlocks(blocks);
  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const from = `${date} ${BLOCK_META[first].start}`;

  if (last === 'EVE') {
    return { from, to: `${date} 23:59` };
  }

  return { from, to: `${date} ${BLOCK_META[last].end}` };
}

function ScrollError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>;
}

function fieldWrap(hasError?: string) {
  return hasError ? 'rounded-xl border border-red-300 bg-red-50/60 p-3 dark:border-red-900/60 dark:bg-red-950/20' : '';
}

export default function EditBooking() {
  const { booking, canEditAll = false, auth } = usePage<PageProps & { auth?: any }>().props;
  const roleNames = useMemo(() => getRoleNames(auth), [auth]);
  const isClient = roleNames.includes('user');
  const formRootRef = useRef<HTMLDivElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => datePart(booking.booking_date_from));
  const [selectedBlocks, setSelectedBlocks] = useState<BlockKey[]>(() => inferBlocks(booking.booking_date_from, booking.booking_date_to));

  const { data, setData, post, processing, errors } = useForm({
    client_name: booking.client_name ?? '',
    company_name: booking.company_name ?? '',
    client_contact_number: booking.client_contact_number ?? '',
    client_email: booking.client_email ?? '',
    survey_email: booking.survey_email ?? '',
    client_address: booking.client_address ?? '',
    head_of_organization: booking.head_of_organization ?? '',
    type_of_event: booking.type_of_event ?? '',
    booking_date_from: booking.booking_date_from ?? '',
    booking_date_to: booking.booking_date_to ?? '',
    number_of_guests: String(booking.number_of_guests ?? ''),
    survey_proof_image: null as File | null,
    booking_status: String(booking.booking_status ?? 'pending').toLowerCase(),
    payment_status: String(booking.payment_status ?? 'unpaid').toLowerCase(),
  });

  useEffect(() => {
    const range = computeRange(selectedDate, selectedBlocks);
    setData('booking_date_from', range.from);
    setData('booking_date_to', range.to);
  }, [selectedDate, selectedBlocks]);

  useEffect(() => {
    if (!data.survey_proof_image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(data.survey_proof_image);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [data.survey_proof_image]);

  useEffect(() => {
    const firstErrorKey = Object.keys(errors)[0];
    if (!firstErrorKey) return;

    const root = formRootRef.current;
    if (!root) return;

    const target = root.querySelector<HTMLElement>(`[data-field="${firstErrorKey}"]`);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const focusable = target.querySelector<HTMLElement>('input, textarea, select, button');
    focusable?.focus();
  }, [errors]);

  const selectedItems = booking.items ?? [];
  const itemsTotal = Number(booking.totals?.items_total ?? 0);
  const paidTotal = Number(booking.totals?.confirmed_payments_total ?? 0);
  const balance = Math.max(itemsTotal - paidTotal, 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    post(`/bookings/${booking.id}`, {
      forceFormData: true,
      preserveScroll: false,
      onBefore: () => {
        if (!selectedDate) {
          setData('booking_date_from', '');
          setData('booking_date_to', '');
        }
      },
      transform: (payload) => ({
        ...payload,
        _method: 'put',
        service_id: '',
      }),
    });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit Booking" />

      <div ref={formRootRef} className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit booking</h1>
            <p className="text-sm text-muted-foreground">
              This version adds a clearer progress panel and audit sidebar while preserving the fixed reload/edit flow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={statusPill(booking.booking_status)}>{booking.booking_status ?? 'pending'}</span>
            <span className={statusPill(booking.payment_status)}>{booking.payment_status ?? 'unpaid'}</span>
            <Button asChild variant="outline">
              <Link href={`/bookings/${booking.id}`}>Open payment page</Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div data-field="client_name" className={fieldWrap(errors.client_name)}>
                  <Label htmlFor="client_name">Client name *</Label>
                  <Input id="client_name" value={data.client_name} onChange={(e) => setData('client_name', e.target.value)} />
                  <ScrollError message={errors.client_name} />
                </div>

                <div data-field="company_name" className={fieldWrap(errors.company_name)}>
                  <Label htmlFor="company_name">Company / organization</Label>
                  <Input id="company_name" value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} />
                  <ScrollError message={errors.company_name} />
                </div>

                <div data-field="client_contact_number" className={fieldWrap(errors.client_contact_number)}>
                  <Label htmlFor="client_contact_number">Contact number *</Label>
                  <Input id="client_contact_number" value={data.client_contact_number} onChange={(e) => setData('client_contact_number', e.target.value)} />
                  <ScrollError message={errors.client_contact_number} />
                </div>

                <div data-field="client_email" className={fieldWrap(errors.client_email)}>
                  <Label htmlFor="client_email">Email *</Label>
                  <Input id="client_email" type="email" value={data.client_email} onChange={(e) => setData('client_email', e.target.value)} />
                  <ScrollError message={errors.client_email} />
                </div>

                <div data-field="head_of_organization" className={fieldWrap(errors.head_of_organization)}>
                  <Label htmlFor="head_of_organization">Head of organization</Label>
                  <Input id="head_of_organization" value={data.head_of_organization} onChange={(e) => setData('head_of_organization', e.target.value)} />
                  <ScrollError message={errors.head_of_organization} />
                </div>

                <div data-field="number_of_guests" className={fieldWrap(errors.number_of_guests)}>
                  <Label htmlFor="number_of_guests">Number of guests *</Label>
                  <Input id="number_of_guests" type="number" min={1} value={data.number_of_guests} onChange={(e) => setData('number_of_guests', e.target.value)} />
                  <ScrollError message={errors.number_of_guests} />
                </div>

                <div data-field="type_of_event" className={cn('md:col-span-2', fieldWrap(errors.type_of_event))}>
                  <Label htmlFor="type_of_event">Type of event *</Label>
                  <Input id="type_of_event" value={data.type_of_event} onChange={(e) => setData('type_of_event', e.target.value)} />
                  <ScrollError message={errors.type_of_event} />
                </div>

                <div data-field="client_address" className={cn('md:col-span-2', fieldWrap(errors.client_address))}>
                  <Label htmlFor="client_address">Address *</Label>
                  <textarea
                    id="client_address"
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={data.client_address}
                    onChange={(e) => setData('client_address', e.target.value)}
                  />
                  <ScrollError message={errors.client_address} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div data-field="booking_date_from" className={fieldWrap(errors.booking_date_from)}>
                  <Label htmlFor="booking_date">Selected date</Label>
                  <Input
                    id="booking_date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={!canEditAll}
                  />
                  <ScrollError message={errors.booking_date_from} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {(['AM', 'PM', 'EVE'] as BlockKey[]).map((block) => {
                    const isSelected = selectedBlocks.includes(block);
                    return (
                      <button
                        key={block}
                        type="button"
                        data-field="booking_date_to"
                        disabled={!canEditAll}
                        onClick={() => setSelectedBlocks((prev) => toggleBlock(prev, block))}
                        className={cn(
                          'rounded-xl border px-4 py-3 text-left transition',
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-border bg-background hover:bg-muted/50',
                          !canEditAll && 'cursor-not-allowed opacity-70',
                        )}
                      >
                        <div className="font-semibold">{BLOCK_META[block].label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {isSelected ? 'Selected' : 'Not selected'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <ScrollError message={errors.booking_date_to} />

                <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                  <div>
                    <span className="font-medium">From:</span> {data.booking_date_from || '—'}
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {data.booking_date_to || '—'}
                  </div>
                  {!canEditAll && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Clients can update details and survey proof here, but the schedule remains staff-controlled.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey proof</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div data-field="survey_email" className={fieldWrap(errors.survey_email)}>
                  <Label htmlFor="survey_email">Survey email *</Label>
                  <Input id="survey_email" type="email" value={data.survey_email} onChange={(e) => setData('survey_email', e.target.value)} />
                  <ScrollError message={errors.survey_email} />
                </div>

                <div data-field="survey_proof_image" className={fieldWrap(errors.survey_proof_image)}>
                  <Label htmlFor="survey_proof_image">Upload replacement proof</Label>
                  <Input
                    id="survey_proof_image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setData('survey_proof_image', e.target.files?.[0] ?? null)}
                  />
                  <ScrollError message={errors.survey_proof_image} />
                </div>

                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="mb-2 text-sm font-semibold">Current proof</div>
                    {booking.survey_proof_image_url ? (
                      <img src={booking.survey_proof_image_url} alt="Current survey proof" className="max-h-72 w-full rounded-xl border object-contain" />
                    ) : (
                      <div className="rounded-xl border border-dashed px-4 py-10 text-sm text-muted-foreground">
                        No proof uploaded.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="mb-2 text-sm font-semibold">New preview</div>
                    {previewUrl ? (
                      <img src={previewUrl} alt="New proof preview" className="max-h-72 w-full rounded-xl border object-contain" />
                    ) : (
                      <div className="rounded-xl border border-dashed px-4 py-10 text-sm text-muted-foreground">
                        Select a new file to preview it here.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <BookingProgressPanel booking={booking} compact />

            <Card>
              <CardHeader>
                <CardTitle>Selected services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item, index) => (
                    <div key={`${item.service_id ?? 'item'}-${index}`} className="rounded-2xl border p-4">
                      <div className="font-semibold">{item.service_name ?? 'Selected service'}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Area: {item.area ?? '—'}</div>
                      <div className="mt-1 text-sm">₱ {formatMoney(item.line_total ?? 0)}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                    No services attached to this booking.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status and totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div data-field="booking_status" className={fieldWrap(errors.booking_status)}>
                  <Label htmlFor="booking_status">Booking status</Label>
                  <select
                    id="booking_status"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={data.booking_status}
                    onChange={(e) => setData('booking_status', e.target.value)}
                    disabled={!canEditAll}
                  >
                    {['pending', 'active', 'confirmed', 'cancelled', 'declined', 'completed'].map((value) => (
                      <option key={value} value={value}>
                        {value.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ScrollError message={errors.booking_status} />
                </div>

                <div data-field="payment_status" className={fieldWrap(errors.payment_status)}>
                  <Label htmlFor="payment_status">Payment status</Label>
                  <select
                    id="payment_status"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={data.payment_status}
                    onChange={(e) => setData('payment_status', e.target.value)}
                    disabled={!canEditAll}
                  >
                    {['unpaid', 'partial', 'paid', 'owing'].map((value) => (
                      <option key={value} value={value}>
                        {value.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ScrollError message={errors.payment_status} />
                </div>

                <div className="space-y-2 rounded-2xl border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Services total</span>
                    <span className="font-semibold">₱ {formatMoney(itemsTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confirmed payments</span>
                    <span className="font-semibold">₱ {formatMoney(paidTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
                    <span>Balance</span>
                    <span>₱ {formatMoney(balance)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href={`/bookings/${booking.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving changes…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
