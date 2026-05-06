import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import {
  BCCC_BOOKING_GENERAL_GUIDELINES,
  BOOKING_USAGE_LABELS,
  BOOKING_VENUE_CATALOG,
  catalogItemMatchesService,
  estimateVenueCharge,
  type BookingUsageKey,
  type BookingVenueCatalogItem,
  type BookingVenueKey,
} from '@/lib/booking-venue-catalog';
import {
  bookingBasePath,
  bookingShowPath,
  normalizeWorkspaceRole,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Pencil,
  ReceiptText,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ServiceOption = {
  id: number | string;
  name: string;
  price?: number | string | null;
  description?: string | null;
  service_type_id?: number | string | null;
  service_type_name?: string | null;
  service_type?: {
    id?: number | string;
    name?: string | null;
  } | null;
};

type ServiceTypeOption = {
  id: number | string;
  name: string;
  services?: ServiceOption[];
};

type PaginatedLike<T> = {
  data?: T[];
};

type InitialSchedule = {
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;

  date_from?: string | null;
  date_to?: string | null;
  booking_date_from?: string | null;
  booking_date_to?: string | null;

  from?: string | null;
  to?: string | null;
};

type BookingRecord = Record<string, any>;

type BookingFormPageProps = {
  workspaceRole?: string;
  booking?: BookingRecord;
  serviceTypes?: ServiceTypeOption[] | PaginatedLike<ServiceTypeOption>;
  services?: ServiceOption[] | PaginatedLike<ServiceOption>;
  initialSchedule?: InitialSchedule;
  initialVenue?: string | null;
  initialEventType?: string | null;
  initialGuests?: number | string | null;
};

type BookingFormData = {
  service_id: string;
  organization_type: string;
  company_name: string;
  client_name: string;
  client_contact_number: string;
  client_email: string;

  client_address: string;
  client_region: string;
  client_province: string;
  client_city_municipality: string;
  client_barangay: string;
  client_zip_code: string;
  client_street_address: string;

  head_of_organization: string;
  type_of_event: string;

  booking_date_from: string;
  booking_date_to: string;
  number_of_guests: string;

  survey_email: string;
  survey_proof_image: File | null;

  booking_status: string;
  payment_status: string;
  is_public_calendar_visible: boolean;
  public_calendar_title: string;

  package_acknowledged: boolean;
  policy_acknowledged: boolean;
  accuracy_acknowledged: boolean;
};

type MatchedVenueItem = BookingVenueCatalogItem & {
  service?: ServiceOption;
  configured: boolean;
};

type StepDefinition = {
  title: string;
  subtitle: string;
  icon: typeof PackageCheck;
};

type FieldName = keyof BookingFormData;

const BOOKING_STEPS: StepDefinition[] = [
  {
    title: 'Package',
    subtitle: 'Venue and rate',
    icon: PackageCheck,
  },
  {
    title: 'Organizer',
    subtitle: 'Event and contact',
    icon: UserRound,
  },
  {
    title: 'Address',
    subtitle: 'Client location',
    icon: MapPin,
  },
  {
    title: 'Schedule',
    subtitle: 'Date and guests',
    icon: CalendarDays,
  },
  {
    title: 'Guidelines',
    subtitle: 'Rules and proof',
    icon: ShieldCheck,
  },
  {
    title: 'Review',
    subtitle: 'Final check',
    icon: CheckCircle2,
  },
];

const ORGANIZATION_TYPES = [
  'Private',
  'Government',
  'NGO',
  'Academe',
  'Religious',
  'Corporate',
  'Others',
];

const EVENT_TYPE_OPTIONS = [
  'Conference',
  'Convention',
  'Summit',
  'Seminar',
  'Workshop',
  'Training',
  'Meeting',
  'Board Meeting',
  'General Assembly',
  'Government Program',
  'Public Forum',
  'Press Conference',
  'Exhibit',
  'Expo',
  'Trade Fair',
  'Corporate Event',
  'Cultural Program',
  'Concert',
  'Awards Night',
  'Graduation',
  'Recognition Program',
  'Wedding Reception',
  'Private Event',
];

const PH_DEFAULTS = {
  region: 'CAR',
  province: 'Benguet',
  city: 'Baguio City',
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function collection<T>(value?: T[] | PaginatedLike<T>): T[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
}

function firstValue(...values: unknown[]): string {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value);
    }
  }

  return '';
}

function money(value: unknown): string {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) return '₱0.00';

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(number);
}

function normalizeSearch(value?: string | null): string {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/gallery\s*2600/g, 'gallery2600')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toInputDateTime(value?: string | null): string {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function buildInitialDateTime(
  schedule?: InitialSchedule,
  fallback?: string | null,
  part?: 'from' | 'to',
): string {
  if (fallback) {
    return toInputDateTime(fallback);
  }

  if (!schedule) {
    return '';
  }

  const exactFrom = firstValue(
    schedule.booking_date_from,
    schedule.date_from,
    schedule.from,
  );

  const exactTo = firstValue(
    schedule.booking_date_to,
    schedule.date_to,
    schedule.to,
  );

  if (part === 'from' && exactFrom) {
    return toInputDateTime(exactFrom);
  }

  if (part === 'to' && exactTo) {
    return toInputDateTime(exactTo);
  }

  if (schedule.date && schedule.start_time && part === 'from') {
    return `${schedule.date}T${schedule.start_time}`;
  }

  if (schedule.date && schedule.end_time && part === 'to') {
    return `${schedule.date}T${schedule.end_time}`;
  }

  return '';
}

function flattenServices(
  serviceTypes?: ServiceTypeOption[] | PaginatedLike<ServiceTypeOption>,
  services?: ServiceOption[] | PaginatedLike<ServiceOption>,
): ServiceOption[] {
  const directServices = collection(services);

  const nestedServices = collection(serviceTypes).flatMap((type) =>
    Array.isArray(type.services)
      ? type.services.map((service) => ({
          ...service,
          service_type_id: service.service_type_id ?? type.id,
          service_type_name: service.service_type_name ?? type.name,
        }))
      : [],
  );

  const merged = [...directServices, ...nestedServices];
  const seen = new Set<string>();

  return merged.filter((service) => {
    const key = String(service.id);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function serviceTypeNameForService(service: ServiceOption): string {
  return firstValue(service.service_type_name, service.service_type?.name);
}

function serviceSearchName(service: ServiceOption): string {
  return [
    service.name,
    service.service_type_name,
    service.service_type?.name,
  ]
    .filter(Boolean)
    .join(' ');
}

function matchCatalogWithServices(services: ServiceOption[]): MatchedVenueItem[] {
  return BOOKING_VENUE_CATALOG.map((item) => {
    const service = services.find((option) => {
      return (
        catalogItemMatchesService(item, option.name) ||
        catalogItemMatchesService(item, option.service_type_name) ||
        catalogItemMatchesService(item, option.service_type?.name) ||
        catalogItemMatchesService(item, serviceSearchName(option))
      );
    });

    return {
      ...item,
      service,
      configured: Boolean(service),
    };
  });
}

function matchInitialServiceId(
  booking: BookingRecord | undefined,
  initialVenue: string | null | undefined,
  services: ServiceOption[],
): string {
  const direct = firstValue(booking?.service_id, booking?.service?.id);

  if (direct) {
    return direct;
  }

  const needle = normalizeSearch(initialVenue);

  if (!needle) {
    return '';
  }

  const matched = services.find((service) => {
    const haystack = normalizeSearch(
      [
        service.name,
        serviceTypeNameForService(service),
        service.service_type?.name,
      ]
        .filter(Boolean)
        .join(' '),
    );

    return haystack.includes(needle) || needle.includes(haystack);
  });

  return matched?.id ? String(matched.id) : '';
}

function combinedAddress(data: BookingFormData): string {
  return [
    data.client_street_address,
    data.client_barangay,
    data.client_city_municipality,
    data.client_province,
    data.client_region,
    data.client_zip_code,
  ]
    .filter(Boolean)
    .join(', ');
}

function formTitle(role: RoleThemeKey, editing: boolean): string {
  if (role === 'admin') return editing ? 'Edit Reservation' : 'Create Reservation';
  if (role === 'manager') return 'Review Reservation';
  if (role === 'staff') return editing ? 'Update Assisted Booking' : 'Assist Booking';

  return editing ? 'Update Your Event Request' : 'Reserve Your Event Space';
}

function formDescription(role: RoleThemeKey): string {
  if (role === 'user') {
    return 'Complete each page slowly, review the summary, then submit your event request for BCCC assessment.';
  }

  return 'Create or update a reservation using the official BCCC booking fields, rules, schedule, and payment workflow.';
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function dateOnlyFromDateTime(value?: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}

function rangeHours(from?: string | null, to?: string | null): number {
  if (!from || !to) return 0;

  const start = Date.parse(from);
  const end = Date.parse(to);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return Math.round(((end - start) / 36_000) / 10);
}

function fieldStatusClass(error?: string): string {
  return error
    ? 'border-rose-300/70 bg-rose-50 text-rose-900 placeholder:text-rose-300 focus:border-rose-500 dark:border-rose-400/50 dark:bg-rose-500/10 dark:text-white'
    : 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-text)] focus:border-[var(--bccc-backend-gold-line)]';
}

function StepIcon({
  icon: Icon,
  done,
  current,
}: {
  icon: typeof PackageCheck;
  done: boolean;
  current: boolean;
}) {
  if (done) {
    return <Check className="h-4 w-4" />;
  }

  return <Icon className={cx('h-4 w-4', current && 'text-[var(--bccc-backend-gold)]')} />;
}

function Field({
  label,
  required,
  error,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  helper?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="booking-lux-field">
      <span className="booking-lux-field-label">
        {label}
        {required ? <strong>*</strong> : null}
      </span>

      {children}

      {helper && !error ? (
        <span className="booking-lux-field-helper">{helper}</span>
      ) : null}

      {error ? (
        <span className="booking-lux-field-error">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ServerErrorsBanner({ errors }: { errors: Record<string, string> }) {
  const values = Object.values(errors).filter(Boolean);

  if (values.length === 0) return null;

  return (
    <div className="booking-lux-error-banner">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Please review the highlighted fields.</p>
          <ul className="mt-2 space-y-1 text-sm leading-6">
            {values.slice(0, 5).map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function WizardNotice({ errors }: { errors: Record<string, string> }) {
  const values = Object.values(errors).filter(Boolean);

  if (values.length === 0) return null;

  return (
    <div className="booking-step-warning">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Complete this page first.</p>
        <ul className="mt-2 space-y-1 text-sm leading-6">
          {values.map((error) => (
            <li key={error}>• {error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function VenueImage({
  item,
  selected,
}: {
  item: BookingVenueCatalogItem;
  selected: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="booking-venue-image">
      {!failed && item.image ? (
        <img
          src={item.image}
          alt={item.displayLabel || item.label}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover brightness-[0.58] saturate-[0.95] transition duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_15%,rgba(169,132,67,0.30),transparent_35%),linear-gradient(135deg,#15382f,#070b08)]">
          <Sparkles className="h-12 w-12 text-[#f1d69d]/80" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/28 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f1d69d]">
          {item.category === 'package' ? 'Complete Package' : 'Individual Space'}
          {item.capacity ? ` · ${item.capacity}` : ''}
        </p>

        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.055em]">
          {item.displayLabel || item.label}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/72">
          {item.subtitle}
        </p>
      </div>

      {selected ? (
        <div className="absolute right-4 top-4 border border-[#d7b46a]/60 bg-[#d7b46a]/18 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f9e3ad]">
          Selected
        </div>
      ) : null}
    </div>
  );
}

function VenueCard({
  item,
  selected,
  onSelect,
}: {
  item: MatchedVenueItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      data-venue-key={item.key}
      className={cx(
        'booking-venue-card group',
        selected && 'is-selected',
        !item.configured && 'is-disabled',
      )}
    >
      <VenueImage item={item} selected={selected} />

      <div className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-backend-gold)]">
              {item.category === 'package' ? 'Flagship reservation' : 'Venue selection'}
            </p>

            <h4 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-[var(--bccc-backend-text)]">
              {item.label}
            </h4>
          </div>

          <span
            className={cx(
              'border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]',
              item.configured
                ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
                : 'border-rose-300/40 bg-rose-400/10 text-rose-700 dark:text-rose-200',
            )}
          >
            {item.configured ? 'Ready' : 'Missing'}
          </span>
        </div>

        <p className="min-h-[4.5rem] text-sm leading-7 text-[var(--bccc-backend-muted)]">
          {item.longDescription || item.description}
        </p>

        <div className="grid gap-2 text-sm">
          <div className="booking-rate-line">
            <span>Whole Day</span>
            <strong>{money(item.rates.whole_day)}</strong>
          </div>

          <div className="booking-rate-line">
            <span>Half Day</span>
            <strong>{money(item.rates.half_day)}</strong>
          </div>

          <div className="booking-rate-line">
            <span>Extra Hour</span>
            <strong>{money(item.rates.additional_hour)}</strong>
          </div>
        </div>

        <div>
          <p className="booking-mini-heading">Included</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.includes.slice(0, 6).map((included) => (
              <span key={included} className="booking-chip">
                {included}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onSelect}
          disabled={!item.configured}
          className={cx(
            'booking-venue-select-btn',
            selected && 'is-selected',
          )}
        >
          {selected ? 'Selected Package' : item.configured ? 'Choose Package' : 'Backend Option Missing'}
        </button>
      </div>
    </article>
  );
}

function Stepper({
  activeStep,
  maxStep,
  onStepClick,
}: {
  activeStep: number;
  maxStep: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <nav className="booking-stepper" aria-label="Booking form steps">
      {BOOKING_STEPS.map((step, index) => {
        const Icon = step.icon;
        const current = index === activeStep;
        const done = index < activeStep;
        const unlocked = index <= maxStep;

        return (
          <button
            key={step.title}
            type="button"
            disabled={!unlocked}
            onClick={() => onStepClick(index)}
            className={cx(
              'booking-wizard-step-pill',
              current && 'is-current',
              done && 'is-done',
            )}
          >
            <span className="booking-step-icon">
              <StepIcon icon={Icon} done={done} current={current} />
            </span>

            <span className="min-w-0">
              <span className="block truncate">{step.title}</span>
              <small className="block truncate">{step.subtitle}</small>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function ReviewBlock({
  title,
  icon: Icon,
  children,
  onEdit,
}: {
  title: string;
  icon: typeof UserRound;
  children: ReactNode;
  onEdit: () => void;
}) {
  return (
    <section className="booking-review-block">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="booking-review-icon">
            <Icon className="h-4 w-4" />
          </span>

          <h3>{title}</h3>
        </div>

        <button type="button" onClick={onEdit} className="booking-review-edit">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </header>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function ReviewGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <div className="booking-review-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <p>{label}</p>
          <strong>{value || '—'}</strong>
        </div>
      ))}
    </div>
  );
}

export function BookingFormPage() {
  const { props } = usePage<BookingFormPageProps>();

  const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
  const booking = props.booking;
  const editing = Boolean(booking?.id);
  const isClient = role === 'user';
  const isManager = role === 'manager';
  const isStaffLike = role === 'admin' || role === 'manager' || role === 'staff';

  const packageCarouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('booking-wizard-screen-active');

    return () => {
      document.documentElement.classList.remove('booking-wizard-screen-active');
    };
  }, []);

  const services = useMemo(
    () => flattenServices(props.serviceTypes, props.services),
    [props.serviceTypes, props.services],
  );

  const venueItems = useMemo(() => matchCatalogWithServices(services), [services]);

  const initialServiceId = useMemo(
    () => matchInitialServiceId(booking, props.initialVenue, services),
    [booking, props.initialVenue, services],
  );

  const matchedInitialVenue =
    venueItems.find((item) => String(item.service?.id ?? '') === String(initialServiceId)) ??
    venueItems.find((item) => item.configured) ??
    venueItems[0];

  const [selectedVenueKey, setSelectedVenueKey] = useState<BookingVenueKey | null>(
    matchedInitialVenue?.key ?? null,
  );

  const [usage, setUsage] = useState<BookingUsageKey>('whole_day');
  const [durationHours, setDurationHours] = useState('1');
  const [otherRentals, setOtherRentals] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [showDigitalForm, setShowDigitalForm] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);

  const selectedVenue = venueItems.find((item) => item.key === selectedVenueKey);

  const selectedIndex = Math.max(
    0,
    venueItems.findIndex((item) => item.key === selectedVenueKey),
  );

  const estimatedBase = estimateVenueCharge(
    selectedVenue,
    usage,
    Number(durationHours || 1),
  );

  const estimatedAdditional = Number(additionalCharges || 0);
  const estimatedTotal = estimatedBase + (Number.isFinite(estimatedAdditional) ? estimatedAdditional : 0);

  const backHref =
    editing && booking?.id ? bookingShowPath(role, booking.id) : bookingBasePath(role);

  const initialFrom = buildInitialDateTime(
    props.initialSchedule,
    booking?.booking_date_from,
    'from',
  );

  const initialTo = buildInitialDateTime(
    props.initialSchedule,
    booking?.booking_date_to,
    'to',
  );

  const hasPublicPrefill = Boolean(
    props.initialVenue ||
      props.initialEventType ||
      props.initialGuests ||
      initialFrom ||
      initialTo,
  );

  const {
    data,
    setData,
    post,
    put,
    processing,
    errors,
    transform,
  } = useForm<BookingFormData>({
    service_id: initialServiceId,
    organization_type: firstValue(booking?.organization_type, 'Private'),
    company_name: firstValue(booking?.company_name),
    client_name: firstValue(booking?.client_name),
    client_contact_number: firstValue(booking?.client_contact_number),
    client_email: firstValue(booking?.client_email),

    client_address: firstValue(booking?.client_address),
    client_region: firstValue(booking?.client_region, PH_DEFAULTS.region),
    client_province: firstValue(booking?.client_province, PH_DEFAULTS.province),
    client_city_municipality: firstValue(booking?.client_city_municipality, PH_DEFAULTS.city),
    client_barangay: firstValue(booking?.client_barangay),
    client_zip_code: firstValue(booking?.client_zip_code),
    client_street_address: firstValue(booking?.client_street_address, booking?.client_address),

    head_of_organization: firstValue(booking?.head_of_organization),
    type_of_event: firstValue(booking?.type_of_event, props.initialEventType),

    booking_date_from: initialFrom,
    booking_date_to: initialTo,
    number_of_guests: firstValue(booking?.number_of_guests, props.initialGuests),

    survey_email: firstValue(booking?.survey_email, booking?.client_email),
    survey_proof_image: null,

    booking_status: firstValue(booking?.booking_status, 'pending'),
    payment_status: firstValue(booking?.payment_status, 'unpaid'),
    is_public_calendar_visible: Boolean(booking?.is_public_calendar_visible ?? false),
    public_calendar_title: firstValue(booking?.public_calendar_title),

    package_acknowledged: Boolean(editing || hasPublicPrefill),
    policy_acknowledged: Boolean(editing),
    accuracy_acknowledged: Boolean(editing),
  });

  const mergedErrors = {
    ...errors,
    ...stepErrors,
  } as Record<string, string>;

  function fieldError(name: FieldName | string): string | undefined {
    return mergedErrors[name];
  }

  function focusVenueCard(key: BookingVenueKey) {
    window.requestAnimationFrame(() => {
      const carousel = packageCarouselRef.current;
      const card = carousel?.querySelector<HTMLElement>(`[data-venue-key="${key}"]`);

      if (!carousel || !card) return;

      const carouselRect = carousel.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      carousel.scrollTo({
        left:
          carousel.scrollLeft +
          (cardRect.left - carouselRect.left) -
          carouselRect.width / 2 +
          cardRect.width / 2,
        behavior: 'smooth',
      });
    });
  }

  function selectVenue(item: MatchedVenueItem) {
    if (!item.configured) return;

    setSelectedVenueKey(item.key);
    setData('service_id', item.service?.id ? String(item.service.id) : '');
    setStepErrors({});
    focusVenueCard(item.key);
  }

  function moveVenue(direction: 'previous' | 'next') {
    const nextIndex =
      direction === 'previous'
        ? Math.max(0, selectedIndex - 1)
        : Math.min(venueItems.length - 1, selectedIndex + 1);

    const nextVenue = venueItems[nextIndex];

    if (nextVenue) {
      selectVenue(nextVenue);
    }
  }

  function setScheduleBlock(block: 'AM' | 'PM' | 'EVE' | 'DAY') {
    const baseDate = dateOnlyFromDateTime(data.booking_date_from) || new Date().toISOString().slice(0, 10);

    const ranges = {
      AM: [`${baseDate}T06:00`, `${baseDate}T12:00`],
      PM: [`${baseDate}T12:00`, `${baseDate}T18:00`],
      EVE: [`${baseDate}T18:00`, `${baseDate}T23:59`],
      DAY: [`${baseDate}T06:00`, `${baseDate}T23:59`],
    };

    setData('booking_date_from', ranges[block][0]);
    setData('booking_date_to', ranges[block][1]);
  }

  function validateStep(step: number): boolean {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!selectedVenue) nextErrors.package = 'Select a booking package or venue.';
      if (!data.service_id) nextErrors.service_id = 'Selected package must be connected to a backend Rental Option.';
      if (!usage) nextErrors.usage = 'Select Whole Day, Half Day, or Additional Hour.';

      if (usage === 'additional_hour' && Number(durationHours || 0) <= 0) {
        nextErrors.duration = 'Enter a valid number of additional hours.';
      }

      if (!data.package_acknowledged) {
        nextErrors.package_acknowledged = 'Confirm that you reviewed the package, rates, and inclusions.';
      }
    }

    if (step === 1) {
      if (!data.type_of_event.trim()) nextErrors.type_of_event = 'Event title/type is required.';
      if (!data.company_name.trim()) nextErrors.company_name = 'Name of organization is required.';
      if (!data.client_name.trim()) nextErrors.client_name = 'Contact person is required.';
      if (!data.client_contact_number.trim()) nextErrors.client_contact_number = 'Contact number is required.';
      if (!/^09\d{9}$/.test(data.client_contact_number.replace(/\D+/g, ''))) {
        nextErrors.client_contact_number = 'Use a valid Philippine mobile number, example: 09171234567.';
      }
      if (!data.client_email.trim()) nextErrors.client_email = 'Email address is required.';
    }

    if (step === 2) {
      if (!data.client_region.trim()) nextErrors.client_region = 'Region is required.';
      if (!data.client_province.trim()) nextErrors.client_province = 'Province is required.';
      if (!data.client_city_municipality.trim()) nextErrors.client_city_municipality = 'City / municipality is required.';
      if (!data.client_street_address.trim()) nextErrors.client_street_address = 'Street address is required.';
    }

    if (step === 3) {
      if (!data.booking_date_from.trim()) nextErrors.booking_date_from = 'Start date/time is required.';
      if (!data.booking_date_to.trim()) nextErrors.booking_date_to = 'End date/time is required.';
      if (!data.number_of_guests.trim()) nextErrors.number_of_guests = 'Number of guests is required.';

      if (Number(data.number_of_guests || 0) < 1) {
        nextErrors.number_of_guests = 'Number of guests must be at least 1.';
      }

      if (data.booking_date_from && data.booking_date_to) {
        const start = Date.parse(data.booking_date_from);
        const end = Date.parse(data.booking_date_to);

        if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
          nextErrors.booking_date_to = 'End date/time must be later than start date/time.';
        }
      }
    }

    if (step === 4) {
      if (!data.policy_acknowledged) {
        nextErrors.policy_acknowledged = 'Confirm that the BCCC guidelines were reviewed.';
      }

      if (!data.accuracy_acknowledged) {
        nextErrors.accuracy_acknowledged = 'Confirm that all encoded information is accurate.';
      }
    }

    setStepErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function validateAllBeforeSubmit(): boolean {
    for (let step = 0; step <= 4; step += 1) {
      if (!validateStep(step)) {
        setActiveStep(step);
        setMaxStep((current) => Math.max(current, step));
        return false;
      }
    }

    return true;
  }

  function runStepTransition(callback: () => void) {
    setStepLoading(true);

    window.setTimeout(() => {
      callback();

      window.setTimeout(() => {
        setStepLoading(false);
      }, 160);
    }, 160);
  }

  function scrollStageToStart() {
    const stage = document.querySelector('.booking-wizard-stage');

    if (stage) {
      stage.scrollTo({
        left: 0,
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  function goToStep(index: number) {
    if (index > maxStep || index === activeStep) return;

    runStepTransition(() => {
      setActiveStep(index);
      setStepErrors({});
      scrollStageToStart();
    });
  }

  function continueStep() {
    if (!validateStep(activeStep)) return;

    const nextStep = Math.min(activeStep + 1, BOOKING_STEPS.length - 1);

    runStepTransition(() => {
      setActiveStep(nextStep);
      setMaxStep((current) => Math.max(current, nextStep));
      setStepErrors({});
      scrollStageToStart();
    });
  }

  function previousStep() {
    if (activeStep === 0) return;

    runStepTransition(() => {
      setActiveStep((current) => Math.max(current - 1, 0));
      setStepErrors({});
      scrollStageToStart();
    });
  }

  function finalSubmit() {
    if (!validateAllBeforeSubmit()) return;

    const finalAddress = combinedAddress(data);

    transform((current) => ({
      ...current,
      client_contact_number: current.client_contact_number.replace(/\D+/g, ''),
      client_address: current.client_address || finalAddress,
      public_calendar_title: current.public_calendar_title || current.type_of_event,
      items: current.service_id
        ? [
            {
              service_id: current.service_id,
              quantity: 1,
            },
          ]
        : [],
      estimated_usage: usage,
      estimated_duration_hours: durationHours,
      estimated_other_rentals: otherRentals,
      estimated_additional_charges: additionalCharges,
      reservation_notes: reservationNotes,
    }));

    if (editing && booking?.id) {
      put(`${bookingBasePath(role)}/${booking.id}`, {
        forceFormData: true,
        preserveScroll: true,
      });

      return;
    }

    const createPath =
      role === 'admin'
        ? '/admin/bookings'
        : role === 'staff'
          ? '/staff/bookings'
          : '/book';

    post(createPath, {
      forceFormData: true,
      preserveScroll: true,
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (activeStep < BOOKING_STEPS.length - 1) {
      continueStep();
      return;
    }

    finalSubmit();
  }

  function StepFooter() {
    const isReview = activeStep === BOOKING_STEPS.length - 1;

    return (
      <footer className="booking-step-footer">
        <button
          type="button"
          onClick={previousStep}
          disabled={activeStep === 0 || processing}
          className="booking-secondary-action"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={backHref} className="booking-ghost-action">
            Cancel
          </Link>

          <button type="submit" disabled={processing || stepLoading} className="booking-primary-action">
            {processing || stepLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : isReview ? (
              <Save className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}

            {isReview ? (editing ? 'Save Booking' : 'Submit Booking') : 'Save & Continue'}
          </button>
        </div>
      </footer>
    );
  }

  function PrefillBanner() {
    if (!hasPublicPrefill) return null;

    return (
      <section className="public-booking-prefill-banner p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[var(--bccc-backend-gold)]">
              Public Availability Selection Applied
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
              Your selected calendar details were pre-filled.
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--bccc-backend-muted)]">
              Review the selected venue, event type, guest count, and schedule before submitting. Final reservation still depends on BCCC assessment and payment compliance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {props.initialVenue ? (
              <span className="booking-prefill-chip is-active">{props.initialVenue}</span>
            ) : null}

            {data.booking_date_from ? (
              <span className="booking-prefill-chip">{formatDateTime(data.booking_date_from)}</span>
            ) : null}

            {data.booking_date_to ? (
              <span className="booking-prefill-chip">{formatDateTime(data.booking_date_to)}</span>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  function SummaryDrawer() {
    return (
      <>
        <button type="button" className="booking-summary-fab" onClick={() => setSummaryOpen(true)}>
          <ReceiptText className="h-4 w-4" />
          Summary
        </button>

        <div className={cx('booking-summary-overlay', summaryOpen && 'is-open')} onClick={() => setSummaryOpen(false)} />

        <aside className={cx('booking-summary-drawer', summaryOpen && 'is-open')}>
          <header className="flex items-start justify-between gap-4 border-b border-[var(--bccc-backend-line)] p-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--bccc-backend-gold)]">
                Live Reservation Summary
              </p>

              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
                {selectedVenue?.displayLabel ?? 'No package selected'}
              </h3>

              <p className="mt-2 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                {BOOKING_USAGE_LABELS[usage]}
                {usage === 'additional_hour' ? ` · ${durationHours || 0} hour(s)` : ''}
              </p>
            </div>

            <button type="button" onClick={() => setSummaryOpen(false)} className="booking-icon-button">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="grid gap-4 p-5">
            <SummaryLine label="Base Charge" value={money(estimatedBase)} />
            <SummaryLine label="Estimated Total" value={money(estimatedTotal)} strong />
            <SummaryLine label="Event" value={data.type_of_event || 'Not encoded yet'} />
            <SummaryLine label="Organizer" value={data.company_name || data.client_name || 'Not encoded yet'} />
            <SummaryLine
              label="Schedule"
              value={`${formatDateTime(data.booking_date_from)} → ${formatDateTime(data.booking_date_to)}`}
            />
            <SummaryLine label="Guests" value={data.number_of_guests || 'Not encoded yet'} />

            <button
              type="button"
              onClick={() => {
                setShowDigitalForm((current) => !current);
                setSummaryOpen(false);
              }}
              className="booking-secondary-action justify-center"
            >
              {showDigitalForm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDigitalForm ? 'Hide Digital Form' : 'View Digital Form'}
            </button>
          </div>
        </aside>
      </>
    );
  }

  function SummaryLine({
    label,
    value,
    strong = false,
  }: {
    label: string;
    value: ReactNode;
    strong?: boolean;
  }) {
    return (
      <div className="booking-summary-line">
        <span>{label}</span>
        <strong className={strong ? 'text-[var(--bccc-backend-gold)]' : ''}>{value}</strong>
      </div>
    );
  }

  function DigitalFormPanel() {
    if (!showDigitalForm) return null;

    return (
      <section className="booking-digital-form">
        <header className="flex flex-col gap-3 border-b border-[var(--bccc-backend-line)] p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[var(--bccc-backend-gold)]">
              Official Preview
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
              Digital Reservation Form
            </h2>
          </div>

          <button type="button" onClick={() => setShowDigitalForm(false)} className="booking-ghost-action">
            Hide
          </button>
        </header>

        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <ReviewGrid
            items={[
              ['Organization', data.company_name],
              ['Event', data.type_of_event],
              ['Contact Person', data.client_name],
              ['Contact Number', data.client_contact_number],
              ['Email', data.client_email],
              ['Address', combinedAddress(data)],
              ['Venue', selectedVenue?.displayLabel],
              ['Schedule', `${formatDateTime(data.booking_date_from)} → ${formatDateTime(data.booking_date_to)}`],
              ['Guests', data.number_of_guests],
              ['Estimated Total', money(estimatedTotal)],
            ]}
          />

          <div className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-5 text-sm leading-7 text-[var(--bccc-backend-muted)]">
            <p className="font-semibold text-[var(--bccc-backend-text)]">
              This preview is for checking only.
            </p>

            <p className="mt-2">
              Final approved charges, reservation status, and payment compliance will be confirmed by the BCCC office after assessment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function renderPackageStep() {
    return (
      <section className="booking-step-panel">
        <div className="booking-step-kicker">
          <Sparkles className="h-4 w-4" />
          Hotel-style package selection
        </div>

        <div className="booking-step-heading">
          <h2>Choose your BCCC event space</h2>
          <p>
            Compare venue area, rate, inclusion, and system readiness in one focused carousel.
          </p>
        </div>

        <WizardNotice errors={stepErrors} />

        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => moveVenue('previous')} className="booking-carousel-arrow">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <button type="button" onClick={() => moveVenue('next')} className="booking-carousel-arrow">
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div ref={packageCarouselRef} className="booking-package-carousel">
          {venueItems.map((item) => (
            <VenueCard
              key={item.key}
              item={item}
              selected={selectedVenueKey === item.key}
              onSelect={() => selectVenue(item)}
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
          <div>
            <p className="booking-mini-heading">Usage Type</p>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {(['whole_day', 'half_day', 'additional_hour'] as BookingUsageKey[]).map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setUsage(option)}
                  className={cx('backend-usage-card', usage === option && 'is-selected')}
                >
                  <span>{BOOKING_USAGE_LABELS[option]}</span>
                  <strong>{selectedVenue ? money(selectedVenue.rates[option]) : '₱0.00'}</strong>
                </button>
              ))}
            </div>

            {usage === 'additional_hour' ? (
              <Field label="Number of Additional Hours" error={fieldError('duration')} required>
                <input
                  value={durationHours}
                  onChange={(event) => setDurationHours(event.target.value)}
                  className={cx('backend-booking-input mt-3', fieldStatusClass(fieldError('duration')))}
                  inputMode="numeric"
                />
              </Field>
            ) : null}
          </div>

          <div className="booking-package-side">
            <Field label="Backend Rental Option" required error={fieldError('service_id')}>
              <select
                value={data.service_id}
                onChange={(event) => {
                  setData('service_id', event.target.value);

                  const matched = venueItems.find(
                    (item) => String(item.service?.id ?? '') === String(event.target.value),
                  );

                  if (matched) {
                    setSelectedVenueKey(matched.key);
                    focusVenueCard(matched.key);
                  }
                }}
                className={cx('backend-booking-input', fieldStatusClass(fieldError('service_id')))}
              >
                <option value="">Select configured option</option>

                {venueItems
                  .filter((item) => item.configured && item.service)
                  .map((item) => (
                    <option key={item.key} value={String(item.service?.id)}>
                      {item.label}
                    </option>
                  ))}
              </select>
            </Field>

            <label className={cx('booking-checkbox-card', fieldError('package_acknowledged') && 'has-error')}>
              <input
                type="checkbox"
                checked={data.package_acknowledged}
                onChange={(event) => setData('package_acknowledged', event.target.checked)}
              />
              <span>
                <strong>Reviewed package and rates.</strong>
                <small>Final charges may still be adjusted after BCCC assessment.</small>
              </span>
            </label>

            {fieldError('package_acknowledged') ? (
              <p className="booking-inline-error">{fieldError('package_acknowledged')}</p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  function renderOrganizerStep() {
    return (
      <section className="booking-step-panel">
        <div className="booking-step-kicker">
          <UserRound className="h-4 w-4" />
          Event and organizer
        </div>

        <div className="booking-step-heading">
          <h2>Tell us who is reserving the venue</h2>
          <p>Use the exact organization and contact details that should appear on official records.</p>
        </div>

        <WizardNotice errors={stepErrors} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Event Title / Type" required error={fieldError('type_of_event')}>
            <input
              value={data.type_of_event}
              onChange={(event) => {
                setData('type_of_event', event.target.value);

                if (!data.public_calendar_title) {
                  setData('public_calendar_title', event.target.value);
                }
              }}
              list="booking-event-types"
              className={cx('backend-booking-input', fieldStatusClass(fieldError('type_of_event')))}
              placeholder="Example: Regional Tourism Summit"
            />

            <datalist id="booking-event-types">
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </Field>

          <Field label="Organization Type" required>
            <select
              value={data.organization_type}
              onChange={(event) => setData('organization_type', event.target.value)}
              className="backend-booking-input"
            >
              {ORGANIZATION_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Name of Organization / Company" required error={fieldError('company_name')}>
            <input
              value={data.company_name}
              onChange={(event) => setData('company_name', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('company_name')))}
              placeholder="Organization name"
            />
          </Field>

          <Field label="Head of Organization">
            <input
              value={data.head_of_organization}
              onChange={(event) => setData('head_of_organization', event.target.value)}
              className="backend-booking-input"
              placeholder="Optional"
            />
          </Field>

          <Field label="Contact Person" required error={fieldError('client_name')}>
            <input
              value={data.client_name}
              onChange={(event) => setData('client_name', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('client_name')))}
              placeholder="Full name"
            />
          </Field>

          <Field label="Contact Number" required error={fieldError('client_contact_number')} helper="Use 09XXXXXXXXX format.">
            <input
              value={data.client_contact_number}
              onChange={(event) => setData('client_contact_number', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('client_contact_number')))}
              placeholder="09171234567"
              inputMode="tel"
            />
          </Field>

          <Field label="Email Address" required error={fieldError('client_email')}>
            <input
              value={data.client_email}
              onChange={(event) => {
                setData('client_email', event.target.value);

                if (!data.survey_email) {
                  setData('survey_email', event.target.value);
                }
              }}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('client_email')))}
              type="email"
              placeholder="name@example.com"
              disabled={isClient && editing}
            />
          </Field>

          <Field label="Public Calendar Title">
            <input
              value={data.public_calendar_title}
              onChange={(event) => setData('public_calendar_title', event.target.value)}
              className="backend-booking-input"
              placeholder="Optional public-facing title"
            />
          </Field>
        </div>
      </section>
    );
  }

  function renderAddressStep() {
    return (
      <section className="booking-step-panel">
        <div className="booking-step-kicker">
          <MapPin className="h-4 w-4" />
          Organizer address
        </div>

        <div className="booking-step-heading">
          <h2>Complete the organizer address</h2>
          <p>This helps the office validate client records and official correspondence.</p>
        </div>

        <WizardNotice errors={stepErrors} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Region" required error={fieldError('client_region')}>
            <input
              value={data.client_region}
              onChange={(event) => setData('client_region', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('client_region')))}
            />
          </Field>

          <Field label="Province" required error={fieldError('client_province')}>
            <input
              value={data.client_province}
              onChange={(event) => setData('client_province', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('client_province')))}
            />
          </Field>

          <Field label="City / Municipality" required error={fieldError('client_city_municipality')}>
            <input
              value={data.client_city_municipality}
              onChange={(event) => setData('client_city_municipality', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('client_city_municipality')))}
            />
          </Field>

          <Field label="Barangay">
            <input
              value={data.client_barangay}
              onChange={(event) => setData('client_barangay', event.target.value)}
              className="backend-booking-input"
            />
          </Field>

          <Field label="ZIP Code">
            <input
              value={data.client_zip_code}
              onChange={(event) => setData('client_zip_code', event.target.value)}
              className="backend-booking-input"
              inputMode="numeric"
            />
          </Field>

          <Field label="Street Address" required error={fieldError('client_street_address')}>
            <input
              value={data.client_street_address}
              onChange={(event) => {
                setData('client_street_address', event.target.value);
                setData('client_address', event.target.value);
              }}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('client_street_address')))}
              placeholder="House / building / street"
            />
          </Field>
        </div>

        <div className="booking-generated-address">
          <p>Generated Full Address</p>
          <strong>{combinedAddress(data) || 'Complete the address fields to generate full address.'}</strong>
        </div>
      </section>
    );
  }

  function renderScheduleStep() {
    return (
      <section className="booking-step-panel">
        <div className="booking-step-kicker">
          <CalendarDays className="h-4 w-4" />
          Schedule and estimated charges
        </div>

        <div className="booking-step-heading">
          <h2>Set the reservation schedule</h2>
          <p>Use the exact event start and end. You may also use quick block buttons for AM, PM, EVE, or whole day.</p>
        </div>

        <WizardNotice errors={stepErrors} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Start Date and Time" required error={fieldError('booking_date_from')}>
            <input
              type="datetime-local"
              value={data.booking_date_from}
              onChange={(event) => setData('booking_date_from', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('booking_date_from')))}
            />
          </Field>

          <Field label="End Date and Time" required error={fieldError('booking_date_to')}>
            <input
              type="datetime-local"
              value={data.booking_date_to}
              onChange={(event) => setData('booking_date_to', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('booking_date_to')))}
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {(['AM', 'PM', 'EVE', 'DAY'] as const).map((block) => (
            <button
              type="button"
              key={block}
              onClick={() => setScheduleBlock(block)}
              className="booking-block-shortcut"
            >
              <ClockLabel block={block} />
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Number of Guests" required error={fieldError('number_of_guests')}>
            <input
              value={data.number_of_guests}
              onChange={(event) => setData('number_of_guests', event.target.value)}
              className={cx('backend-booking-input', fieldStatusClass(fieldError('number_of_guests')))}
              inputMode="numeric"
              placeholder="0"
            />
          </Field>

          <Field label="Other Rentals">
            <input
              value={otherRentals}
              onChange={(event) => setOtherRentals(event.target.value)}
              className="backend-booking-input"
              placeholder="Optional"
            />
          </Field>

          <Field label="Additional Charges">
            <input
              value={additionalCharges}
              onChange={(event) => setAdditionalCharges(event.target.value)}
              className="backend-booking-input"
              inputMode="decimal"
              placeholder="0.00"
            />
          </Field>
        </div>

        <Field label="Reservation Notes">
          <textarea
            value={reservationNotes}
            onChange={(event) => setReservationNotes(event.target.value)}
            className="backend-booking-input min-h-28 py-3"
            placeholder="Optional notes"
          />
        </Field>

        <div className="booking-charge-card">
          <div>
            <p>Estimated Total Charges</p>
            <strong>{money(estimatedTotal)}</strong>
          </div>

          <div>
            <p>Estimated Duration</p>
            <strong>{rangeHours(data.booking_date_from, data.booking_date_to)} hour(s)</strong>
          </div>

          <span>Additional charges may be imposed after assessment at egress.</span>
        </div>
      </section>
    );
  }

  function ClockLabel({ block }: { block: 'AM' | 'PM' | 'EVE' | 'DAY' }) {
    const copy = {
      AM: ['AM', '6:00 AM - 12:00 PM'],
      PM: ['PM', '12:00 PM - 6:00 PM'],
      EVE: ['EVE', '6:00 PM - 11:59 PM'],
      DAY: ['Whole Day', '6:00 AM - 11:59 PM'],
    }[block];

    return (
      <>
        <strong>{copy[0]}</strong>
        <span>{copy[1]}</span>
      </>
    );
  }

  function renderGuidelinesStep() {
    return (
      <section className="booking-step-panel">
        <div className="booking-step-kicker">
          <ShieldCheck className="h-4 w-4" />
          Guidelines and confirmation
        </div>

        <div className="booking-step-heading">
          <h2>Review the rules before submitting</h2>
          <p>These reminders protect your request from delays and clarify payment responsibilities.</p>
        </div>

        <WizardNotice errors={stepErrors} />

        <div className="booking-guideline-grid">
          {BCCC_BOOKING_GENERAL_GUIDELINES.map((section) => (
            <article key={section.title} className="booking-guideline-card">
              <p>Guideline</p>
              <h3>{section.title}</h3>

              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Survey / Reference Email">
            <input
              value={data.survey_email}
              onChange={(event) => setData('survey_email', event.target.value)}
              className="backend-booking-input"
              type="email"
              placeholder="Email used for survey/reference proof"
            />
          </Field>

          <Field label="Survey Proof Image">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setData('survey_proof_image', event.target.files?.[0] ?? null)}
              className="backend-booking-file"
            />
          </Field>
        </div>

        <div className="grid gap-3">
          <label className={cx('booking-checkbox-card', fieldError('policy_acknowledged') && 'has-error')}>
            <input
              type="checkbox"
              checked={data.policy_acknowledged}
              onChange={(event) => setData('policy_acknowledged', event.target.checked)}
            />
            <span>
              <strong>I reviewed the BCCC guidelines.</strong>
              <small>The booking is subject to BCCC review, payment compliance, schedule validation, and house rules.</small>
            </span>
          </label>

          {fieldError('policy_acknowledged') ? (
            <p className="booking-inline-error">{fieldError('policy_acknowledged')}</p>
          ) : null}

          <label className={cx('booking-checkbox-card', fieldError('accuracy_acknowledged') && 'has-error')}>
            <input
              type="checkbox"
              checked={data.accuracy_acknowledged}
              onChange={(event) => setData('accuracy_acknowledged', event.target.checked)}
            />
            <span>
              <strong>I confirm that all information is accurate.</strong>
              <small>Incorrect details may delay assessment and approval.</small>
            </span>
          </label>

          {fieldError('accuracy_acknowledged') ? (
            <p className="booking-inline-error">{fieldError('accuracy_acknowledged')}</p>
          ) : null}
        </div>

        {isStaffLike ? (
          <div className="grid gap-4 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-5 lg:grid-cols-2">
            <Field label="Booking Status">
              <select
                value={data.booking_status}
                onChange={(event) => setData('booking_status', event.target.value)}
                className="backend-booking-input"
                disabled={isManager}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="declined">Declined</option>
              </select>
            </Field>

            <Field label="Payment Status">
              <select
                value={data.payment_status}
                onChange={(event) => setData('payment_status', event.target.value)}
                className="backend-booking-input"
                disabled={isManager}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="owing">Owing</option>
              </select>
            </Field>
          </div>
        ) : null}
      </section>
    );
  }

  function renderReviewStep() {
    return (
      <section className="booking-step-panel">
        <div className="booking-step-kicker">
          <CheckCircle2 className="h-4 w-4" />
          Final review
        </div>

        <div className="booking-step-heading">
          <h2>Check everything before submitting</h2>
          <p>Use the edit buttons if something needs correction. This is the last screen before submission.</p>
        </div>

        <ServerErrorsBanner errors={errors as Record<string, string>} />

        <div className="grid gap-5">
          <ReviewBlock title="Package and Venue" icon={PackageCheck} onEdit={() => goToStep(0)}>
            <ReviewGrid
              items={[
                ['Selected Venue', selectedVenue?.displayLabel],
                ['Rental Option ID', data.service_id],
                ['Usage', BOOKING_USAGE_LABELS[usage]],
                ['Estimated Base', money(estimatedBase)],
                ['Estimated Total', money(estimatedTotal)],
              ]}
            />
          </ReviewBlock>

          <ReviewBlock title="Organizer" icon={UserRound} onEdit={() => goToStep(1)}>
            <ReviewGrid
              items={[
                ['Event', data.type_of_event],
                ['Organization', data.company_name],
                ['Head', data.head_of_organization],
                ['Contact', data.client_name],
                ['Mobile', data.client_contact_number],
                ['Email', data.client_email],
              ]}
            />
          </ReviewBlock>

          <ReviewBlock title="Address" icon={MapPin} onEdit={() => goToStep(2)}>
            <ReviewGrid
              items={[
                ['Region', data.client_region],
                ['Province', data.client_province],
                ['City / Municipality', data.client_city_municipality],
                ['Barangay', data.client_barangay],
                ['ZIP', data.client_zip_code],
                ['Full Address', combinedAddress(data)],
              ]}
            />
          </ReviewBlock>

          <ReviewBlock title="Schedule and Guests" icon={CalendarDays} onEdit={() => goToStep(3)}>
            <ReviewGrid
              items={[
                ['Start', formatDateTime(data.booking_date_from)],
                ['End', formatDateTime(data.booking_date_to)],
                ['Duration', `${rangeHours(data.booking_date_from, data.booking_date_to)} hour(s)`],
                ['Guests', data.number_of_guests],
                ['Other Rentals', otherRentals],
                ['Notes', reservationNotes],
              ]}
            />
          </ReviewBlock>

          <ReviewBlock title="Guidelines and Status" icon={ShieldCheck} onEdit={() => goToStep(4)}>
            <ReviewGrid
              items={[
                ['Survey Email', data.survey_email],
                ['Proof Image', data.survey_proof_image?.name || 'No new file selected'],
                ['Booking Status', data.booking_status],
                ['Payment Status', data.payment_status],
                ['Public Calendar Title', data.public_calendar_title],
              ]}
            />
          </ReviewBlock>
        </div>
      </section>
    );
  }

  function renderActiveStep() {
    if (activeStep === 0) return renderPackageStep();
    if (activeStep === 1) return renderOrganizerStep();
    if (activeStep === 2) return renderAddressStep();
    if (activeStep === 3) return renderScheduleStep();
    if (activeStep === 4) return renderGuidelinesStep();

    return renderReviewStep();
  }

  return (
    <BookingRolePageShell
      role={role}
      title={formTitle(role, editing)}
      description={formDescription(role)}
      actions={
        <>
          <Link href={backHref} className="booking-ghost-action">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <button
            type="button"
            onClick={() => setShowDigitalForm((current) => !current)}
            className="booking-secondary-action"
          >
            {showDigitalForm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDigitalForm ? 'Hide Form' : 'View Form'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="booking-lux-form">
        <PrefillBanner />

        <Stepper activeStep={activeStep} maxStep={maxStep} onStepClick={goToStep} />

        <DigitalFormPanel />

        <div className={cx('booking-wizard-stage', stepLoading && 'is-loading')}>
          {stepLoading ? (
            <div className="booking-step-loader">
              <LoaderCircle className="h-8 w-8 animate-spin" />
              <p>Preparing next page...</p>
            </div>
          ) : null}

          {renderActiveStep()}
        </div>

        <StepFooter />
      </form>

      <SummaryDrawer />
    </BookingRolePageShell>
  );
}
