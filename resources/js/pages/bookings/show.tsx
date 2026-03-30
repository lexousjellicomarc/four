import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Booking, Service } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import BookingStatusBadge from '@/components/ui/booking-status-badge';
import PaymentRowStatusBadge from '@/components/ui/payment-row-status-badge';
import ConfirmActionDialog from '@/components/confirm-action-dialog';


/* ----------------------------- helpers/types ----------------------------- */

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null;
}

type RoleLike = string | { name?: string | null };
type AuthLike = { roles?: RoleLike[] | null; user?: { roles?: RoleLike[] | null } | null };

function getRoleNames(auth: unknown): string[] {
  const tryGetRoles = (v: unknown): RoleLike[] => {
    if (!isRecord(v)) return [];
    const roles = v.roles;
    return Array.isArray(roles) ? (roles as RoleLike[]) : [];
  };

  const roles = tryGetRoles(auth);
  const userRoles = isRecord(auth) ? tryGetRoles(auth.user) : [];

  return [...roles, ...userRoles]
    .map((r) => (typeof r === 'string' ? r : r?.name))
    .filter((x): x is string => typeof x === 'string' && x.length > 0);
}

function formatDateTime(input?: string | null) {
  if (!input) return '-';
  const m = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})?$/,
  );
  let year: number, monthIndex: number, day: number, hour: number, minute: number;
  if (m) {
    year = Number(m[1]);
    monthIndex = Number(m[2]) - 1;
    day = Number(m[3]);
    hour = Number(m[4]);
    minute = Number(m[5]);
  } else {
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    year = d.getFullYear();
    monthIndex = d.getMonth();
    day = d.getDate();
    hour = d.getHours();
    minute = d.getMinutes();
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = months[monthIndex];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  const minStr = String(minute).padStart(2, '0');
  return `${monthLabel} ${day}, ${year} ${displayHour}:${minStr} ${ampm}`;
}

function parseLiteralDate(input?: string | null): Date | undefined {
  if (!input) return undefined;
  const m = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})?$/,
  );
  if (!m) return undefined;
  const [, y, mo, da, h, mi, s] = m;
  const d = new Date(Number(y), Number(mo) - 1, Number(da), Number(h), Number(mi), s ? Number(s) : 0, 0);
  return isNaN(d.getTime()) ? undefined : d;
}

function normalizeIso16(input?: string | null): string {
  if (!input) return '';
  const m = String(input).match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
  if (m) return `${m[1]}T${m[2]}`;
  return String(input);
}

function getCreatedByLabel(b: unknown): string {
  if (!isRecord(b)) return '-';

  const createdBy = b.created_by ?? b.createdBy ?? b.creator ?? null;

  const name =
    (typeof b.created_by_name === 'string' ? b.created_by_name : null) ??
    (isRecord(createdBy) && typeof createdBy.name === 'string' ? createdBy.name : null);

  const email =
    (typeof b.created_by_email === 'string' ? b.created_by_email : null) ??
    (isRecord(createdBy) && typeof createdBy.email === 'string' ? createdBy.email : null);

  if (name && email) return `${name} (${email})`;
  if (name) return name;
  if (email) return email;
  return '-';
}

type BookingItemRaw = {
  service_id: number;
  service_name: string;
  price: number | string;
  quantity: number | string;
};

type PaymentRaw = {
  id: number;
  created_at: string;
  payment_method: string;
  status: string;
  transaction_reference?: string | null;
  amount: number | string;
  remarks?: string | null;
};

type BookingTotalsRaw = {
  items_total?: number | string | null;
  payments_total?: number | string | null;
};

type BookingVM = Booking & {
  id: number;
  service_id?: number | string | null;
  company_name?: string | null;
  client_name?: string;
  client_contact_number?: string;
  client_email?: string;
  client_address?: string;
  head_of_organization?: string | null;
  type_of_event?: string | null;
  booking_date_from?: string | null;
  booking_date_to?: string | null;
  number_of_guests?: number | string | null;
  booking_status?: string | null;
  payment_status?: string | null;

  created_by?: unknown;
  createdBy?: unknown;
  creator?: unknown;
  created_by_name?: string | null;
  created_by_email?: string | null;

  items?: BookingItemRaw[] | null;
  payments?: PaymentRaw[] | null;
  totals?: BookingTotalsRaw | null;
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Details', href: '/bookings' },
];

interface ShowBookingProps {
  booking: Booking;
  services: Service[];
  unavailableDates?: string[];
}

/* --------------------- Service Type (Area) helpers --------------------- */

type ServiceWithType = Service & {
  service_type?: string | null;
  service_type_name?: string | null;
  serviceType?: { name?: string | null } | null;
};

function getServiceAreaLabel(service: Service): string {
  const s = service as unknown as ServiceWithType;

  const direct =
    typeof s.service_type === 'string' ? s.service_type.trim() : '';

  const nameField =
    typeof (s as any)?.service_type_name === 'string'
      ? String((s as any).service_type_name).trim()
      : '';

  const relation =
    isRecord((s as any)?.serviceType) && typeof (s as any).serviceType?.name === 'string'
      ? String((s as any).serviceType.name).trim()
      : '';

  return direct || nameField || relation || '—';
}

/* --------------------- Custom searchable service select -------------------- */

function SearchableServiceSelect({
  services,
  value,
  onChange,
  serviceSearch,
  setServiceSearch,
  disabled,
}: {
  services: Service[];
  value: string;
  onChange: (v: string) => void;
  serviceSearch: string;
  setServiceSearch: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const listboxId = 'service-listbox';

  const grouped = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    services.forEach((s) => {
      const key = getServiceAreaLabel(s);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((group) => ({
        group,
        items: groups[group].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      }));
  }, [services]);

  const selectedLabel = useMemo(() => {
    const svc = services.find((s) => String(s.id) === value);
    return svc ? svc.name : 'Select a service to add';
  }, [value, services]);

  const selectOption = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-56">
      <button
        type="button"
        className="border bg-background rounded-md px-2 py-2 text-sm w-full text-left flex justify-between items-center disabled:opacity-60"
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={value ? '' : 'text-muted-foreground'}>{selectedLabel}</span>
        <span className="ml-2 text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full border rounded-md bg-popover shadow-md max-h-72 overflow-auto animate-in fade-in">
          <div className="p-2 border-b bg-muted/40">
            <input
              ref={inputRef}
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.currentTarget.value)}
              placeholder="Search..."
              className="w-full rounded-md border px-2 py-1 text-sm bg-background"
            />
          </div>

          {/* Proper ARIA: listbox -> group -> option */}
          <ul id={listboxId} role="listbox" className="py-1 text-sm">
            {grouped.map((g) => (
              <li key={g.group} role="group" aria-label={g.group} className="px-2 py-1">
                <div className="text-xs font-semibold text-muted-foreground mb-1">{g.group}</div>

                <div className="space-y-0.5">
                  {g.items.map((item) => {
                    const selected = String(item.id) === value;

                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={selected}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => selectOption(String(item.id))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            selectOption(String(item.id));
                          }
                        }}
                        className={`cursor-pointer w-full text-left px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground ${
                          selected ? 'bg-accent text-accent-foreground' : ''
                        }`}
                      >
                        {item.name}
                      </div>
                    );
                  })}

                  {g.items.length === 0 && (
                    <div className="px-2 py-1 text-muted-foreground italic text-xs">No matches</div>
                  )}
                </div>
              </li>
            ))}

            {grouped.length === 0 && (
              <li className="px-2 py-2 text-muted-foreground text-xs">No services available.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------------- Zoomable image preview ------------------------- */

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function ZoomableImagePreview({
  src,
  alt,
  title = 'Image preview',
}: {
  src: string;
  alt: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Reset zoom when closing
  useEffect(() => {
    if (!open) setZoom(1);
  }, [open]);

  const zoomIn = () => setZoom((z) => clamp(Math.round((z + 0.25) * 100) / 100, 1, 4));
  const zoomOut = () => setZoom((z) => clamp(Math.round((z - 0.25) * 100) / 100, 1, 4));
  const reset = () => setZoom(1);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex flex-col items-start gap-1"
        aria-label="Open image preview"
      >
        <img
          src={src}
          alt={alt}
          className="h-20 w-auto max-w-full rounded-md border bg-background object-contain cursor-zoom-in transition-opacity group-hover:opacity-90"
        />
        <span className="text-[11px] text-muted-foreground">Click to enlarge</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={zoomOut} disabled={zoom <= 1}>
              Zoom −
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={zoomIn} disabled={zoom >= 4}>
              Zoom +
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={reset} disabled={zoom === 1}>
              Reset
            </Button>

            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(clamp(Number(e.currentTarget.value), 1, 4))}
                className="w-40 accent-primary"
              />
              <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/10 p-2">
            {/* Scale by layout width so scrollbars work */}
            <div className="mx-auto" style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}>
              <img src={src} alt={alt} className="w-full h-auto rounded-md" style={{ maxWidth: 'none' }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* --------------------------------- Page ---------------------------------- */

export default function ShowBooking({ booking, services }: ShowBookingProps) {

  const { auth } = usePage<{ auth?: AuthLike | null }>().props;

  const roleNames = getRoleNames(auth).map((r) => r.toLowerCase());

  const isClient = roleNames.includes('user');

  // ✅ STAFF READ-ONLY
  const isStaff = roleNames.includes('staff') || roleNames.includes('employee');

  const b = booking as unknown as BookingVM;

  const createdByLabel = getCreatedByLabel(b);

  // ✅ Fast lookup: service_id -> area label
  const serviceAreaById = useMemo(() => {
    const map = new Map<number, string>();
    services.forEach((s) => map.set(Number(s.id), getServiceAreaLabel(s)));
    return map;
  }, [services]);

  // Items editor state
  type CartItem = { service_id: number; service_name: string; price: number };

  const initialItems: CartItem[] = Array.isArray(b.items)
    ? b.items.map((i) => ({
        service_id: Number(i.service_id ?? 0),
        service_name: String(i.service_name ?? '-'),
        price: Number(i.price ?? 0),
      }))
    : [];

  const [confirmRemoveItemOpen, setConfirmRemoveItemOpen] = useState(false);
  const [pendingRemoveServiceId, setPendingRemoveServiceId] = useState<number | null>(null);
  const [confirmSaveServicesOpen, setConfirmSaveServicesOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(initialItems);
  const [addServiceId, setAddServiceId] = useState<string>('');
  const [serviceSearch, setServiceSearch] = useState('');

  const filteredServices = useMemo(() => {
    const term = serviceSearch.trim().toLowerCase();
    const selectedIds = new Set(cart.map((item) => item.service_id));

    return services.filter((s) => {
      if (selectedIds.has(Number(s.id))) return false;
      if (!term) return true;

      return s.name?.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term);
    });
  }, [services, serviceSearch, cart]);

  const duration = useMemo(() => {
    const start = parseLiteralDate(b.booking_date_from ?? undefined);
    const end = parseLiteralDate(b.booking_date_to ?? undefined);
    if (!start || !end) return null;
    let diff = end.getTime() - start.getTime();
    if (diff < 0) diff = 0;
    const DAY = 24 * 60 * 60 * 1000;
    const HOUR = 60 * 60 * 1000;
    const days = Math.floor(diff / DAY);
    const hours = Math.floor((diff % DAY) / HOUR);
    return { days, hours, totalHours: Math.floor(diff / HOUR) };
  }, [b.booking_date_from, b.booking_date_to]);

  const removeCartItem = (service_id: number) => {
    if (isClient || isStaff) return; // ✅ staff cannot modify
    setCart((prev) => prev.filter((ci) => ci.service_id !== service_id));
  };

  const requestRemoveCartItem = (service_id: number) => {
    if (isClient || isStaff) return;
    setPendingRemoveServiceId(service_id);
    setConfirmRemoveItemOpen(true);
  };

  const confirmRemoveCartItem = () => {
    if (pendingRemoveServiceId === null) return;
    removeCartItem(pendingRemoveServiceId);
    setPendingRemoveServiceId(null);
    setConfirmRemoveItemOpen(false);
  };

  const addCartItem = () => {
    if (isClient || isStaff) return; // ✅ staff cannot modify
    if (!addServiceId) return;

    const sid = Number(addServiceId);
    const svc = services.find((s) => Number(s.id) === sid);
    if (!svc) return;

    setCart((prev) => {
      if (prev.some((ci) => ci.service_id === sid)) {
        return prev;
      }

      return [...prev, { service_id: sid, service_name: svc.name, price: Number(svc.price) }];
    });

    setAddServiceId('');
    setServiceSearch('');
  };

  const initialFrom = normalizeIso16(b.booking_date_from ?? '');
  const initialTo = normalizeIso16(b.booking_date_to ?? '');

  const { put, processing, transform } = useForm<{
    service_id?: number | string | null;
    company_name: string;
    client_name: string;
    client_contact_number: string;
    client_email: string;
    survey_email: string;
    client_address: string;
    head_of_organization: string;
    type_of_event: string;
    booking_date_from: string;
    booking_date_to: string;
    number_of_guests: number | string;
    booking_status: string;
    payment_status: string;
    items: Array<{ service_id: number; quantity: 1 }>;
  }>({
    service_id: b.service_id ?? null,
    company_name: b.company_name ?? '',
    client_name: b.client_name ?? '',
    client_contact_number: b.client_contact_number ?? '',
    client_email: b.client_email ?? '',
    survey_email: (b as any).survey_email ?? '',
    client_address: b.client_address ?? '',
    head_of_organization: b.head_of_organization ?? '',
    type_of_event: b.type_of_event ?? '',
    booking_date_from: initialFrom,
    booking_date_to: initialTo,
    number_of_guests: b.number_of_guests ?? '',
    booking_status: b.booking_status ?? '',
    payment_status: b.payment_status ?? '',
    items: [],
  });

  const saveItems = () => {
    if (isClient || isStaff) return; // ✅ staff cannot modify
    const items = cart.map((ci) => ({ service_id: ci.service_id, quantity: 1 as const }));
    transform((prev) => ({ ...prev, items }));
    put(`/bookings/${b.id}`);
  };

  const canEditPaymentStatus = !isClient && !isStaff; // admin/manager etc.
  const staffReadOnly = isStaff;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Booking • ${b.client_name ?? ''}`} />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <Button variant="outline" asChild>
            <Link href="/bookings">← Back to Bookings</Link>
          </Button>

          {/* ✅ Hide edit button for STAFF */}
          {!isStaff && (
            <Button asChild>
              <Link href={`/bookings/${b.id}/edit`}>Edit details</Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6">
            {/* Client section */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Client Name</div>
                  <div className="font-medium">{b.client_name ?? '-'}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Company</div>
                  <div className="font-medium">{b.company_name ?? '-'}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Booking Email</div>
                  <div className="font-medium">{b.client_email ?? '-'}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Contact</div>
                  <div className="font-medium">{b.client_contact_number ?? '-'}</div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Address</div>
                  <div className="font-medium">{b.client_address ?? '-'}</div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Head of the Organization</div>
                  <div className="font-medium">{b.head_of_organization || '-'}</div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Created By</div>
                  <div className="font-medium">{createdByLabel}</div>
                </div>
              </div>
            </section>

            {/* Survey section */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground">Survey</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Survey Email</div>
                  <div className="font-medium">{(b as any).survey_email ?? '-'}</div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Proof</div>
                  {(b as any).survey_proof_image_url ? (
                    <div className="mt-2">
                      <ZoomableImagePreview
                        src={(b as any).survey_proof_image_url as string}
                        alt="Survey proof"
                        title="Survey Proof"
                      />
                    </div>
                  ) : (
                    <div className="font-medium text-destructive">No proof uploaded.</div>
                  )}
                </div>
              </div>
            </section>

            {/* Event section */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground">Event</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Type of Event</div>
                  <div className="font-medium">{b.type_of_event ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">From</div>
                  <div className="font-medium">{formatDateTime(b.booking_date_from)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">To</div>
                  <div className="font-medium">{formatDateTime(b.booking_date_to)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="font-medium">
                    {duration ? (duration.days > 0 ? `${duration.days}d ${duration.hours}h` : `${duration.hours}h`) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Guests</div>
                  <div className="font-medium">{b.number_of_guests ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">
                    <BookingStatusBadge status={b.booking_status ?? ''} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payment</div>
                  <div className="font-medium">
                    <PaymentStatusBadge status={b.payment_status ?? ''} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: internally we assume a minimum window of <strong>5 hours</strong> from the start time (4 hours
                event time plus ingress &amp; egress buffer).
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Services */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {/* Only non-client see the add controls, but STAFF is disabled */}
                {!isClient && (
                  <div className="flex flex-wrap items-center gap-2">
                    <SearchableServiceSelect
                      services={filteredServices}
                      value={addServiceId}
                      onChange={setAddServiceId}
                      serviceSearch={serviceSearch}
                      setServiceSearch={setServiceSearch}
                      disabled={staffReadOnly}
                    />
                    <Button type="button" onClick={addCartItem} size="sm" disabled={staffReadOnly || !addServiceId}>
                      Add
                    </Button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2 pr-2">Service</th>
                        {/* ✅ NEW COLUMN: service type shown as "Area" */}
                        <th className="py-2 pr-2">Area</th>
                        <th className="py-2 pr-2">Price</th>
                        <th className="py-2 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {cart.map((i) => {
                        const area = serviceAreaById.get(i.service_id) ?? '—';

                        return (
                          <tr key={i.service_id} className="border-t">
                            <td className="py-2 pr-2">{i.service_name}</td>

                            {/* ✅ Area (service type) */}
                            <td className="py-2 pr-2">
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                {area}
                              </Badge>
                            </td>

                            <td className="py-2 pr-2">
                              {Number(i.price).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            <td className="py-2 pr-2 text-right">
                              {/* Non-client sees button; STAFF sees it disabled */}
                              {!isClient && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={staffReadOnly}
                                  onClick={() => requestRemoveCartItem(i.service_id)}
                                >
                                  Remove
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {cart.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-muted-foreground">
                            No services selected.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {cart.length > 0 && (
                      <tfoot>
                        <tr className="border-t">
                          <td className="py-2 pr-2" colSpan={2}>
                            Total Services
                          </td>
                          <td className="py-2 pr-2">
                            {cart.reduce((sum, i) => sum + i.price, 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Non-client sees Save; STAFF disabled */}
                {!isClient && (
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setConfirmSaveServicesOpen(true)} disabled={processing || staffReadOnly}>
                      Save services
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4">
                <BookingPaymentSummary booking={b} />

                {/* ✅ STAFF cannot input anything (disabled) */}
                <AddPaymentForm bookingId={b.id} canEditStatus={canEditPaymentStatus} disabled={staffReadOnly} />

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2 pr-2">Date</th>
                        <th className="py-2 pr-2">Method</th>
                        <th className="py-2 pr-2">Status</th>
                        <th className="py-2 pr-2">Reference</th>
                        <th className="py-2 pr-2 text-right">Amount</th>
                        <th className="py-2 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(b.payments) && b.payments.length > 0 ? (
                        b.payments.map((p) => (
                          <PaymentRow
                            key={p.id}
                            bookingId={b.id}
                            payment={p}
                            showEditButton={!isClient}
                            readOnly={staffReadOnly}
                          />
                        ))
                      ) : (
                        <tr>
                          <td className="py-6 text-center text-muted-foreground" colSpan={6}>
                            No payments recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td className="py-2 pr-2" colSpan={4}>
                          Payments Total
                        </td>
                        <td className="py-2 pr-2 text-right">
                          {Number(b.totals?.payments_total ?? 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmActionDialog
    open={confirmRemoveItemOpen}
    onOpenChange={(open) => {
        setConfirmRemoveItemOpen(open);
        if (!open) {
            setPendingRemoveServiceId(null);
        }
    }}
    title="Remove this service from the booking?"
    description="This will remove the selected service line from the current booking editor."
    confirmLabel="Remove"
    cancelLabel="Keep it"
    onConfirm={confirmRemoveCartItem}
    variant="destructive"
/>

<ConfirmActionDialog
    open={confirmSaveServicesOpen}
    onOpenChange={setConfirmSaveServicesOpen}
    title="Save service changes?"
    description="This will update the service lines attached to the booking."
    confirmLabel="Save changes"
    cancelLabel="Review first"
    onConfirm={() => {
        saveItems();
        setConfirmSaveServicesOpen(false);
    }}
    variant="default"
/>

    </AppLayout>
  );
}

/* ---------------------------- Add Payment Form ---------------------------- */

function AddPaymentForm({
  bookingId,
  canEditStatus,
  disabled,
}: {
  bookingId: number;
  canEditStatus: boolean;
  disabled?: boolean;
}) {
  const { data, setData, post, processing, errors, reset } = useForm<{
    status: string;
    payment_method: string;
    amount: string;
    transaction_reference: string;
    remarks: string;
  }>({
    status: 'pending',
    payment_method: '',
    amount: '',
    transaction_reference: '',
    remarks: '',
  });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    post(`/bookings/${bookingId}/payments`, {
      onSuccess: () => reset('payment_method', 'amount', 'transaction_reference', 'remarks'),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 border rounded-md p-4 bg-muted/30">
      <h4 className="font-medium text-sm">Add Payment</h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor="payment_method">
            Payment Method
          </label>
          <Input
            id="payment_method"
            value={data.payment_method}
            onChange={(e) => setData('payment_method', e.currentTarget.value)}
            required
            disabled={disabled}
          />
          {errors.payment_method && <p className="text-destructive text-xs">{errors.payment_method}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor="amount">
            Amount
          </label>
          <Input
            id="amount"
            type="number"
            min={0.01}
            step={0.01}
            value={data.amount}
            onChange={(e) => setData('amount', e.currentTarget.value)}
            required
            disabled={disabled}
          />
          {errors.amount && <p className="text-destructive text-xs">{errors.amount}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor="status">
            Status
          </label>

          {canEditStatus && !disabled ? (
            <select
              id="status"
              className="border bg-background rounded-md px-2 py-2 text-sm"
              value={data.status}
              onChange={(e) => setData('status', e.currentTarget.value)}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="failed">Failed</option>
              <option value="declined">Declined</option>
              <option value="refunded">Refunded</option>
            </select>
          ) : (
            <Input id="status" value="Pending" disabled className="bg-muted text-muted-foreground" />
          )}

          {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor="transaction_reference">
            Reference
          </label>
          <Input
            id="transaction_reference"
            value={data.transaction_reference}
            onChange={(e) => setData('transaction_reference', e.currentTarget.value)}
            disabled={disabled}
          />
          {errors.transaction_reference && <p className="text-destructive text-xs">{errors.transaction_reference}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor="remarks">
            Remarks
          </label>
          <Input
            id="remarks"
            value={data.remarks}
            onChange={(e) => setData('remarks', e.currentTarget.value)}
            disabled={disabled}
          />
          {errors.remarks && <p className="text-destructive text-xs">{errors.remarks}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={processing || disabled}>
          {processing ? 'Saving…' : 'Add Payment'}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------ Payment Row ------------------------------- */

function PaymentRow({
  bookingId,
  payment,
  showEditButton,
  readOnly,
}: {
  bookingId: number;
  payment: PaymentRaw;
  showEditButton: boolean;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (readOnly) setEditing(false);
  }, [readOnly]);

  return (
    <>
      <tr className="border-t">
        <td className="py-2 pr-2">{new Date(payment.created_at).toLocaleDateString()}</td>
        <td className="py-2 pr-2">{payment.payment_method}</td>
        <td className="py-2 pr-2">
          <PaymentRowStatusBadge status={payment.status} />
        </td>
        <td className="py-2 pr-2">{payment.transaction_reference ?? '-'}</td>
        <td className="py-2 pr-2 text-right">{Number(payment.amount).toFixed(2)}</td>
        <td className="py-2 pr-2 text-right">
          {showEditButton && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                setEditing((v) => !v);
              }}
            >
              {editing ? 'Close' : 'Edit'}
            </Button>
          )}
        </td>
      </tr>

      {editing && showEditButton && !readOnly && (
        <tr className="border-b">
          <td colSpan={6} className="py-3">
            <EditPaymentForm bookingId={bookingId} payment={payment} onDone={() => setEditing(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ---------------------------- Edit Payment Form --------------------------- */

function EditPaymentForm({
  bookingId,
  payment,
  onDone,
}: {
  bookingId: number;
  payment: PaymentRaw;
  onDone: () => void;
}) {
  const { data, setData, put, processing, errors } = useForm<{
    status: string;
    payment_method: string;
    amount: string;
    transaction_reference: string;
    remarks: string;
  }>({
    status: payment.status ?? 'pending',
    payment_method: payment.payment_method ?? '',
    amount: String(payment.amount ?? ''),
    transaction_reference: payment.transaction_reference ?? '',
    remarks: payment.remarks ?? '',
  });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    put(`/bookings/${bookingId}/payments/${payment.id}`, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 border rounded-md p-4 bg-muted/20">
      <h4 className="font-medium text-sm">Edit Payment</h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor={`edit_method_${payment.id}`}>
            Method
          </label>
          <Input
            id={`edit_method_${payment.id}`}
            value={data.payment_method}
            onChange={(e) => setData('payment_method', e.currentTarget.value)}
            required
          />
          {errors.payment_method && <p className="text-destructive text-xs">{errors.payment_method}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor={`edit_amount_${payment.id}`}>
            Amount
          </label>
          <Input
            id={`edit_amount_${payment.id}`}
            type="number"
            min={0.01}
            step={0.01}
            value={data.amount}
            onChange={(e) => setData('amount', e.currentTarget.value)}
            required
          />
          {errors.amount && <p className="text-destructive text-xs">{errors.amount}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor={`edit_status_${payment.id}`}>
            Status
          </label>
          <select
            id={`edit_status_${payment.id}`}
            className="border bg-background rounded-md px-2 py-2 text-sm"
            value={data.status}
            onChange={(e) => setData('status', e.currentTarget.value)}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
            <option value="declined">Declined</option>
            <option value="refunded">Refunded</option>
          </select>
          {errors.status && <p className="text-destructive text-xs">{errors.status}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor={`edit_ref_${payment.id}`}>
            Reference
          </label>
          <Input
            id={`edit_ref_${payment.id}`}
            value={data.transaction_reference}
            onChange={(e) => setData('transaction_reference', e.currentTarget.value)}
          />
          {errors.transaction_reference && <p className="text-destructive text-xs">{errors.transaction_reference}</p>}
        </div>

        <div className="grid gap-1">
          <label className="text-xs font-medium" htmlFor={`edit_remarks_${payment.id}`}>
            Remarks
          </label>
          <Input
            id={`edit_remarks_${payment.id}`}
            value={data.remarks}
            onChange={(e) => setData('remarks', e.currentTarget.value)}
          />
          {errors.remarks && <p className="text-destructive text-xs">{errors.remarks}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={processing}>
          {processing ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------ UI Badges -------------------------------- */

function PaymentStatusBadge({ status }: { status?: string }) {
  const s = (status || '').toLowerCase();
  const cls =
    s === 'paid'
      ? 'bg-green-600 text-white'
      : s === 'partial'
        ? 'bg-amber-500 text-black'
        : 'bg-red-600 text-white';
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : '-';
  return <Badge className={cls}>{label}</Badge>;
}

function BookingPaymentSummary({ booking }: { booking: BookingVM }) {
  const itemsTotal = Number(booking.totals?.items_total ?? 0);

  const completedPaid = Array.isArray(booking.payments)
    ? booking.payments
        .filter((p) => p.status === 'confirmed')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    : 0;

  const balance = Math.max(itemsTotal - completedPaid, 0);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <div>
        Total Services:{' '}
        <span className="font-medium">
          {itemsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div>
        Confirmed Paid:{' '}
        <span className="font-medium">
          {completedPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div>
        Balance Due:{' '}
        <span className="font-semibold">
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
