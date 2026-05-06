import type { RoleKey } from '@/lib/role-workspaces';

export type BookingStatus =
  | 'pending'
  | 'pencil_booked'
  | 'for_review'
  | 'confirmed'
  | 'approved'
  | 'active'
  | 'cancelled'
  | 'declined'
  | 'completed'
  | 'expired'
  | string;

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'partial'
  | 'partially_paid'
  | 'paid'
  | 'confirmed'
  | 'verified'
  | 'owing'
  | 'failed'
  | 'declined'
  | 'refunded'
  | string;

export type BookingPaymentLike = {
  id: number | string;
  amount?: number | string | null;
  status?: string | null;
  payment_method?: string | null;
  payment_gateway?: string | null;
  payment_type?: string | null;
  transaction_reference?: string | null;
  proof_image_url?: string | null;
  created_at?: string | null;
  remarks?: string | null;
  [key: string]: unknown;
};

export type BookingLike = {
  id: number | string;
  client_name?: string | null;
  company_name?: string | null;
  head_of_organization?: string | null;
  organization_type?: string | null;

  type_of_event?: string | null;
  booking_status?: BookingStatus | null;
  payment_status?: PaymentStatus | null;

  booking_date_from?: string | null;
  booking_date_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  service_id?: number | string | null;
  service_name?: string | null;
  service?: {
    id?: number | string;
    name?: string | null;
    service_type_id?: number | string | null;
    service_type?: {
      id?: number | string;
      name?: string | null;
    } | null;
  } | null;

  service_type_name?: string | null;
  venue_area?: string | null;

  number_of_guests?: number | string | null;
  client_email?: string | null;
  client_contact_number?: string | null;
  client_address?: string | null;
  client_region?: string | null;
  client_province?: string | null;
  client_city_municipality?: string | null;
  client_barangay?: string | null;
  client_zip_code?: string | null;
  client_street_address?: string | null;

  survey_email?: string | null;
  survey_proof_image_url?: string | null;

  public_calendar_title?: string | null;
  is_public_calendar_visible?: boolean | number | null;

  totals?: {
    items_total?: number | string | null;
    payments_total?: number | string | null;
    submitted_payments_total?: number | string | null;
    confirmed_payments_total?: number | string | null;
    remaining_balance?: number | string | null;
    [key: string]: unknown;
  } | null;

  payments?: BookingPaymentLike[];

  [key: string]: unknown;
};

export type BookingWorkspaceCopy = {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  createLabel: string;
  listLabel: string;
  canCreate: boolean;
  canDelete: boolean;
  showClientHelp: boolean;
};

export type PaginationLink = {
  url?: string | null;
  label?: string | null;
  active?: boolean;
};

export type CollectionLike<T> =
  | T[]
  | {
      data?: T[];
      links?: PaginationLink[];
      meta?: {
        links?: PaginationLink[];
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };

export function normalizeWorkspaceRole(value?: string | null): RoleKey {
  if (value === 'admin') return 'admin';
  if (value === 'manager') return 'manager';
  if (value === 'staff') return 'staff';
  return 'user';
}

export function bookingWorkspaceCopy(role: RoleKey): BookingWorkspaceCopy {
  if (role === 'admin') {
    return {
      eyebrow: 'Executive Booking Control',
      title: 'All Booking Records',
      description:
        'Full booking operations workspace for monitoring schedules, client details, payment proof, survey proof, audit checks, and reservation control.',
      emptyTitle: 'No booking records yet',
      emptyDescription:
        'Once client or staff bookings are created, all reservation records will appear here.',
      createLabel: 'Create Booking',
      listLabel: 'All Bookings',
      canCreate: true,
      canDelete: true,
      showClientHelp: false,
    };
  }

  if (role === 'manager') {
    return {
      eyebrow: 'Management Review',
      title: 'Booking Review',
      description:
        'Review booking requests, monitor payment compliance, inspect schedules, and approve operational updates.',
      emptyTitle: 'No bookings for review',
      emptyDescription:
        'Bookings requiring monitoring, approval, or payment review will appear here.',
      createLabel: 'Create Booking',
      listLabel: 'Review Bookings',
      canCreate: false,
      canDelete: false,
      showClientHelp: false,
    };
  }

  if (role === 'staff') {
    return {
      eyebrow: 'Operations Booking Desk',
      title: 'Booking Assistance',
      description:
        'Daily workspace for creating assisted bookings, checking schedules, updating client details, and handling reservation follow-ups.',
      emptyTitle: 'No operational bookings found',
      emptyDescription:
        'Use the create booking button when assisting a client or checking a reservation request.',
      createLabel: 'Assist New Booking',
      listLabel: 'Operational Bookings',
      canCreate: true,
      canDelete: false,
      showClientHelp: false,
    };
  }

  return {
    eyebrow: 'Client Booking Portal',
    title: 'My Bookings',
    description:
      'Track your submitted event booking requests, continue survey requirements, and submit payment proof for review.',
    emptyTitle: 'You have no bookings yet',
    emptyDescription:
      'Start a booking request to reserve a date and venue at Baguio Convention and Cultural Center.',
    createLabel: 'Book Your Event',
    listLabel: 'My Bookings',
    canCreate: true,
    canDelete: false,
    showClientHelp: true,
  };
}

export function bookingBasePath(role: RoleKey): string {
  if (role === 'admin') return '/admin/bookings';
  if (role === 'manager') return '/manager/bookings';
  if (role === 'staff') return '/staff/bookings';
  return '/my-bookings';
}

export function bookingCreatePath(role: RoleKey): string {
  if (role === 'admin') return '/admin/bookings/create';
  if (role === 'staff') return '/staff/bookings/create';
  if (role === 'manager') return '/manager/bookings';
  return '/book';
}

export function bookingShowPath(role: RoleKey, id: number | string): string {
  return `${bookingBasePath(role)}/${id}`;
}

export function bookingEditPath(role: RoleKey, id: number | string): string {
  return `${bookingBasePath(role)}/${id}/edit`;
}

export function bookingSurveyPath(role: RoleKey, id: number | string): string {
  return `${bookingBasePath(role)}/${id}/survey`;
}

export function bookingPaymentPath(role: RoleKey, id: number | string): string {
  return `${bookingBasePath(role)}/${id}/payments`;
}

export function bookingProofPath(role: RoleKey, id: number | string): string {
  return `${bookingBasePath(role)}/${id}/survey-proof-image`;
}

export function formatMoney(value?: number | string | null): string {
  const parsed = Number(value ?? 0);

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

export function formatDate(value?: string | null): string {
  if (!value) return 'Not set';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'Not set';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function cleanLabel(value?: string | null): string {
  return String(value || 'Not set')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function statusTone(status?: string | null): string {
  const normalized = String(status || '').toLowerCase();

  if (
    [
      'confirmed',
      'approved',
      'active',
      'completed',
      'paid',
      'verified',
      'fully_paid',
      'downpayment_verified',
    ].includes(normalized)
  ) {
    return 'border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200';
  }

  if (
    [
      'pending',
      'pencil_booked',
      'for_review',
      'partial',
      'partially_paid',
      'owing',
      'submitted',
      'pending_review',
      'pending_payment',
      'downpayment_submitted',
    ].includes(normalized)
  ) {
    return 'border-amber-300/40 bg-amber-400/10 text-amber-700 dark:text-amber-200';
  }

  if (
    [
      'cancelled',
      'declined',
      'failed',
      'unpaid',
      'rejected',
      'expired',
      'refunded',
    ].includes(normalized)
  ) {
    return 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200';
  }

  return 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)]';
}

export function extractBookings(payload: unknown): BookingLike[] {
  if (Array.isArray(payload)) {
    return payload as BookingLike[];
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data;

    if (Array.isArray(data)) {
      return data as BookingLike[];
    }
  }

  return [];
}

export function extractPagination(payload: unknown): {
  links: PaginationLink[];
  meta: unknown | null;
} {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      links: [],
      meta: null,
    };
  }

  const objectPayload = payload as {
    links?: PaginationLink[];
    meta?: {
      links?: PaginationLink[];
      [key: string]: unknown;
    };
  };

  return {
    links: Array.isArray(objectPayload.links)
      ? objectPayload.links
      : Array.isArray(objectPayload.meta?.links)
        ? objectPayload.meta.links
        : [],
    meta: objectPayload.meta ?? null,
  };
}

export function textValue(value: unknown, fallback = 'Not set'): string {
  if (value === null || value === undefined || String(value).trim() === '') {
    return fallback;
  }

  return String(value);
}

export function totalValue(booking: BookingLike, key: string): number | string | null {
  const totals = booking.totals as Record<string, unknown> | null | undefined;
  const value = totals?.[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }

  return null;
}

export function bookingVenueLabel(booking: BookingLike): string {
  return textValue(
    booking.venue_area ??
      booking.service_type_name ??
      booking.service?.service_type?.name ??
      booking.service_name ??
      booking.service?.name,
    'Venue not set',
  );
}

export function bookingServiceLabel(booking: BookingLike): string {
  return textValue(booking.service_name ?? booking.service?.name, 'Rental option not set');
}

export function bookingDateRange(booking: BookingLike): string {
  const from = formatDate(booking.booking_date_from);
  const to = formatDate(booking.booking_date_to);

  if (!booking.booking_date_to || booking.booking_date_to === booking.booking_date_from) {
    return from;
  }

  return `${from} — ${to}`;
}

export function bookingRemainingBalance(booking: BookingLike): number {
  const direct = Number(totalValue(booking, 'remaining_balance'));

  if (Number.isFinite(direct)) {
    return Math.max(direct, 0);
  }

  const total = Number(totalValue(booking, 'items_total') ?? 0);
  const confirmed = Number(
    totalValue(booking, 'confirmed_payments_total') ??
      totalValue(booking, 'payments_total') ??
      0,
  );

  const remaining = total - confirmed;

  if (!Number.isFinite(remaining)) {
    return 0;
  }

  return Math.max(remaining, 0);
}
