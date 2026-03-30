import { useCallback, useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Booking, BreadcrumbItem } from '@/types';
import bookingsRoutes from '@/routes/bookings';
import { cn } from '@/lib/utils';

// ✅ IMPORTANT: You can't use "@/..." directly in <img src="...">.
// You must import the asset so Vite can bundle it correctly.
import qrPng from '@/components/logo/qr.png';

const CONTACT_US_NUMBER = '09123456789'; // ✅ replace with your actual contact number

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
            <div className="mx-auto" style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}>
              <img src={src} alt={alt} className="w-full h-auto rounded-md" style={{ maxWidth: 'none' }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

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

function getOptionalString(obj: unknown, key: string): string {
  if (!isRecord(obj)) return '';
  const v = obj[key];
  return typeof v === 'string' ? v : '';
}

function fieldClass(disabled: boolean, hasError: boolean) {
  return cn(
    disabled && 'bg-muted text-muted-foreground',
    hasError && 'border-red-500 ring-2 ring-red-200/70 focus-visible:ring-red-200 dark:border-red-500 dark:ring-red-900/40',
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-red-600 dark:text-red-400">{message}</p>;
}

export type BookingPayload = {
  service_id: number | string | null;
  company_name: string;
  client_name: string;
  client_contact_number: string;
  client_email: string;
  survey_email: string;
  survey_proof_image: File | null;
  client_address: string;
  head_of_organization: string;
  type_of_event: string;
  booking_date_from: string;
  booking_date_to: string;
  number_of_guests: number | string;
  booking_status: 'pending' | 'active' | 'confirmed' | 'cancelled' | 'declined' | 'completed' | '';
};

type BookingFormData = BookingPayload & { _method?: 'put' };

type BlockKey = 'AM' | 'PM' | 'EVE';

type AvailabilityBlock = {
  key?: string;
  name?: string;
  label?: string;
  from?: string;
  to?: string;
  is_available?: boolean;
  available?: boolean;
};

type DailyAvailability = {
  date: string;
  busy: { from: string; to: string }[];
  free: { from: string; to: string }[];
  blocks?: Record<string, AvailabilityBlock> | AvailabilityBlock[];
  is_fully_booked?: boolean;
};

const BLOCK_ORDER: BlockKey[] = ['AM', 'PM', 'EVE'];

const BLOCK_META: Record<BlockKey, { label: string; time: string }> = {
  AM: { label: 'AM', time: '6:00 AM – 12:00 PM' },
  PM: { label: 'PM', time: '12:00 PM – 6:00 PM' },
  EVE: { label: 'EVE', time: '6:00 PM – 11:59 PM' },
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function getLocalTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseDateOnlyLocal(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}
function formatDateOnlyLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function addDays(dateStr: string, days: number): string {
  const d = parseDateOnlyLocal(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateOnlyLocal(d);
}
function sortBlocks(blocks: BlockKey[]): BlockKey[] {
  return BLOCK_ORDER.filter((b) => blocks.includes(b));
}
function toggleBlockSelection(prev: BlockKey[], key: BlockKey): BlockKey[] {
  const had = prev.includes(key);
  let next = had ? prev.filter((b) => b !== key) : [...prev, key];
  next = sortBlocks(Array.from(new Set(next)));

  const hasAM = next.includes('AM');
  const hasPM = next.includes('PM');
  const hasEVE = next.includes('EVE');

  if (hasAM && hasEVE && !hasPM) {
    if (!had) next = ['AM', 'PM', 'EVE'];
    else next = next.filter((b) => b !== 'EVE');
  }

  return sortBlocks(next);
}

/** "YYYY-MM-DDTHH:mm" */
function normalizeIso16(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
  if (m) return `${m[1]}T${m[2]}`;
  return s;
}

function inferBlocksFromRange(fromIso: string, toIso: string): BlockKey[] {
  if (!fromIso || !toIso) return [];
  const fromDate = fromIso.slice(0, 10);
  const fromTime = fromIso.slice(11, 16);

  const toDate = toIso.slice(0, 10);
  const toTime = toIso.slice(11, 16);

  const nextDay = addDays(fromDate, 1);
  const sameDay = toDate === fromDate;
  const isNextDay = toDate === nextDay;

  const endsAtLegacyMidnight = isNextDay && toTime === '00:00';
  const endsAtSameDayEOD = sameDay && toTime === '23:59';

  if (sameDay && fromTime === '06:00' && toTime === '12:00') return ['AM'];
  if (sameDay && fromTime === '12:00' && toTime === '18:00') return ['PM'];
  if (sameDay && fromTime === '06:00' && toTime === '18:00') return ['AM', 'PM'];

  if (fromTime === '18:00' && (endsAtSameDayEOD || endsAtLegacyMidnight)) return ['EVE'];
  if (fromTime === '12:00' && (endsAtSameDayEOD || endsAtLegacyMidnight)) return ['PM', 'EVE'];
  if (fromTime === '06:00' && (endsAtSameDayEOD || endsAtLegacyMidnight)) return ['AM', 'PM', 'EVE'];

  return [];
}

function formatTimeLabel(hm: string) {
  const [hStr, mStr] = hm.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return hm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${mStr} ${ampm}`;
}

function computeRangeFromDateAndBlocks(date: string, blocks: BlockKey[]) {
  if (!date || blocks.length === 0) return null;

  const hasAM = blocks.includes('AM');
  const hasPM = blocks.includes('PM');
  const hasEVE = blocks.includes('EVE');

  const startTime = hasAM ? '06:00' : hasPM ? '12:00' : '18:00';

  let endTime = '12:00';
  let endDate = date;

  if (hasEVE) {
    endTime = '23:59';
    endDate = date;
  } else if (hasPM) {
    endTime = '18:00';
    endDate = date;
  } else {
    endTime = '12:00';
    endDate = date;
  }

  const fromIso = `${date}T${startTime}`;
  const toIso = `${endDate}T${endTime}`;

  let label = blocks.join(' + ');
  if (hasAM && hasPM && !hasEVE) label = 'Whole Day';
  if (!hasAM && hasPM && hasEVE) label = 'Whole Day (PM + EVE)';
  if (hasAM && hasPM && hasEVE) label = 'Whole Day (Until 11:59 PM)';

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString();
  const display = `${dateLabel} • ${formatTimeLabel(startTime)} – ${formatTimeLabel(endTime)}`;

  return { fromIso, toIso, label, display };
}

function isBlockAvailable(av: DailyAvailability | null | undefined, key: BlockKey): boolean {
  if (!av?.blocks) return true;

  const blocks = av.blocks;

  if (Array.isArray(blocks)) {
    const found = blocks.find((b) => (b.key ?? b.name ?? b.label) === key);
    const val = found?.is_available ?? found?.available;
    return typeof val === 'boolean' ? val : true;
  }

  const found = (blocks as any)[key] ?? (blocks as any)[key.toLowerCase()];
  const val = found?.is_available ?? found?.available;
  return typeof val === 'boolean' ? val : true;
}

function toBookingStatus(value: unknown): BookingPayload['booking_status'] {
  if (typeof value !== 'string') return 'pending';
  switch (value) {
    case 'pending':
    case 'active':
    case 'confirmed':
    case 'cancelled':
    case 'declined':
    case 'completed':
    case '':
      return value;
    default:
      return 'pending';
  }
}

function BlockButton({
  block,
  selected,
  disabled,
  onClick,
}: {
  block: BlockKey;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? 'default' : 'outline'}
      disabled={disabled}
      onClick={onClick}
      className={cn('justify-start w-full sm:w-auto', disabled && 'opacity-60 cursor-not-allowed')}
    >
      <span className="font-semibold">{BLOCK_META[block].label}</span>
      <span className="ml-2 text-xs text-muted-foreground">{BLOCK_META[block].time}</span>
    </Button>
  );
}

/* ---------------------------------- Page ---------------------------------- */

const breadcrumbsBase: BreadcrumbItem[] = [{ title: 'Bookings', href: bookingsRoutes.index.url() }];

interface EditBookingProps {
  booking: Booking;
  unavailableDates?: string[];
}

export default function EditBooking({ booking }: EditBookingProps) {
  const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Edit', href: '/bookings' },
];


  const { auth, survey } = usePage<{ auth?: AuthLike | null; survey?: any }>().props;

  const roleNames = useMemo(() => getRoleNames(auth).map((r) => r.toLowerCase()), [auth]);
  const isAdmin = roleNames.includes('admin') || roleNames.includes('administrator') || roleNames.includes('superadmin');
  const isManager = roleNames.includes('manager');
  const isStaff = roleNames.includes('staff') || roleNames.includes('employee');

  const isAdminOrManager = isAdmin || isManager;

  const isClient = roleNames.includes('user') && !isAdminOrManager && !isStaff;

  // Admin/Manager: everything
  // Client: editable details + survey + proof image; schedule & status disabled
  const canEditAll = isAdminOrManager;

  const canEditBookingDetails = canEditAll || isClient;
  const canEditSurvey = canEditAll || isClient;

  const canEditSchedule = canEditAll;
  const canEditBookingStatus = canEditAll;

  const canSubmit = canEditAll || isClient;

  const todayStr = getLocalTodayStr();

  const originalFromIso = normalizeIso16((booking as any).booking_date_from);
  const originalToIso = normalizeIso16((booking as any).booking_date_to);

  const initialDate = originalFromIso ? originalFromIso.slice(0, 10) : '';
  const initialBlocks = inferBlocksFromRange(originalFromIso, originalToIso);

  const { data, setData, post, processing, errors, transform } = useForm<BookingFormData>({
    service_id: (booking as any).service_id ?? '',
    company_name: (booking as any).company_name ?? '',
    client_name: (booking as any).client_name ?? '',
    client_contact_number: (booking as any).client_contact_number ?? '',
    client_email: (booking as any).client_email ?? '',
    survey_email: getOptionalString(booking, 'survey_email'),
    survey_proof_image: null, // ✅ always null on load
    client_address: (booking as any).client_address ?? '',
    head_of_organization: getOptionalString(booking, 'head_of_organization'),
    type_of_event: (booking as any).type_of_event ?? '',
    booking_date_from: originalFromIso,
    booking_date_to: originalToIso,
    number_of_guests: (booking as any).number_of_guests ?? '',
    booking_status: toBookingStatus((booking as any).booking_status),
  });

  const [bookingDate, setBookingDate] = useState<string>(initialDate);
  const [selectedBlocks, setSelectedBlocks] = useState<BlockKey[]>(initialBlocks);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleTouched, setScheduleTouched] = useState(false);

  const [availability, setAvailability] = useState<DailyAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const existingSurveyProofUrl = getOptionalString(booking, 'survey_proof_image_url') || null;

  const [surveyProofPreviewUrl, setSurveyProofPreviewUrl] = useState<string | null>(null);
  const [surveyProofFileError, setSurveyProofFileError] = useState<string | null>(null);

  // ✅ QR source: use backend value if present, otherwise fallback to the imported qr.png
  const qrSrc = useMemo(() => {
    const s = survey?.qr_image_url;
    if (typeof s === 'string' && s.trim() !== '') return s;
    return qrPng;
  }, [survey]);

  useEffect(() => {
    if (!data.survey_proof_image) {
      setSurveyProofPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(data.survey_proof_image);
    setSurveyProofPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [data.survey_proof_image]);

  const fetchAvailabilityFor = useCallback(
    async (dateStr: string): Promise<DailyAvailability | null> => {
      if (!dateStr) return null;
      try {
        setAvailabilityLoading(true);
        setAvailabilityError(null);

        const res = await fetch(
          `/bookings/availability?date=${encodeURIComponent(dateStr)}&exclude_booking_id=${encodeURIComponent(
            String((booking as any).id),
          )}`,
        );

        if (!res.ok) throw new Error('Failed');

        const json = (await res.json()) as DailyAvailability;
        setAvailability(json);
        return json;
      } catch {
        setAvailabilityError('Unable to load availability for this date.');
        setAvailability(null);
        return null;
      } finally {
        setAvailabilityLoading(false);
      }
    },
    [booking],
  );

  useEffect(() => {
    if (!canEditSchedule) return;
    if (!bookingDate) return;
    void fetchAvailabilityFor(bookingDate);
  }, [bookingDate, fetchAvailabilityFor, canEditSchedule]);

  useEffect(() => {
    if (!canEditSchedule) return;
    if (!scheduleTouched) return;

    setScheduleError(null);

    if (!bookingDate || selectedBlocks.length === 0) return;

    const range = computeRangeFromDateAndBlocks(bookingDate, selectedBlocks);
    if (!range) return;

    if (availability) {
      const bad = selectedBlocks.filter((b) => !isBlockAvailable(availability, b));
      if (bad.length > 0) {
        setScheduleError(`Selected block(s) not available: ${bad.join(', ')}`);
        return;
      }
    }

    setData('booking_date_from', range.fromIso);
    setData('booking_date_to', range.toIso);
  }, [canEditSchedule, scheduleTouched, bookingDate, selectedBlocks, availability, setData]);

  const rangePreview = useMemo(() => {
    if (!bookingDate || selectedBlocks.length === 0) return null;
    return computeRangeFromDateAndBlocks(bookingDate, selectedBlocks);
  }, [bookingDate, selectedBlocks]);

  const handleProofFileChange = (file: File | null) => {
    setSurveyProofFileError(null);

    if (!file) {
      setData('survey_proof_image', null);
      return;
    }

    const allowedMime = ['image/png', 'image/jpeg', 'image/webp'];
    const name = file.name?.toLowerCase?.() ?? '';
    const extOk =
      name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp');
    const mimeOk = allowedMime.includes(file.type);

    if (!mimeOk && !extOk) {
      setSurveyProofFileError('Please upload a JPG, PNG, or WEBP image only.');
      setData('survey_proof_image', null);
      return;
    }

    setData('survey_proof_image', file);
  };

  const roCls = (disabled: boolean, hasError = false) => fieldClass(disabled, hasError);

  const bookingDetailsDisabled = !canEditBookingDetails;
  const scheduleDisabled = !canEditSchedule;
  const bookingStatusDisabled = !canEditBookingStatus;
  const surveyEmailDisabled = !canEditSurvey;
  const surveyProofDisabled = !canEditSurvey;

  const contactHref = `tel:${CONTACT_US_NUMBER.replace(/[^\d+]/g, '')}`;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (surveyProofFileError) return;

    if (canEditSchedule && scheduleTouched) {
      if (!bookingDate) {
        setScheduleError('Please select a booking date.');
        return;
      }
      if (selectedBlocks.length === 0) {
        setScheduleError('Please select AM/PM/EVE.');
        return;
      }
      if (scheduleError) return;
    }

    transform((payload) => {
      const { survey_proof_image, ...rest } = payload;

      const base: any = {
        ...rest,
        _method: 'put',
        service_id: payload.service_id === '' || payload.service_id === null ? null : Number(payload.service_id),
        number_of_guests: payload.number_of_guests === '' ? '' : Number(payload.number_of_guests),
      };

      // ✅ send file only if selected
      if (survey_proof_image) {
        base.survey_proof_image = survey_proof_image;
      }

      return base;
    });

    // ✅ Server redirects to bookings.show after update (controller)
    post(`/bookings/${(booking as any).id}`, {
      preserveScroll: true,
      preserveState: true,
      forceFormData: true,
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Booking - ${(booking as any).client_name ?? ''}`} />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" asChild>
            <Link href={bookingsRoutes.show.url({ booking: (booking as any).id })}>← Back to Booking</Link>
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto w-full">
          <CardHeader>
            <CardTitle>Edit booking</CardTitle>

            {isClient && (
              <div className="mt-2 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">Note</div>
                <div className="mt-1">
                  Schedule and status changes are not available here. Please contact{' '}
                  <a href={contactHref} className="text-primary underline underline-offset-2 font-medium">
                    {CONTACT_US_NUMBER}
                  </a>
                  .
                </div>
              </div>
            )}

            {!canSubmit && (
              <p className="text-xs text-destructive mt-2">You do not have permission to edit this booking.</p>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-5">
              {/* Booking details (CLIENT CAN EDIT ✅) */}
              <div className="rounded-md border p-4 bg-muted/5 grid gap-4">
                <div className="text-sm font-semibold">Booking details</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input
                      id="client_name"
                      value={data.client_name}
                      onChange={(e) => setData('client_name', e.currentTarget.value)}
                      required
                      disabled={bookingDetailsDisabled}
                      className={roCls(bookingDetailsDisabled, Boolean(errors.client_name))}
                    />
                    <FieldError message={errors.client_name} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="company_name">Company</Label>
                    <Input
                      id="company_name"
                      value={data.company_name}
                      onChange={(e) => setData('company_name', e.currentTarget.value)}
                      disabled={bookingDetailsDisabled}
                      className={roCls(bookingDetailsDisabled, Boolean(errors.company_name))}
                    />
                    <FieldError message={errors.company_name} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="client_contact_number">Contact Number</Label>
                    <Input
                      id="client_contact_number"
                      value={data.client_contact_number}
                      onChange={(e) => setData('client_contact_number', e.currentTarget.value)}
                      required
                      disabled={bookingDetailsDisabled}
                      className={roCls(bookingDetailsDisabled, Boolean(errors.client_contact_number))}
                    />
                    <FieldError message={errors.client_contact_number} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="client_email">Booking Email</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={data.client_email}
                      onChange={(e) => setData('client_email', e.currentTarget.value)}
                      required
                      disabled={bookingDetailsDisabled}
                      className={roCls(bookingDetailsDisabled, Boolean(errors.client_email))}
                    />
                    <FieldError message={errors.client_email} />
                  </div>

                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="client_address">Address</Label>
                    <Input
                      id="client_address"
                      value={data.client_address}
                      onChange={(e) => setData('client_address', e.currentTarget.value)}
                      required
                      disabled={bookingDetailsDisabled}
                      className={roCls(bookingDetailsDisabled, Boolean(errors.client_address))}
                    />
                    <FieldError message={errors.client_address} />
                  </div>

                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="head_of_organization">Head of Organization</Label>
                    <Input
                      id="head_of_organization"
                      value={data.head_of_organization}
                      onChange={(e) => setData('head_of_organization', e.currentTarget.value)}
                      disabled={bookingDetailsDisabled}
                      className={roCls(bookingDetailsDisabled, Boolean(errors.head_of_organization))}
                    />
                    <FieldError message={errors.head_of_organization} />
                  </div>

                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="type_of_event">Type of Event</Label>
                    <Input
                      id="type_of_event"
                      value={data.type_of_event}
                      onChange={(e) => setData('type_of_event', e.currentTarget.value)}
                      required
                      disabled={bookingDetailsDisabled}
                      className={roCls(bookingDetailsDisabled, Boolean(errors.type_of_event))}
                    />
                    <FieldError message={errors.type_of_event} />
                  </div>

                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="number_of_guests">Guests</Label>
                    <Input
                      id="number_of_guests"
                      type="number"
                      min={0}
                      step={1}
                      value={data.number_of_guests}
                      onChange={(e) => setData('number_of_guests', e.currentTarget.value)}
                      required
                      disabled={bookingDetailsDisabled}
                      className={roCls(bookingDetailsDisabled, Boolean(errors.number_of_guests))}
                    />
                    <FieldError message={errors.number_of_guests} />
                  </div>
                </div>
              </div>

              {/* Survey section (CLIENT CAN EDIT ✅) */}
              <div className="rounded-md border p-4 space-y-4 bg-muted/10">
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Survey</div>
                  <p className="text-xs text-muted-foreground">
                    Open the survey, enter the email used, and upload the proof image.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-[160px,1fr]">
                  <div className="flex items-center justify-center">
                    {/* ✅ Always show a QR image. Uses backend qr_image_url if set, otherwise falls back to local qr.png */}
                    <img
                      src={qrSrc}
                      alt="Survey QR code"
                      loading="lazy"
                      className="h-40 w-40 rounded-md border bg-background object-contain"
                      onError={(e) => {
                        // ✅ If remote fails, fallback to local
                        (e.currentTarget as HTMLImageElement).src = qrPng;
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm">
                      {survey?.url ? (
                        <a
                          href={survey.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline underline-offset-2"
                        >
                          Open the survey (Google Form)
                        </a>
                      ) : (
                        <span className="text-destructive">Survey link is not configured. Please contact the admin.</span>
                      )}
                    </div>

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="survey_email">Survey Email</Label>
                        <Input
                          id="survey_email"
                          type="email"
                          value={data.survey_email}
                          onChange={(e) => setData('survey_email', e.currentTarget.value)}
                          required
                          disabled={surveyEmailDisabled}
                          className={roCls(surveyEmailDisabled, Boolean(errors.survey_email))}
                        />
                        <FieldError message={errors.survey_email} />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="survey_proof_image">Proof Image (JPG/PNG/WEBP)</Label>
                        <Input
                          id="survey_proof_image"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleProofFileChange(e.currentTarget.files?.[0] ?? null)}
                          disabled={surveyProofDisabled}
                          className={roCls(surveyProofDisabled, Boolean(errors.survey_proof_image) || Boolean(surveyProofFileError))}
                          required={!existingSurveyProofUrl}
                        />
                        <p className="text-xs text-muted-foreground">
                          {existingSurveyProofUrl ? 'Leave blank to keep the existing proof.' : 'Required.'}
                        </p>

                        <FieldError message={surveyProofFileError} />
                        <FieldError message={errors.survey_proof_image} />
                      </div>
                    </div>

                    {(surveyProofPreviewUrl || existingSurveyProofUrl) && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {surveyProofPreviewUrl ? 'New preview' : 'Current proof'}
                        </div>
                        <ZoomableImagePreview
                          src={(surveyProofPreviewUrl ?? existingSurveyProofUrl!) as string}
                          alt="Survey proof"
                          title={surveyProofPreviewUrl ? 'New proof preview' : 'Current proof'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule (DISABLED FOR CLIENT ✅) */}
              <div className="rounded-md border p-4 bg-muted/5 grid gap-4">
                <div className="text-sm font-semibold">Schedule</div>

                <div className="grid gap-2">
                  <Label>Booking Date</Label>
                  <Input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => {
                      const next = e.currentTarget.value;
                      setBookingDate(next);
                      if (!scheduleDisabled) setScheduleTouched(true);
                    }}
                    disabled={scheduleDisabled}
                    className={roCls(scheduleDisabled, Boolean(scheduleError || errors.booking_date_from || errors.booking_date_to))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Choose Time Blocks</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {BLOCK_ORDER.map((b) => {
                      const isSelected = selectedBlocks.includes(b);
                      const isUnavailable = !!availability && !isBlockAvailable(availability, b);
                      const disabled = scheduleDisabled || (!isSelected && isUnavailable);

                      return (
                        <BlockButton
                          key={b}
                          block={b}
                          selected={isSelected}
                          disabled={disabled}
                          onClick={() => {
                            if (disabled) return;
                            if (!bookingDate) {
                              setScheduleError('Please select a date first.');
                              return;
                            }
                            setScheduleTouched(true);
                            setSelectedBlocks((prev) => toggleBlockSelection(prev, b));
                          }}
                        />
                      );
                    })}
                  </div>

                  <FieldError message={scheduleError} />

                  {canEditSchedule && rangePreview && (
                    <div className="rounded-md border p-3 bg-muted/30 text-sm">
                      <div className="font-medium">Selected: {rangePreview.label}</div>
                      <div className="text-muted-foreground">{rangePreview.display}</div>
                      <div className="text-xs text-muted-foreground">
                        From: <code>{rangePreview.fromIso}</code> • To: <code>{rangePreview.toIso}</code>
                      </div>
                    </div>
                  )}

                  {canEditSchedule && (
                    <div className="text-xs mt-1 border rounded-md p-3 bg-muted/20 space-y-1">
                      {availabilityLoading && <p>Loading availability…</p>}
                      {availabilityError && <p className="text-destructive">{availabilityError}</p>}
                      {availability && !availabilityLoading && !availabilityError && (
                        <p className="text-muted-foreground">
                          {BLOCK_ORDER
                            .map((b) => `${b}: ${isBlockAvailable(availability, b) ? 'Available' : 'Booked'}`)
                            .join(' • ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status (DISABLED FOR CLIENT ✅) */}
              <div className="rounded-md border p-4 bg-muted/5 grid gap-4">
                <div className="text-sm font-semibold">Status</div>

                <div className="grid gap-2">
                  <Label htmlFor="booking_status">Status</Label>
                  <select
                    id="booking_status"
                    className={cn(
                      'border bg-background rounded-md px-2 py-2 text-sm disabled:opacity-60',
                      bookingStatusDisabled && 'bg-muted text-muted-foreground',
                      errors.booking_status && 'border-red-500 ring-2 ring-red-200/70 dark:border-red-500 dark:ring-red-900/40',
                    )}
                    value={data.booking_status}
                    onChange={(e) => setData('booking_status', toBookingStatus(e.currentTarget.value))}
                    disabled={bookingStatusDisabled}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="declined">Declined</option>
                    <option value="completed">Completed</option>
                  </select>

                  <FieldError message={errors.booking_status} />

                  {isClient && (
                    <p className="text-xs text-muted-foreground">
                      Need schedule or status changes? Contact{' '}
                      <a href={contactHref} className="text-primary underline underline-offset-2 font-medium">
                        {CONTACT_US_NUMBER}
                      </a>
                      .
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild disabled={processing}>
                  <Link href={bookingsRoutes.show.url({ booking: (booking as any).id })}>Cancel</Link>
                </Button>

                <Button type="submit" disabled={processing || !canSubmit}>
                  {processing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
