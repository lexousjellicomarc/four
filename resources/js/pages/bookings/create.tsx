import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Service } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CalendarDays, CheckCircle2, Info, Save, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import BookingViewSwitch from '@/components/bookings/view-switch';
import qrFallback from '@/components/logo/qr.png';
import { cn } from '@/lib/utils';
import { BLOCK_KEYS, BLOCK_META, resolveBlockAvailable } from '@/lib/unified-schedule';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Create', href: '/bookings/create' },
];

interface ServiceTypeWithServices {
  id: number;
  name: string;
  services: Service[];
}

interface CreateBookingProps {
  serviceTypes: ServiceTypeWithServices[];
  unavailableDates?: string[];
  initialSchedule?: {
    date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
  initialVenue?: string | null;
  initialEventType?: string | null;
  initialGuests?: number | null;
}

type RoleLike = string | { name?: string | null } | null | undefined;
type BlockKey = 'AM' | 'PM' | 'EVE';

type CartItem = {
  service_id: number;
  name: string;
  area: string;
  price: number;
  quantity: number;
  min_guests?: number | null;
  max_guests?: number | null;
  capacity_note?: string | null;
};

type AvailabilityBlock = {
  key?: string;
  label?: string;
  is_available?: boolean;
  available?: boolean;
};

type DailyAvailability = {
  date: string;
  venue?: string | null;
  blocks?: Record<string, AvailabilityBlock> | AvailabilityBlock[];
  is_fully_booked?: boolean;
};

type FormShape = {
  service_id: number | null;
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
  number_of_guests: string;
  booking_status: string;
  is_public_calendar_visible: boolean;
  public_calendar_title: string;
};

type LocalFieldErrors = Partial<Record<keyof FormShape | 'booking_date' | 'selected_blocks' | 'items' | 'survey', string>>;
type SectionKey = 'client' | 'schedule' | 'services' | 'survey';

type BookingDraftPayload = {
  version: number;
  saved_at: string;
  survey_proof_name: string;
  form: Omit<FormShape, 'survey_proof_image'>;
  bookingDate: string;
  selectedBlocks: BlockKey[];
  selectedVenue: string;
  search: string;
  cart: CartItem[];
  extraDates: string[];
};

const BOOKING_DRAFT_VERSION = 2;

const EVENT_TYPE_OPTIONS = [
  'Convention',
  'Conference',
  'Seminar',
  'Workshop',
  'Training',
  'Meeting',
  'Exhibit',
  'Expo',
  'Product Launch',
  'Cultural Program',
  'Government Event',
  'Community Event',
  'Private Event',
  'Others',
] as const;

const DEFAULT_COMPANY_OPTIONS = [
  'Baguio City Government',
  'Baguio Country Club',
  'Baguio Water District',
  'Benguet Electric Cooperative',
  'Benguet State University',
  'Department of Education - Baguio',
  'Department of Tourism - CAR',
  'John Hay Management Corporation',
  'Saint Louis University',
  'University of the Cordilleras',
  'University of Baguio',
  'Others',
] as const;

const GUEST_OPTIONS = [
  { label: 'Less than 50 pax', value: '49' },
  { label: '50 to 100 pax', value: '100' },
  { label: '101 to 200 pax', value: '200' },
  { label: '201 to 500 pax', value: '500' },
  { label: '501 to 1000 pax', value: '1000' },
  { label: '1001 to 1500 pax', value: '1500' },
  { label: '1501 to 2000 pax', value: '2000' },
  { label: 'Custom number', value: 'custom' },
] as const;

function getRoleNames(auth: any): string[] {
  const raw: RoleLike[] = auth?.roles ?? auth?.user?.roles ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((role) => (typeof role === 'string' ? role : role?.name))
    .filter(Boolean)
    .map((name) => String(name).toLowerCase());
}


function cleanPhoneInput(value: string) {
  return value.replace(/\D+/g, '').slice(0, 11);
}

function isWholeDayServiceName(name: string) {
  const v = name.toLowerCase();
  return v.includes('whole day') || v.includes('whole-day') || v.includes('whole venue') || v.includes('whole hall') || v.includes('full day');
}

function isHalfDayServiceName(name: string) {
  const v = name.toLowerCase();
  return v.includes('half day') || v.includes('half-day');
}

function isAdditionalHourServiceName(name: string) {
  return name.toLowerCase().includes('additional hour');
}


function sameServiceTypeLabel(value?: string | null) {
  return String(value ?? '').trim().toLowerCase();
}

function daySpanFromSelections(primaryDate: string, extraDates: string[]) {
  const valid = [primaryDate, ...extraDates].filter(Boolean);
  return Math.max(new Set(valid).size, 1);
}

function isPopularService(service: Service, typeName: string) {
  const value = `${service.name} ${typeName}`.toLowerCase();
  return value.includes('main hall') || value.includes('full hall') || value.includes('foyer') || value.includes('vip lounge');
}

function serviceBehaviorBadges(service: Service, typeName: string) {
  const serviceName = String(service.name ?? '');
  const badges: string[] = [];

  if (isPopularService(service, typeName)) badges.push('Popular');
  if (isWholeDayServiceName(serviceName)) badges.push('Whole Day');
  if (isHalfDayServiceName(serviceName)) badges.push('Half Day');
  if (isAdditionalHourServiceName(serviceName)) badges.push('Additional Hour');

  return badges;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseInitialBlocks(initial?: CreateBookingProps['initialSchedule']): BlockKey[] {
  const start = String(initial?.start_time ?? '').slice(0, 5);
  const end = String(initial?.end_time ?? '').slice(0, 5);

  if (start === '06:00' && end === '12:00') return ['AM'];
  if (start === '12:00' && end === '18:00') return ['PM'];
  if (start === '18:00' && (end === '23:59' || end === '00:00')) return ['EVE'];
  if (start === '06:00' && end === '18:00') return ['AM', 'PM'];
  if (start === '12:00' && (end === '23:59' || end === '00:00')) return ['PM', 'EVE'];
  if (start === '06:00' && (end === '23:59' || end === '00:00')) return ['AM', 'PM', 'EVE'];

  return [];
}

function sortBlocks(blocks: BlockKey[]) {
  const order: BlockKey[] = ['AM', 'PM', 'EVE'];
  return order.filter((item) => blocks.includes(item));
}

function toggleBlock(prev: BlockKey[], key: BlockKey) {
  const exists = prev.includes(key);
  let next = exists ? prev.filter((item) => item !== key) : [...prev, key];
  next = sortBlocks(Array.from(new Set(next)));

  const hasAM = next.includes('AM');
  const hasPM = next.includes('PM');
  const hasEVE = next.includes('EVE');

  if (hasAM && hasEVE && !hasPM) {
    next = exists ? ['AM'] : ['AM', 'PM', 'EVE'];
  }

  return sortBlocks(next);
}

function computeDateRange(date: string, blocks: BlockKey[]) {
  if (!date || blocks.length === 0) return null;

  const hasAM = blocks.includes('AM');
  const hasPM = blocks.includes('PM');
  const hasEVE = blocks.includes('EVE');

  const start = hasAM ? '06:00' : hasPM ? '12:00' : '18:00';
  const end = hasEVE ? '23:59' : hasPM ? '18:00' : '12:00';

  return {
    from: `${date}T${start}`,
    to: `${date}T${end}`,
  };
}

function availabilityCacheKey(date: string, venue?: string | null) {
  return `${date}::${String(venue ?? '').trim().toLowerCase()}`;
}

function normalizeAreaKey(value?: string | null) {
  const raw = String(value ?? '').trim().toLowerCase();
  const compact = raw.replace(/[^a-z0-9]+/g, '');

  const map: Record<string, string> = {
    fullhall: 'full_hall',
    fullvenue: 'full_hall',
    wholehall: 'full_hall',
    mainhall: 'main_hall',
    foyerlobbyarea: 'foyer_lobby',
    foyerandlobbyarea: 'foyer_lobby',
    foyerlobby: 'foyer_lobby',
    foyer: 'foyer_lobby',
    lobby: 'foyer_lobby',
    lobbyarea: 'foyer_lobby',
    viplounge: 'vip_lounge',
    boardroom: 'board_room',
    basement: 'basement',
    gallery2600: 'gallery2600',
    gallery: 'gallery2600',
    wholevenue: 'whole_venue',
    allareas: 'whole_venue',
    allspaces: 'whole_venue',
    groundsparkingarea: 'whole_venue',
    lobbyfoyer: 'foyer_lobby',
  };

  return map[compact] ?? compact;
}

function areaLabelsOverlap(a?: string | null, b?: string | null) {
  const ak = normalizeAreaKey(a);
  const bk = normalizeAreaKey(b);

  if (!ak || !bk) return false;
  if (ak === bk) return true;

  const matrix: Record<string, string[]> = {
    whole_venue: ['whole_venue', 'full_hall', 'main_hall', 'foyer_lobby', 'vip_lounge', 'board_room', 'basement', 'gallery2600'],
    full_hall: ['whole_venue', 'full_hall', 'main_hall', 'foyer_lobby', 'vip_lounge', 'board_room', 'basement', 'gallery2600'],
    main_hall: ['whole_venue', 'full_hall', 'main_hall'],
    foyer_lobby: ['whole_venue', 'full_hall', 'foyer_lobby'],
    vip_lounge: ['whole_venue', 'full_hall', 'vip_lounge'],
    board_room: ['whole_venue', 'full_hall', 'board_room'],
    basement: ['whole_venue', 'full_hall', 'basement'],
    gallery2600: ['whole_venue', 'full_hall', 'gallery2600'],
  };

  return (matrix[ak] ?? []).includes(bk) || (matrix[bk] ?? []).includes(ak);
}

function isAreaCartItem(item: Pick<CartItem, 'area' | 'name'>) {
  return String(item.area ?? '').trim().toLowerCase() === 'area'
    || ['whole_venue', 'full_hall', 'main_hall', 'foyer_lobby', 'vip_lounge', 'board_room', 'basement', 'gallery2600'].includes(normalizeAreaKey(item.name));
}

function formatMoney(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getCapacityLabel(service: Service) {
  const min = service.min_guests ?? null;
  const max = service.max_guests ?? null;

  if (min !== null && max !== null) return `${min}-${max} guests`;
  if (min !== null) return `Min ${min} guests`;
  if (max !== null) return `Max ${max} guests`;
  return null;
}

function getCapacityError(service: Pick<Service, 'name' | 'min_guests' | 'max_guests' | 'capacity_note'>, guests: number) {
  if (guests <= 0) return null;

  const min = service.min_guests ?? null;
  const max = service.max_guests ?? null;
  const note = service.capacity_note ? ` ${service.capacity_note}` : '';

  if (min !== null && guests < min) {
    return `${service.name} requires at least ${min} guests.${note}`;
  }

  if (max !== null && guests > max) {
    return `${service.name} allows a maximum of ${max} guests.${note}`;
  }

  return null;
}

function isBlockAvailable(availability: DailyAvailability | null | undefined, key: BlockKey) {
  return resolveBlockAvailable(availability?.blocks, key);
}

function normalizeAssetUrl(url: string) {
  const value = String(url || '').trim();
  if (!value) return value;
  if (/^(https?:\/\/|data:|blob:|\/)/i.test(value)) return value;
  return `/${value}`;
}

function fieldClass(hasError: boolean, extra?: string) {
  return cn(
    hasError && 'border-red-500 ring-2 ring-red-200/70 focus-visible:ring-red-200 dark:border-red-500 dark:ring-red-900/40',
    extra,
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-red-600 dark:text-red-400">{message}</p>;
}

function buildDraftKey(seed?: string | null) {
  const normalized = String(seed ?? '').trim().toLowerCase() || 'guest';
  return `bccc-ease:booking-create-draft:${normalized}`;
}

function hasMeaningfulDraftContent(payload: BookingDraftPayload) {
  return Boolean(
    payload.form.client_name.trim() ||
      payload.form.company_name.trim() ||
      payload.form.client_contact_number.trim() ||
      payload.form.client_email.trim() ||
      payload.form.type_of_event.trim() ||
      payload.form.client_address.trim() ||
      payload.form.head_of_organization.trim() ||
      payload.form.number_of_guests.trim() ||
      payload.bookingDate.trim() ||
      payload.selectedBlocks.length > 0 ||
      payload.selectedVenue.trim() ||
      payload.search.trim() ||
      payload.cart.length > 0 ||
      payload.extraDates.length > 0 ||
      payload.form.survey_email.trim() ||
      payload.form.public_calendar_title.trim() ||
      payload.form.is_public_calendar_visible ||
      payload.survey_proof_name.trim(),
  );
}

function formatDraftSavedAt(value?: string | null) {
  if (!value) return 'No draft saved yet.';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Draft saved.';
  return `Last autosaved ${d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function firstTruthyError(errors: LocalFieldErrors) {
  const order: Array<keyof LocalFieldErrors> = [
    'client_name',
    'company_name',
    'client_contact_number',
    'client_email',
    'head_of_organization',
    'type_of_event',
    'client_address',
    'number_of_guests',
    'booking_status',
    'booking_date',
    'selected_blocks',
    'items',
    'survey_email',
    'survey_proof_image',
    'survey',
  ];

  return order.find((key) => Boolean(errors[key]));
}

function sectionForField(field?: keyof LocalFieldErrors): SectionKey {
  switch (field) {
    case 'client_name':
    case 'company_name':
    case 'client_contact_number':
    case 'client_email':
    case 'head_of_organization':
    case 'type_of_event':
    case 'client_address':
    case 'number_of_guests':
    case 'booking_status':
      return 'client';
    case 'booking_date':
    case 'selected_blocks':
      return 'schedule';
    case 'items':
      return 'services';
    case 'survey_email':
    case 'survey_proof_image':
    case 'survey':
    default:
      return 'survey';
  }
}

export default function CreateBooking({
  serviceTypes,
  initialSchedule,
  initialVenue,
  initialEventType,
  initialGuests,
}: CreateBookingProps) {
  const page = usePage<any>();
  const auth = page.props.auth ?? {};
  const survey = page.props.survey ?? {};

  const roles = useMemo(() => getRoleNames(auth), [auth]);
  const isClient = roles.includes('user');
  const canAccessBackendDesign = Boolean(auth?.user);
  const backendDesignHref = roles.some((role) => ['admin', 'manager', 'staff'].includes(role))
    ? '/admin/dashboard'
    : '/dashboard';

  const authEmail = String(auth?.user?.email ?? auth?.email ?? '').trim();

  const { data, setData, post, processing, errors, transform } = useForm<FormShape>({
    service_id: null,
    company_name: '',
    client_name: '',
    client_contact_number: '',
    client_email: isClient && authEmail ? authEmail : '',
    survey_email: '',
    survey_proof_image: null,
    client_address: '',
    head_of_organization: '',
    type_of_event: initialEventType ? String(initialEventType) : '',
    booking_date_from: '',
    booking_date_to: '',
    number_of_guests: initialGuests ? String(initialGuests) : '',
    booking_status: 'pending',
    is_public_calendar_visible: false,
    public_calendar_title: '',
  });

  const [bookingDate, setBookingDate] = useState<string>(initialSchedule?.date ?? '');
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [extraDateInput, setExtraDateInput] = useState('');
  const [selectedBlocks, setSelectedBlocks] = useState<BlockKey[]>(() => parseInitialBlocks(initialSchedule));
  const [selectedVenue, setSelectedVenue] = useState<string>(initialVenue ? String(initialVenue) : '');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, DailyAvailability>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [guestPreset, setGuestPreset] = useState<string>(() => (initialGuests ? String(initialGuests) : 'custom'));
  const [companyPreset, setCompanyPreset] = useState<string>('');
  const [eventTypePreset, setEventTypePreset] = useState<string>(() => (initialEventType ? String(initialEventType) : ''));
  const [qrStage, setQrStage] = useState<'remote' | 'fallback' | 'none'>(survey?.qr_image_url ? 'remote' : 'fallback');
  const [localErrors, setLocalErrors] = useState<LocalFieldErrors>({});

  const draftKey = useMemo(() => buildDraftKey(authEmail || data.client_email || auth?.user?.id), [authEmail, data.client_email, auth?.user?.id]);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestoreCandidate, setDraftRestoreCandidate] = useState<BookingDraftPayload | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftGateResolved, setDraftGateResolved] = useState(false);
  const draftTimerRef = useRef<number | null>(null);

  const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    client: null,
    schedule: null,
    services: null,
    survey: null,
  });

  const venueOptions = useMemo(() => {
    const seen = new Set<string>();

    return serviceTypes
      .flatMap((type) =>
        (type.services ?? [])
          .filter((service) => String(service.service_type ?? type.name).trim().toLowerCase() === 'area')
          .map((service) => ({ label: service.name, value: service.name })),
      )
      .filter((item) => {
        const key = normalizeAreaKey(item.value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [serviceTypes]);

  const guestCount = useMemo(() => {
    const parsed = Number(data.number_of_guests || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [data.number_of_guests]);


  const multiBlockSelection = selectedBlocks.length >= 2;

  function serviceDisabledReason(service: Service, serviceTypeName: string) {
    const serviceName = String(service.name ?? '');
    const normalizedType = sameServiceTypeLabel(service.service_type ?? serviceTypeName);
    const capacityError = getCapacityError(service, guestCount);
    if (capacityError) return capacityError;

    if (multiBlockSelection && isHalfDayServiceName(serviceName)) {
      return 'Half-day options are disabled when two or more time blocks are selected.';
    }

    if (!multiBlockSelection && isWholeDayServiceName(serviceName)) {
      return 'Whole-day options become available once two or more time blocks are selected.';
    }

    if (isAdditionalHourServiceName(serviceName)) {
      const hasBaseSameType = cart.some((item) => !isAdditionalHourServiceName(item.name) && sameServiceTypeLabel(item.area) === normalizedType);
      if (!hasBaseSameType) {
        return 'Select a base service from the same service type before adding additional hours.';
      }
    }

    if (cart.some((item) => item.service_id === service.id) && !isAdditionalHourServiceName(serviceName)) {
      return 'Already selected.';
    }

    return '';
  }

  const filteredServiceTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedIds = new Set(cart.map((item) => item.service_id));

    return serviceTypes
      .map((type) => ({
        ...type,
        services: (type.services ?? []).filter((service) => {
          if (selectedIds.has(service.id)) return false;
          if (!query) return true;

          const haystack = `${service.name} ${service.description} ${type.name}`.toLowerCase();
          return haystack.includes(query);
        }),
      }))
      .filter((type) => type.services.length > 0);
  }, [serviceTypes, search, cart]);

  const totalAmount = useMemo(() => {
    const base = cart.reduce((sum, item) => sum + (Number(item.price) * Math.max(1, Number(item.quantity || 1))), 0);
    return base * daySpanFromSelections(bookingDate, extraDates);
  }, [cart, bookingDate, extraDates]);

  useEffect(() => {
    if (cart.length === 0) return;

    const removed: string[] = [];
    const kept = cart.filter((item) => {
      const capacityProblem = getCapacityError({
        name: item.name,
        min_guests: item.min_guests ?? null,
        max_guests: item.max_guests ?? null,
        capacity_note: item.capacity_note ?? null,
      }, guestCount);

      if (capacityProblem) {
        removed.push(item.name);
        return false;
      }

      if (multiBlockSelection && isHalfDayServiceName(item.name)) {
        removed.push(item.name);
        return false;
      }

      if (!multiBlockSelection && isWholeDayServiceName(item.name)) {
        removed.push(item.name);
        return false;
      }

      if (isAdditionalHourServiceName(item.name)) {
        const hasBaseSameType = cart.some((other) =>
          other.service_id !== item.service_id &&
          !isAdditionalHourServiceName(other.name) &&
          sameServiceTypeLabel(other.area) === sameServiceTypeLabel(item.area),
        );

        if (!hasBaseSameType) {
          removed.push(item.name);
          return false;
        }
      }

      return true;
    });

    if (removed.length > 0 && kept.length !== cart.length) {
      setCart(kept);
      setCapacityError(`Some selected services were removed because they no longer match the guest count or selected block combination: ${Array.from(new Set(removed)).join(', ')}.`);
    }
  }, [cart, guestCount, multiBlockSelection]);

  const hasAreaServiceSelected = useMemo(() => cart.some((item) => isAreaCartItem(item)), [cart]);

  const selectedVenueMatchesCart = useMemo(() => {
    if (!selectedVenue) return true;
    return cart.some((item) => isAreaCartItem(item) && areaLabelsOverlap(item.name, selectedVenue));
  }, [cart, selectedVenue]);

  const surveyQrUrl = survey?.qr_image_url ? normalizeAssetUrl(String(survey.qr_image_url)) : null;
  const qrSrc = qrStage === 'remote' ? surveyQrUrl : qrStage === 'fallback' ? qrFallback : null;

  const currentAvailability = bookingDate
    ? availabilityCache[availabilityCacheKey(bookingDate, selectedVenue)] ?? null
    : null;

  function setSectionRef(section: SectionKey) {
    return (element: HTMLDivElement | null) => {
      sectionRefs.current[section] = element;
    };
  }

  function scrollToSection(section: SectionKey) {
    const target = sectionRefs.current[section];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function markDraftInteractive() {
    if (!draftGateResolved) {
      setDraftGateResolved(true);
      setDraftRestoreCandidate(null);
    }
  }

  function clearLocalError(field: keyof LocalFieldErrors) {
    setLocalErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function updateField<K extends keyof FormShape>(field: K, value: FormShape[K]) {
    setData(field, value);
    clearLocalError(field);
    markDraftInteractive();
  }

  function buildDraftPayload(): BookingDraftPayload {
    return {
      version: BOOKING_DRAFT_VERSION,
      saved_at: new Date().toISOString(),
      survey_proof_name: data.survey_proof_image?.name ?? '',
      form: {
        service_id: data.service_id,
        company_name: data.company_name,
        client_name: data.client_name,
        client_contact_number: data.client_contact_number,
        client_email: data.client_email,
        survey_email: data.survey_email,
        client_address: data.client_address,
        head_of_organization: data.head_of_organization,
        type_of_event: data.type_of_event,
        booking_date_from: data.booking_date_from,
        booking_date_to: data.booking_date_to,
        number_of_guests: data.number_of_guests,
        booking_status: data.booking_status,
        is_public_calendar_visible: data.is_public_calendar_visible,
        public_calendar_title: data.public_calendar_title,
      },
      bookingDate,
      selectedBlocks,
      selectedVenue,
      search,
      cart,
      extraDates,
    };
  }

  function clearDraftStorage() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(draftKey);
    setDraftSavedAt(null);
    setDraftRestoreCandidate(null);
  }

  function restoreDraft(payload: BookingDraftPayload) {
    setData((current) => ({
      ...current,
      ...payload.form,
      survey_proof_image: null,
    }));
    setBookingDate(payload.bookingDate || '');
    setSelectedBlocks(
      Array.isArray(payload.selectedBlocks)
        ? payload.selectedBlocks.filter((block): block is BlockKey => ['AM', 'PM', 'EVE'].includes(block))
        : [],
    );
    setSelectedVenue(payload.selectedVenue || '');
    setSearch(payload.search || '');
    setCart(Array.isArray(payload.cart) ? payload.cart : []);
    setExtraDates(Array.isArray(payload.extraDates) ? payload.extraDates.filter(Boolean) : []);
    setCompanyPreset(DEFAULT_COMPANY_OPTIONS.includes((payload.form.company_name || '') as any) ? payload.form.company_name : (payload.form.company_name ? 'Others' : ''));
    setEventTypePreset(EVENT_TYPE_OPTIONS.includes((payload.form.type_of_event || '') as any) ? payload.form.type_of_event : (payload.form.type_of_event ? 'Others' : ''));
    setGuestPreset(
      payload.form.number_of_guests && GUEST_OPTIONS.some((option) => option.value === payload.form.number_of_guests)
        ? payload.form.number_of_guests
        : 'custom',
    );
    setPreviewUrl(null);
    setLocalErrors({});
    setScheduleError(null);
    setCapacityError(null);
    setDraftRestoreCandidate(null);
    setDraftSavedAt(payload.saved_at || new Date().toISOString());
    setDraftGateResolved(true);
  }

  useEffect(() => {
    if (guestPreset !== 'custom') {
      updateField('number_of_guests', guestPreset as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestPreset]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) {
        setDraftReady(true);
        setDraftGateResolved(true);
        return;
      }

      const parsed = JSON.parse(raw) as BookingDraftPayload;
      if (!parsed || parsed.version !== BOOKING_DRAFT_VERSION || !hasMeaningfulDraftContent(parsed)) {
        window.localStorage.removeItem(draftKey);
        setDraftReady(true);
        setDraftGateResolved(true);
        return;
      }

      setDraftRestoreCandidate(parsed);
      setDraftSavedAt(parsed.saved_at ?? null);
      setDraftReady(true);
    } catch {
      setDraftReady(true);
      setDraftGateResolved(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady || !draftGateResolved) return;
    if (typeof window === 'undefined') return;

    if (draftTimerRef.current) {
      window.clearTimeout(draftTimerRef.current);
    }

    draftTimerRef.current = window.setTimeout(() => {
      const payload = buildDraftPayload();
      if (!hasMeaningfulDraftContent(payload)) {
        window.localStorage.removeItem(draftKey);
        setDraftSavedAt(null);
        return;
      }

      window.localStorage.setItem(draftKey, JSON.stringify(payload));
      setDraftSavedAt(payload.saved_at);
    }, 700);

    return () => {
      if (draftTimerRef.current) {
        window.clearTimeout(draftTimerRef.current);
      }
    };
  }, [
    draftReady,
    draftGateResolved,
    draftKey,
    data.company_name,
    data.client_name,
    data.client_contact_number,
    data.client_email,
    data.survey_email,
    data.client_address,
    data.head_of_organization,
    data.type_of_event,
    data.number_of_guests,
    data.booking_status,
    bookingDate,
    selectedBlocks,
    selectedVenue,
    search,
    cart,
    data.survey_proof_image,
  ]);

  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;

    const mergedErrors: LocalFieldErrors = {
      client_name: errors.client_name,
      company_name: errors.company_name,
      client_contact_number: errors.client_contact_number,
      client_email: errors.client_email,
      head_of_organization: errors.head_of_organization,
      type_of_event: errors.type_of_event,
      client_address: errors.client_address,
      number_of_guests: errors.number_of_guests,
      booking_status: errors.booking_status,
      booking_date: errors.booking_date_from || errors.booking_date_to,
      items: errors.items as string | undefined,
      survey_email: errors.survey_email,
      survey_proof_image: errors.survey_proof_image,
    };

    const firstField = firstTruthyError(mergedErrors);
    if (!firstField) return;

    const section = sectionForField(firstField);
    window.requestAnimationFrame(() => {
      scrollToSection(section);
    });
  }, [errors]);

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
    if (cart.length === 0) {
      setCapacityError(null);
      return;
    }

    const firstError =
      cart
        .map((item) =>
          getCapacityError(
            {
              name: item.name,
              min_guests: item.min_guests ?? null,
              max_guests: item.max_guests ?? null,
              capacity_note: item.capacity_note ?? null,
            },
            guestCount,
          ),
        )
        .find(Boolean) ?? null;

    setCapacityError(firstError);
  }, [cart, guestCount]);

  useEffect(() => {
    setScheduleError(null);

    if (!bookingDate || selectedBlocks.length === 0) {
      setData('booking_date_from', '');
      setData('booking_date_to', '');
      return;
    }

    const badBlocks = selectedBlocks.filter((block) => !isBlockAvailable(currentAvailability, block));
    if (badBlocks.length > 0) {
      setScheduleError(`The selected block is not available: ${badBlocks.join(', ')}.`);
      setData('booking_date_from', '');
      setData('booking_date_to', '');
      return;
    }

    const range = computeDateRange(bookingDate, selectedBlocks);
    if (!range) return;

    setData('booking_date_from', range.from);
    setData('booking_date_to', range.to);
  }, [bookingDate, selectedBlocks, currentAvailability, setData]);

  useEffect(() => {
    if (!bookingDate) return;

    const key = availabilityCacheKey(bookingDate, selectedVenue);
    if (availabilityCache[key]) return;

    let alive = true;

    async function run() {
      setLoadingAvailability(true);
      try {
        const params = new URLSearchParams({ date: bookingDate });
        if (selectedVenue) params.set('venue', selectedVenue);

        const response = await fetch(`/bookings/availability?${params.toString()}`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Unable to load availability');
        }

        const payload = (await response.json()) as DailyAvailability;
        if (!alive) return;

        setAvailabilityCache((prev) => ({ ...prev, [key]: payload }));
      } catch {
        if (!alive) return;
        setAvailabilityCache((prev) => ({
          ...prev,
          [key]: { date: bookingDate, venue: selectedVenue || null },
        }));
      } finally {
        if (alive) setLoadingAvailability(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [bookingDate, selectedVenue, availabilityCache]);

  function updateCartQuantity(serviceId: number, quantity: number) {
    markDraftInteractive();
    setCart((prev) => prev.map((item) => item.service_id === serviceId ? { ...item, quantity: Math.max(1, Math.min(24, quantity)) } : item));
  }

  function addService(service: Service, serviceTypeName: string) {
    if (cart.some((item) => item.service_id === service.id)) {
      return;
    }

    const disabledReason = serviceDisabledReason(service, serviceTypeName);
    if (disabledReason && disabledReason !== 'Already selected.') {
      setCapacityError(disabledReason);
      return;
    }

    markDraftInteractive();

    setCart((prev) => [
      ...prev,
      {
        service_id: service.id,
        name: service.name,
        area: service.service_type ?? serviceTypeName,
        price: Number(service.price),
        quantity: 1,
        min_guests: service.min_guests ?? null,
        max_guests: service.max_guests ?? null,
        capacity_note: service.capacity_note ?? null,
      },
    ]);

    if (!selectedVenue && String(service.service_type ?? serviceTypeName).trim().toLowerCase() === 'area') {
      setSelectedVenue(service.name);
    }

    clearLocalError('items');
  }

  function removeService(serviceId: number) {
    markDraftInteractive();
    setCart((prev) => prev.filter((item) => item.service_id !== serviceId));
  }

  function validateBeforeSubmit() {
    const nextErrors: LocalFieldErrors = {};

    if (!data.client_name.trim()) nextErrors.client_name = 'Please enter the client name.';
    if (!/^09\d{9}$/.test(data.client_contact_number.trim())) nextErrors.client_contact_number = 'Contact number must start with 09 and contain exactly 11 digits.';
    if (!data.client_email.trim()) nextErrors.client_email = 'Please enter the client email.';
    if (!data.type_of_event.trim()) nextErrors.type_of_event = 'Please enter the type of event.';
    if (!data.client_address.trim()) nextErrors.client_address = 'Please enter the client address.';
    if (!data.number_of_guests.trim() || Number(data.number_of_guests) <= 0 || Number(data.number_of_guests) > 2000) {
      nextErrors.number_of_guests = 'Please enter a valid number of guests from 1 to 2000.';
    }

    if (!bookingDate) {
      nextErrors.booking_date = 'Please select a booking date.';
    }

    if (selectedBlocks.length === 0) {
      nextErrors.selected_blocks = 'Please select at least one schedule block.';
    }

    if (cart.length === 0) {
      nextErrors.items = 'Please select at least one service.';
    }

    if (!hasAreaServiceSelected) {
      nextErrors.items = 'Please select at least one venue/area service before submitting the booking.';
    }

    if (selectedVenue && !selectedVenueMatchesCart) {
      nextErrors.items = 'The selected availability venue does not match the chosen area service. Please select the matching area service or change the venue reference.';
    }

    if (capacityError) {
      nextErrors.items = capacityError;
    }

    if (data.is_public_calendar_visible && !data.public_calendar_title.trim()) {
      nextErrors.public_calendar_title = 'Please enter the title that should appear on the public calendar.';
    }

    const duplicateExtraDates = new Set(extraDates.filter(Boolean)).size !== extraDates.filter(Boolean).length;
    if (duplicateExtraDates) {
      nextErrors.booking_date = 'Additional dates must be unique.';
    }


    setLocalErrors(nextErrors);

    const firstField = firstTruthyError(nextErrors);
    if (firstField) {
      const section = sectionForField(firstField);
      window.requestAnimationFrame(() => {
        scrollToSection(section);
      });
      return false;
    }

    return true;
  }

  function submitBooking(e: FormEvent) {
    e.preventDefault();
    setScheduleError(null);

    if (!validateBeforeSubmit()) {
      return;
    }

    const range = computeDateRange(bookingDate, selectedBlocks);
    if (!range) {
      setScheduleError('Invalid schedule selection.');
      return;
    }

    const badBlocks = selectedBlocks.filter((block) => !isBlockAvailable(currentAvailability, block));
    if (badBlocks.length > 0) {
      const message = `The selected block is not available: ${badBlocks.join(', ')}.`;
      setScheduleError(message);
      setLocalErrors((prev) => ({ ...prev, selected_blocks: message }));
      scrollToSection('schedule');
      return;
    }

    const extraSchedules = extraDates
      .map((date) => ({ date, range: computeDateRange(date, selectedBlocks) }))
      .filter((entry) => entry.range)
      .map((entry) => ({ from: entry.range!.from, to: entry.range!.to }));

    transform(() => ({
      ...data,
      service_id: cart[0]?.service_id ?? null,
      booking_date_from: range.from,
      booking_date_to: range.to,
      booking_status: isClient ? 'pending' : data.booking_status,
      number_of_guests: String(Number(data.number_of_guests || 0)),
      is_public_calendar_visible: data.is_public_calendar_visible ? '1' : '0',
      public_calendar_title: data.public_calendar_title.trim(),
      extra_schedules: extraSchedules,
      items: cart.map((item) => ({
        service_id: item.service_id,
        quantity: Math.max(1, Number(item.quantity || 1)),
      })),
    } as any));

    post('/bookings', {
      forceFormData: true,
      onSuccess: () => {
        clearDraftStorage();
      },
    });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Booking" />
      <BookingViewSwitch showBackend={canAccessBackendDesign} backendHref={backendDesignHref} />

      <div className="space-y-6 p-4 md:p-6">
        {draftReady && draftRestoreCandidate ? (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-500/10">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Recovered draft found</div>
                <div className="text-sm text-amber-800/90 dark:text-amber-100/80">
                  {formatDraftSavedAt(draftRestoreCandidate.saved_at)}
                  {draftRestoreCandidate.survey_proof_name ? ` • Previous proof image: ${draftRestoreCandidate.survey_proof_name}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => restoreDraft(draftRestoreCandidate)}>
                  Restore draft
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    clearDraftStorage();
                    setDraftGateResolved(true);
                  }}
                >
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#121318]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 px-6 py-8 sm:px-8">
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f8b6d] dark:bg-[#172128] dark:text-[#9dc0ff]">
                Booking
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">Book your schedule</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Choose your client details, booking date, time blocks, venue, and services first. After saving the booking details, the survey email and proof image will be completed on the next page.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <CalendarDays className="h-4 w-4" />
                  View Calendar
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Info className="h-4 w-4" />
                  Contact Office
                </Link>
              </div>
            </div>

            <div className="border-t border-black/5 bg-[#f7f5ef] px-6 py-8 dark:border-white/10 dark:bg-[#0f1014] sm:px-8 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Draft status</div>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{formatDraftSavedAt(draftSavedAt)}</div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={clearDraftStorage}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear draft
                </Button>
              </div>

              <div className="mt-6 rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Booking summary</div>
                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>Date: {bookingDate || '—'}</div>
                  <div>Blocks: {selectedBlocks.length > 0 ? selectedBlocks.join(', ') : '—'}</div>
                  {selectedVenue ? (
                    <div>
                      Venue reference: <strong>{selectedVenue}</strong>
                    </div>
                  ) : null}
                  <div>Services selected: {cart.length}</div>
                  <div>Scheduled days: {daySpanFromSelections(bookingDate, extraDates)}</div>
                  <div>Estimated total: ₱ {formatMoney(totalAmount)}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <form onSubmit={submitBooking} className="space-y-6">
          <Card ref={setSectionRef('client')} className="border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5" />
                Client details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client name</Label>
                <Input id="client_name" value={data.client_name} onChange={(e) => updateField('client_name', e.target.value)} className={fieldClass(Boolean(localErrors.client_name || errors.client_name))} />
                <FieldError message={localErrors.client_name || errors.client_name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name_preset">Company / organization</Label>
                <select
                  id="company_name_preset"
                  value={companyPreset}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCompanyPreset(value);
                    if (value && value !== 'Others') {
                      updateField('company_name', value as any);
                    } else if (value === '') {
                      updateField('company_name', '' as any);
                    }
                  }}
                  className={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm', fieldClass(Boolean(localErrors.company_name || errors.company_name)))}
                >
                  <option value="">Select company / organization</option>
                  {Array.from(DEFAULT_COMPANY_OPTIONS).sort((a, b) => a.localeCompare(b)).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                {companyPreset === 'Others' || (!companyPreset && data.company_name && !DEFAULT_COMPANY_OPTIONS.includes(data.company_name as any)) ? (
                  <Input id="company_name" value={data.company_name} onChange={(e) => updateField('company_name', e.target.value)} placeholder="Enter company / organization" className={fieldClass(Boolean(localErrors.company_name || errors.company_name))} />
                ) : null}
                <FieldError message={localErrors.company_name || errors.company_name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_contact_number">Contact number</Label>
                <Input id="client_contact_number" value={data.client_contact_number} maxLength={11} onChange={(e) => updateField('client_contact_number', cleanPhoneInput(e.target.value) as any)} placeholder="09XXXXXXXXX" className={fieldClass(Boolean(localErrors.client_contact_number || errors.client_contact_number))} />
                <FieldError message={localErrors.client_contact_number || errors.client_contact_number} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_email">Client email</Label>
                <Input id="client_email" type="email" value={data.client_email} disabled={isClient && !!authEmail} onChange={(e) => updateField('client_email', e.target.value)} className={fieldClass(Boolean(localErrors.client_email || errors.client_email))} />
                <FieldError message={localErrors.client_email || errors.client_email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="head_of_organization">Head of organization</Label>
                <Input id="head_of_organization" value={data.head_of_organization} onChange={(e) => updateField('head_of_organization', e.target.value)} className={fieldClass(Boolean(localErrors.head_of_organization || errors.head_of_organization))} />
                <FieldError message={localErrors.head_of_organization || errors.head_of_organization} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_of_event">Type of event</Label>
                <select id="type_of_event" value={eventTypePreset} onChange={(e) => {
                  const value = e.target.value;
                  setEventTypePreset(value);
                  if (value && value !== 'Others') {
                    updateField('type_of_event', value as any);
                  } else if (value === '') {
                    updateField('type_of_event', '' as any);
                  }
                }} className={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm', fieldClass(Boolean(localErrors.type_of_event || errors.type_of_event)))}>
                  <option value="">Select event type</option>
                  {EVENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                {eventTypePreset === 'Others' || (!eventTypePreset && data.type_of_event && !EVENT_TYPE_OPTIONS.includes(data.type_of_event as any)) ? (
                  <Input id="type_of_event_custom" value={data.type_of_event} onChange={(e) => updateField('type_of_event', e.target.value)} placeholder="Enter event type" className={fieldClass(Boolean(localErrors.type_of_event || errors.type_of_event))} />
                ) : null}
                <FieldError message={localErrors.type_of_event || errors.type_of_event} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="client_address">Address</Label>
                <Input id="client_address" value={data.client_address} onChange={(e) => updateField('client_address', e.target.value)} className={fieldClass(Boolean(localErrors.client_address || errors.client_address))} />
                <FieldError message={localErrors.client_address || errors.client_address} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_guests_preset">Number of guests</Label>
                <select id="number_of_guests_preset" value={guestPreset} onChange={(e) => setGuestPreset(e.target.value)} className={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm', fieldClass(Boolean(localErrors.number_of_guests || errors.number_of_guests)))}>
                  {GUEST_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {guestPreset === 'custom' ? (
                  <Input id="number_of_guests" type="number" min={1} max={2000} value={data.number_of_guests} onChange={(e) => updateField('number_of_guests', e.target.value)} placeholder="Enter custom guest count" className={fieldClass(Boolean(localErrors.number_of_guests || errors.number_of_guests))} />
                ) : null}
                <FieldError message={localErrors.number_of_guests || errors.number_of_guests} />
              </div>

              {!isClient ? (
                <div className="space-y-2">
                  <Label htmlFor="booking_status">Initial booking status</Label>
                  <select
                    id="booking_status"
                    value={data.booking_status}
                    onChange={(e) => updateField('booking_status', e.target.value)}
                    className={cn('h-10 w-full rounded-md border border-input bg-background px-3 text-sm', fieldClass(Boolean(localErrors.booking_status || errors.booking_status)))}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                  </select>
                  <FieldError message={localErrors.booking_status || errors.booking_status} />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card ref={setSectionRef('schedule')} className="border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="h-5 w-5" />
                Schedule and availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[260px_260px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="booking_date">Booking date</Label>
                  <Input
                    id="booking_date"
                    type="date"
                    min={todayLocal()}
                    value={bookingDate}
                    onChange={(e) => {
                      markDraftInteractive();
                      setBookingDate(e.currentTarget.value);
                      clearLocalError('booking_date');
                      clearLocalError('selected_blocks');
                    }}
                    className={fieldClass(Boolean(localErrors.booking_date || scheduleError || errors.booking_date_from || errors.booking_date_to))}
                  />
                  <FieldError message={localErrors.booking_date || scheduleError || errors.booking_date_from || errors.booking_date_to} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking_venue_reference">Availability venue reference</Label>
                  <select
                    id="booking_venue_reference"
                    value={selectedVenue}
                    onChange={(e) => {
                      markDraftInteractive();
                      setSelectedVenue(e.currentTarget.value);
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select venue reference</option>
                    {venueOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    This keeps the booking form checker aligned with the area selected from the calendar flow.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Time block</Label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {BLOCK_KEYS.map((block) => {
                      const selected = selectedBlocks.includes(block);
                      const available = isBlockAvailable(currentAvailability, block);

                      return (
                        <button
                          key={block}
                          type="button"
                          onClick={() => {
                            markDraftInteractive();
                            setSelectedBlocks((prev) => toggleBlock(prev, block));
                            clearLocalError('selected_blocks');
                          }}
                          disabled={!available || !bookingDate}
                          className={cn(
                            'rounded-2xl border px-4 py-4 text-left transition',
                            selected
                              ? 'border-[#174f40] bg-[#174f40] text-white dark:border-[#2d47ff] dark:bg-[#2d47ff]'
                              : 'border-black/10 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#17181c] dark:hover:bg-white/10',
                            (!available || !bookingDate) && 'cursor-not-allowed opacity-55',
                          )}
                        >
                          <div className="text-sm font-semibold">{BLOCK_META[block].label}</div>
                          <div className="mt-1 text-xs opacity-85">{BLOCK_META[block].time}</div>
                          <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                            {available ? 'Available' : 'Unavailable'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError message={localErrors.selected_blocks} />
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">Current availability</span>
                  {loadingAvailability ? <span>Loading…</span> : null}
                  {!loadingAvailability && currentAvailability?.is_fully_booked ? (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-red-700 dark:bg-red-500/10 dark:text-red-200">Fully booked</span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-3 rounded-2xl border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-950/50">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Additional dates</div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="date"
                      min={todayLocal()}
                      value={extraDateInput}
                      onChange={(e) => {
                        markDraftInteractive();
                        setExtraDateInput(e.currentTarget.value);
                      }}
                      className="max-w-[220px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!extraDateInput || extraDateInput === bookingDate || extraDates.includes(extraDateInput)) return;
                        markDraftInteractive();
                        setExtraDates((prev) => [...prev, extraDateInput].sort());
                        setExtraDateInput('');
                      }}
                    >
                      Add date
                    </Button>
                  </div>
                  {extraDates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extraDates.map((date) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            markDraftInteractive();
                            setExtraDates((prev) => prev.filter((item) => item !== date));
                          }}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium dark:border-white/10"
                        >
                          {date} ×
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400">Add more dates when the same booking should repeat using the same selected time blocks and items.</div>
                  )}
                </div>

                <div className="mt-4 space-y-3 rounded-2xl border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-950/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Public calendar visibility</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enable this only if the client wants the event title to appear on the public calendar instead of remaining private.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={data.is_public_calendar_visible}
                      onChange={(e) => updateField('is_public_calendar_visible', e.currentTarget.checked)}
                      className="mt-1 h-4 w-4"
                    />
                  </div>
                  {data.is_public_calendar_visible ? (
                    <div className="space-y-2">
                      <Label htmlFor="public_calendar_title">Public calendar title</Label>
                      <Input
                        id="public_calendar_title"
                        value={data.public_calendar_title}
                        onChange={(e) => updateField('public_calendar_title', e.currentTarget.value)}
                        placeholder="Example: City Youth Leadership Summit 2026"
                      />
                      <FieldError message={localErrors.public_calendar_title || (errors.public_calendar_title as string | undefined)} />
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {BLOCK_KEYS.map((block) => {
                    const available = isBlockAvailable(currentAvailability, block);
                    return (
                      <div key={block} className={cn('rounded-xl px-3 py-3 text-sm font-medium', available ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200')}>
                        {BLOCK_META[block].label} • {available ? 'Available' : 'Unavailable'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card ref={setSectionRef('services')} className="border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="h-5 w-5" />
                Services and venue items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="service_search">Search services</Label>
                <Input
                  id="service_search"
                  value={search}
                  onChange={(e) => {
                    markDraftInteractive();
                    setSearch(e.target.value);
                  }}
                  placeholder="Search by service, description, or service type"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  {filteredServiceTypes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      No available services matched your current search.
                    </div>
                  ) : (
                    filteredServiceTypes.map((type) => (
                      <div key={type.id} className="space-y-3 rounded-2xl border border-black/5 p-4 dark:border-white/10">
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{type.name}</div>
                        <div className="grid gap-3 lg:grid-cols-3">
                          {type.services.map((service) => {
                            const capacityLabel = getCapacityLabel(service);
                            const disabledReason = serviceDisabledReason(service, type.name);
                            const isDisabled = Boolean(disabledReason);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => addService(service, type.name)}
                                disabled={isDisabled}
                                className={cn(
                                  'rounded-2xl border border-black/10 bg-white p-4 text-left transition dark:border-white/10 dark:bg-white/5',
                                  !isDisabled && 'hover:-translate-y-0.5 hover:bg-slate-50 dark:hover:bg-white/10',
                                  isDisabled && 'cursor-not-allowed opacity-45',
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="font-semibold text-slate-900 dark:text-white">{service.name}</div>
                                      {serviceBehaviorBadges(service, type.name).map((badge) => (
                                        <span
                                          key={`${service.id}-${badge}`}
                                          className={cn(
                                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
                                            badge === 'Popular'
                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100'
                                              : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
                                          )}
                                        >
                                          {badge}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{service.service_type ?? type.name}</div>
                                  </div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white">₱ {formatMoney(Number(service.price || 0))}</div>
                                </div>
                                {service.description ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{service.description}</p> : null}
                                {capacityLabel ? <div className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{capacityLabel}</div> : null}
                                {disabledReason && disabledReason !== 'Already selected.' ? <div className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-300">{disabledReason}</div> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-4 rounded-2xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Selected items</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">At least one area service is required before booking submission.</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">{cart.length}</div>
                  </div>

                  {cart.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                      No services selected yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.service_id} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-slate-950/50">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{item.area}</div>
                              {(item.min_guests || item.max_guests) ? (
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  {item.min_guests && item.max_guests
                                    ? `${item.min_guests}-${item.max_guests} guests`
                                    : item.min_guests
                                      ? `Min ${item.min_guests} guests`
                                      : `Max ${item.max_guests} guests`}
                                </div>
                              ) : null}
                              {isAdditionalHourServiceName(item.name) ? (
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 px-2 py-1 text-xs dark:border-white/10">
                                  <button type="button" className="px-2" onClick={() => updateCartQuantity(item.service_id, item.quantity - 1)}>-</button>
                                  <span className="min-w-[28px] text-center font-semibold">{item.quantity}</span>
                                  <button type="button" className="px-2" onClick={() => updateCartQuantity(item.service_id, item.quantity + 1)}>+</button>
                                </div>
                              ) : null}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-slate-900 dark:text-white">₱ {formatMoney(Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)))}</div>
                              {isAdditionalHourServiceName(item.name) ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.quantity} hour(s)</div> : null}
                              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => removeService(item.service_id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {capacityError ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                      {capacityError}
                    </div>
                  ) : null}

                  <FieldError message={localErrors.items || (errors.items as string | undefined)} />

                  <div className="rounded-2xl border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-950/50">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Estimated total</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">₱ {formatMoney(totalAmount)}</div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Computed as selected item total × {daySpanFromSelections(bookingDate, extraDates)} scheduled day(s).</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card ref={setSectionRef('survey')} className="border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5" />
                Survey reference on the next page
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/5 bg-[#f7f5ef] px-4 py-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300">
                  This booking page now saves the booking details first. After the booking record is created, the system will open a separate survey page for the survey email and proof image upload.
                </div>

                <div className="rounded-2xl border border-black/5 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-950/50">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">What happens next</div>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <li>• Step 1 saves the booking details, date, time blocks, and selected services.</li>
                    <li>• Step 2 opens the survey reference page.</li>
                    <li>• The survey email and proof image will be attached to the saved booking record.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Google Form reference</div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      The survey QR and proof upload are now handled after the booking is saved, so this first step stays focused on the booking details only.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Review the booking details, schedule, and selected services before saving. The form still stores a local draft automatically while you work.
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={clearDraftStorage}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear draft
              </Button>
              <Button type="submit" disabled={processing}>
                <Save className="mr-2 h-4 w-4" />
                {processing ? 'Saving booking...' : 'Save booking and continue'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
