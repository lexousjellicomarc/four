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
  unavailableDates: string[];
  initialSchedule?: {
    date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
}

type RoleLike = string | { name?: string | null } | null | undefined;
type CartItem = {
  service_id: number;
  name: string;
  area: string;
  price: number;
  min_guests?: number | null;
  max_guests?: number | null;
  capacity_note?: string | null;
};

type BlockKey = 'AM' | 'PM' | 'EVE';

type AvailabilityBlock = {
  key?: string;
  label?: string;
  is_available?: boolean;
  available?: boolean;
};

type DailyAvailability = {
  date: string;
  blocks?: Record<string, AvailabilityBlock> | AvailabilityBlock[];
  is_fully_booked?: boolean;
};

const BLOCKS: Record<BlockKey, { label: string; time: string; start: string; end: string }> = {
  AM: { label: 'AM', time: '6:00 AM – 12:00 PM', start: '06:00', end: '12:00' },
  PM: { label: 'PM', time: '12:00 PM – 6:00 PM', start: '12:00', end: '18:00' },
  EVE: { label: 'EVE', time: '6:00 PM – 11:59 PM', start: '18:00', end: '23:59' },
};

function getRoleNames(auth: any): string[] {
  const raw: RoleLike[] = auth?.roles ?? auth?.user?.roles ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((role) => (typeof role === 'string' ? role : role?.name))
    .filter(Boolean)
    .map((name) => String(name).toLowerCase());
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

function formatMoney(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isBlockAvailable(availability: DailyAvailability | null | undefined, key: BlockKey) {
  if (!availability?.blocks) return true;

  if (Array.isArray(availability.blocks)) {
    const found = availability.blocks.find((block) => (block.key ?? block.label) === key);
    if (!found) return true;
    return Boolean(found.is_available ?? found.available ?? true);
  }

  const found = availability.blocks[key] ?? availability.blocks[key.toLowerCase()];
  if (!found) return true;

  return Boolean(found.is_available ?? found.available ?? true);
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

function normalizeAssetUrl(url: string): string {
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

type FormShape = {
  service_id: string | null;
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
};


type LocalFieldErrors = Partial<Record<keyof FormShape | 'booking_date' | 'selected_blocks' | 'items' | 'survey', string>>;

type SectionKey = 'client' | 'schedule' | 'services' | 'survey';

const SECTION_ORDER: SectionKey[] = ['client', 'schedule', 'services', 'survey'];


type BookingDraftPayload = {
  version: number;
  saved_at: string;
  survey_proof_name: string;
  form: Omit<FormShape, 'survey_proof_image'>;
  bookingDate: string;
  selectedBlocks: BlockKey[];
  search: string;
  cart: CartItem[];
};

const BOOKING_DRAFT_VERSION = 1;

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
      payload.search.trim() ||
      payload.cart.length > 0 ||
      payload.form.survey_email.trim() ||
      payload.survey_proof_name.trim()
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

export default function CreateBooking({ serviceTypes, initialSchedule }: CreateBookingProps) {
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
    type_of_event: '',
    booking_date_from: '',
    booking_date_to: '',
    number_of_guests: '',
    booking_status: 'pending',
  });

  const [bookingDate, setBookingDate] = useState<string>(initialSchedule?.date ?? '');
  const [selectedBlocks, setSelectedBlocks] = useState<BlockKey[]>(() => parseInitialBlocks(initialSchedule));
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, DailyAvailability>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrStage, setQrStage] = useState<'remote' | 'fallback' | 'none'>(
    survey?.qr_image_url ? 'remote' : 'fallback',
  );

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
    if (!draftGateResolved) {
      setDraftGateResolved(true);
      setDraftRestoreCandidate(null);
    }
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
      },
      bookingDate,
      selectedBlocks,
      search,
      cart,
    };
  }

  function persistDraft(payload = buildDraftPayload()) {
    if (typeof window === 'undefined') return;

    if (!hasMeaningfulDraftContent(payload)) {
      window.localStorage.removeItem(draftKey);
      setDraftSavedAt(null);
      return;
    }

    window.localStorage.setItem(draftKey, JSON.stringify(payload));
    setDraftSavedAt(payload.saved_at);
  }

  function clearDraftStorage() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(draftKey);
    setDraftSavedAt(null);
    setDraftRestoreCandidate(null);
    setDraftGateResolved(true);
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
    setSearch(payload.search || '');
    setCart(Array.isArray(payload.cart) ? payload.cart : []);
    setPreviewUrl(null);
    setLocalErrors({});
    setScheduleError(null);
    setCapacityError(null);
    setDraftRestoreCandidate(null);
    setDraftSavedAt(payload.saved_at || new Date().toISOString());
    setDraftGateResolved(true);
  }

  useEffect(() => {
    if (!isClient || !authEmail) return;
    if (data.client_email !== authEmail) {
      setData('client_email', authEmail);
    }
  }, [isClient, authEmail, data.client_email]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) {
        setDraftRestoreCandidate(null);
        setDraftSavedAt(null);
        setDraftGateResolved(true);
        setDraftReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as BookingDraftPayload;
      if (!parsed || parsed.version !== BOOKING_DRAFT_VERSION) {
        window.localStorage.removeItem(draftKey);
        setDraftRestoreCandidate(null);
        setDraftSavedAt(null);
        setDraftGateResolved(true);
        setDraftReady(true);
        return;
      }

      if (!hasMeaningfulDraftContent(parsed)) {
        window.localStorage.removeItem(draftKey);
        setDraftRestoreCandidate(null);
        setDraftSavedAt(null);
        setDraftGateResolved(true);
        setDraftReady(true);
        return;
      }

      setDraftRestoreCandidate(parsed);
      setDraftSavedAt(parsed.saved_at || null);
      setDraftGateResolved(false);
    } catch {
      setDraftRestoreCandidate(null);
      setDraftSavedAt(null);
      setDraftGateResolved(true);
    } finally {
      setDraftReady(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady || !draftGateResolved) return;
    if (typeof window === 'undefined') return;

    if (draftTimerRef.current) {
      window.clearTimeout(draftTimerRef.current);
    }

    draftTimerRef.current = window.setTimeout(() => {
      persistDraft();
    }, 800);

    return () => {
      if (draftTimerRef.current) {
        window.clearTimeout(draftTimerRef.current);
      }
    };
  }, [
    draftReady,
    draftGateResolved,
    data.service_id,
    data.company_name,
    data.client_name,
    data.client_contact_number,
    data.client_email,
    data.survey_email,
    data.client_address,
    data.head_of_organization,
    data.type_of_event,
    data.booking_status,
    data.number_of_guests,
    bookingDate,
    selectedBlocks,
    search,
    cart,
    draftKey,
  ]);

  useEffect(() => {
    const hasFileThatCannotBeAutosaved = Boolean(data.survey_proof_image);
    if (!hasFileThatCannotBeAutosaved) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data.survey_proof_image]);

  useEffect(() => {
    if (!draftRestoreCandidate) return;
    if (data.client_name || data.company_name || data.type_of_event || cart.length > 0 || bookingDate) {
      setDraftGateResolved(true);
      setDraftRestoreCandidate(null);
    }
  }, [draftRestoreCandidate, data.client_name, data.company_name, data.type_of_event, cart.length, bookingDate]);

  useEffect(() => {
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

  async function fetchAvailability(date: string) {
    if (!date) return null;
    if (availabilityCache[date]) return availabilityCache[date];

    setLoadingAvailability(true);

    try {
      const response = await fetch(`/bookings/availability?date=${encodeURIComponent(date)}`);
      if (!response.ok) throw new Error('Unable to load availability');

      const payload = (await response.json()) as DailyAvailability;
      setAvailabilityCache((prev) => ({ ...prev, [date]: payload }));
      return payload;
    } catch {
      return null;
    } finally {
      setLoadingAvailability(false);
    }
  }

  useEffect(() => {
    if (!bookingDate) return;
    fetchAvailability(bookingDate);
  }, [bookingDate]);

  const currentAvailability = bookingDate ? availabilityCache[bookingDate] ?? null : null;

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
  }, [bookingDate, selectedBlocks, currentAvailability]);

  const allServices = useMemo(() => {
    return serviceTypes.flatMap((type) =>
      (type.services ?? []).map((service) => ({
        ...service,
        service_type: service.service_type ?? type.name,
      })),
    );
  }, [serviceTypes]);

  const guestCount = useMemo(() => {
    const parsed = Number(data.number_of_guests || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [data.number_of_guests]);

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

  function addService(service: Service, serviceTypeName: string) {
    if (cart.some((item) => item.service_id === service.id)) {
      return;
    }

    const error = getCapacityError(service, guestCount);
    if (error) {
      setCapacityError(error);
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
        min_guests: service.min_guests ?? null,
        max_guests: service.max_guests ?? null,
        capacity_note: service.capacity_note ?? null,
      },
    ]);
    clearLocalError('items');
  }

  function removeService(serviceId: number) {
    markDraftInteractive();
    setCart((prev) => prev.filter((item) => item.service_id !== serviceId));
  }

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price), 0),
    [cart],
  );

  const surveyQrUrl = survey?.qr_image_url ? normalizeAssetUrl(String(survey.qr_image_url)) : null;
  const qrSrc = qrStage === 'remote' ? surveyQrUrl : qrStage === 'fallback' ? qrFallback : null;


  function validateBeforeSubmit() {
    const nextErrors: LocalFieldErrors = {};

    if (!data.client_name.trim()) nextErrors.client_name = 'Please enter the client name.';
    if (!data.client_contact_number.trim()) nextErrors.client_contact_number = 'Please enter the contact number.';
    if (!data.client_email.trim()) nextErrors.client_email = 'Please enter the client email.';
    if (!data.type_of_event.trim()) nextErrors.type_of_event = 'Please enter the type of event.';
    if (!data.client_address.trim()) nextErrors.client_address = 'Please enter the client address.';
    if (!data.number_of_guests.trim() || Number(data.number_of_guests) <= 0) {
      nextErrors.number_of_guests = 'Please enter a valid number of guests.';
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

    if (capacityError) {
      nextErrors.items = capacityError;
    }

    if (!data.survey_email.trim()) {
      nextErrors.survey_email = 'Please enter the survey email used in the Google Form.';
    }

    if (!data.survey_proof_image) {
      nextErrors.survey_proof_image = 'Please upload the survey proof image.';
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

    transform(() => ({
      ...data,
      service_id: cart[0]?.service_id ?? null,
      booking_date_from: range.from,
      booking_date_to: range.to,
      booking_status: isClient ? 'pending' : data.booking_status,
      number_of_guests: Number(data.number_of_guests || 0),
      items: cart.map((item) => ({
        service_id: item.service_id,
        quantity: 1,
      })),
    }));

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
        <Card className="overflow-hidden border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#121318]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 px-6 py-8 sm:px-8">
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f8b6d] dark:bg-[#172128] dark:text-[#9dc0ff]">
                Booking
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
                  Book your schedule
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Choose your details, date, time block, and service. When the form is incomplete, the page now jumps to the first missing section so the client can correct it quickly.
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
                  Need Assistance
                </Link>
              </div>
            </div>

            <div className="border-t border-black/5 bg-[#f7f5ef] px-6 py-8 dark:border-white/10 dark:bg-white/5 lg:border-l lg:border-t-0">
              <div className="rounded-[1.5rem] border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-[#17181c]">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                  Current Selection
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-300">Booking date</span>
                    <span className="font-semibold text-right">{bookingDate || '-'}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-300">Blocks</span>
                    <span className="font-semibold text-right">
                      {selectedBlocks.length > 0 ? selectedBlocks.join(' + ') : '-'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-300">Selected services</span>
                    <span className="font-semibold text-right">{cart.length}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-300">Estimated total</span>
                    <span className="font-semibold text-right">₱ {formatMoney(totalAmount)}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-300">Guest count</span>
                    <span className="font-semibold text-right">{data.number_of_guests || '-'}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#dce9e4] bg-[#eef7f4] px-4 py-3 text-xs leading-6 text-[#174f40] dark:border-[#263541] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                  Capacity notes are checked against the selected service and guest count before submission. After saving, the flow continues to the payment screen.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {draftRestoreCandidate ? (
          <Card className="border-[#bfd2ff] bg-[#eef4ff] dark:border-[#263541] dark:bg-[#16212b]">
            <CardContent className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#bfd2ff] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1645ac] dark:border-[#3f5b9d] dark:bg-[#1c2740] dark:text-[#9dc0ff]">
                  <Save className="h-3.5 w-3.5" /> Draft Found
                </div>
                <div className="text-lg font-semibold text-[#1f1f1c] dark:text-white">
                  A saved booking draft is available on this device.
                </div>
                <div className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {formatDraftSavedAt(draftRestoreCandidate.saved_at)}. You can restore it and continue where you left off. For security reasons, the survey proof image file cannot be restored automatically and must be uploaded again.
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => clearDraftStorage()}>
                  Discard Draft
                </Button>
                <Button type="button" onClick={() => restoreDraft(draftRestoreCandidate)}>
                  Restore Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-black/5 bg-white/80 dark:border-white/10 dark:bg-[#121318]">
            <CardContent className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dce9e4] bg-[#eef7f4] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#174f40] dark:border-[#263541] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                  <Save className="h-3.5 w-3.5" /> Draft Autosave
                </div>
                <div className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {formatDraftSavedAt(draftSavedAt)} The form now saves locally while you type so refreshes or accidental tab closes do not wipe the whole booking.
                </div>
                {data.survey_proof_image ? (
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    The uploaded survey proof image is not included in local draft storage. Re-upload it if the page is refreshed.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => persistDraft()}>
                  Save Draft Now
                </Button>
                <Button type="button" variant="outline" onClick={() => clearDraftStorage()}>
                  Clear Saved Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={submitBooking} className="space-y-6">
          <Card ref={setSectionRef('client')}>
            <CardHeader>
              <CardTitle>Client details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={data.client_name}
                  onChange={(e) => updateField('client_name', e.currentTarget.value)}
                  required
                  className={fieldClass(Boolean(localErrors.client_name || errors.client_name))}
                />
                <FieldError message={localErrors.client_name || errors.client_name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company / Organization</Label>
                <Input
                  id="company_name"
                  value={data.company_name}
                  onChange={(e) => updateField('company_name', e.currentTarget.value)}
                  className={fieldClass(Boolean(localErrors.company_name || errors.company_name))}
                />
                <FieldError message={localErrors.company_name || errors.company_name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_contact_number">Contact Number</Label>
                <Input
                  id="client_contact_number"
                  value={data.client_contact_number}
                  onChange={(e) => updateField('client_contact_number', e.currentTarget.value)}
                  required
                  className={fieldClass(Boolean(localErrors.client_contact_number || errors.client_contact_number))}
                />
                <FieldError message={localErrors.client_contact_number || errors.client_contact_number} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={data.client_email}
                  onChange={(e) => updateField('client_email', e.currentTarget.value)}
                  required
                  disabled={isClient && !!authEmail}
                  className={fieldClass(Boolean(localErrors.client_email || errors.client_email), isClient && !!authEmail ? 'bg-muted text-muted-foreground' : undefined)}
                />
                <FieldError message={localErrors.client_email || errors.client_email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="head_of_organization">Head of Organization</Label>
                <Input
                  id="head_of_organization"
                  value={data.head_of_organization}
                  onChange={(e) => updateField('head_of_organization', e.currentTarget.value)}
                  className={fieldClass(Boolean(localErrors.head_of_organization || errors.head_of_organization))}
                />
                <FieldError message={localErrors.head_of_organization || errors.head_of_organization} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_of_event">Type of Event</Label>
                <Input
                  id="type_of_event"
                  value={data.type_of_event}
                  onChange={(e) => updateField('type_of_event', e.currentTarget.value)}
                  required
                  className={fieldClass(Boolean(localErrors.type_of_event || errors.type_of_event))}
                />
                <FieldError message={localErrors.type_of_event || errors.type_of_event} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="client_address">Address</Label>
                <textarea
                  id="client_address"
                  value={data.client_address}
                  onChange={(e) => updateField('client_address', e.currentTarget.value)}
                  rows={3}
                  className={fieldClass(Boolean(localErrors.client_address || errors.client_address), 'w-full rounded-md bg-background px-3 py-2 text-sm')}
                  required
                />
                <FieldError message={localErrors.client_address || errors.client_address} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_guests">Number of Guests</Label>
                <Input
                  id="number_of_guests"
                  type="number"
                  min="1"
                  value={data.number_of_guests}
                  onChange={(e) => updateField('number_of_guests', e.currentTarget.value)}
                  required
                  className={fieldClass(Boolean(localErrors.number_of_guests || errors.number_of_guests))}
                />
                <FieldError message={localErrors.number_of_guests || errors.number_of_guests} />
              </div>

              {!isClient && (
                <div className="space-y-2">
                  <Label htmlFor="booking_status">Initial Booking Status</Label>
                  <select
                    id="booking_status"
                    value={data.booking_status}
                    onChange={(e) => updateField('booking_status', e.currentTarget.value)}
                    className={fieldClass(Boolean(localErrors.booking_status || errors.booking_status), 'h-10 w-full rounded-md bg-background px-3 text-sm')}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                    <option value="declined">Declined</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <FieldError message={localErrors.booking_status || errors.booking_status} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card ref={setSectionRef('schedule')}>
            <CardHeader>
              <CardTitle>Choose date and time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="booking_date">Booking Date</Label>
                  <Input
                    id="booking_date"
                    type="date"
                    min={todayLocal()}
                    value={bookingDate}
                    onChange={(e) => { setBookingDate(e.currentTarget.value); clearLocalError('booking_date'); clearLocalError('selected_blocks'); }}
                    required
                    className={fieldClass(Boolean(localErrors.booking_date || scheduleError || errors.booking_date_from || errors.booking_date_to))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time Block</Label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {(['AM', 'PM', 'EVE'] as BlockKey[]).map((block) => {
                      const selected = selectedBlocks.includes(block);
                      const available = isBlockAvailable(currentAvailability, block);

                      return (
                        <button
                          key={block}
                          type="button"
                          onClick={() => { markDraftInteractive();
                      setSelectedBlocks((prev) => toggleBlock(prev, block)); clearLocalError('selected_blocks'); }}
                          disabled={!available || !bookingDate}
                          className={cn(
                            'rounded-2xl border px-4 py-4 text-left transition',
                            selected
                              ? 'border-[#174f40] bg-[#174f40] text-white dark:border-[#2d47ff] dark:bg-[#2d47ff]'
                              : 'border-black/10 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#17181c] dark:hover:bg-white/10',
                            (!available || !bookingDate) && 'cursor-not-allowed opacity-55',
                          )}
                        >
                          <div className="text-sm font-semibold">{BLOCKS[block].label}</div>
                          <div className="mt-1 text-xs opacity-85">{BLOCKS[block].time}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-[#f7f5ef] px-4 py-4 text-sm dark:border-white/10 dark:bg-white/5">
                {loadingAvailability ? (
                  <div>Checking availability...</div>
                ) : data.booking_date_from && data.booking_date_to ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0f8b6d]" />
                    <span>
                      Schedule selected:
                      <strong className="ml-1">
                        {data.booking_date_from} to {data.booking_date_to}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <div>Select a date and at least one valid block.</div>
                )}
              </div>

              {(scheduleError || errors.booking_date_from || errors.booking_date_to) && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  {localErrors.booking_date || localErrors.selected_blocks || scheduleError || errors.booking_date_from || errors.booking_date_to}
                </div>
              )}
            </CardContent>
          </Card>

          <Card ref={setSectionRef('services')}>
            <CardHeader>
              <CardTitle>Choose services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-[#dce9e4] bg-[#eef7f4] px-4 py-3 text-sm text-[#174f40] dark:border-[#263541] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                Choose one or more services. When you select one, it disappears from the available list and moves to the selected-services panel for easier review.
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_search">Search Service</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="service_search"
                    value={search}
                    onChange={(e) => { markDraftInteractive(); setSearch(e.currentTarget.value); }}
                    className={fieldClass(Boolean(errors.service_search), 'pl-10')}
                    placeholder="Search service or area"
                  />
                </div>
              </div>

              {(capacityError || localErrors.items) && (
                <div className="rounded-2xl border border-[#f2c8c8] bg-[#fff6f6] px-4 py-3 text-sm text-[#a52a2a] dark:border-[#6e2a2a] dark:bg-[#241414] dark:text-[#ffbcbc]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{localErrors.items || capacityError}</span>
                  </div>
                </div>
              )}

              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  {filteredServiceTypes.length > 0 ? (
                    filteredServiceTypes.map((type) => (
                      <div
                        key={type.id}
                        className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]"
                      >
                        <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                          {type.name}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {type.services.map((service) => {
                            const capacityLabel = getCapacityLabel(service);

                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => addService(service, type.name)}
                                className="rounded-2xl border border-black/10 bg-[#faf9f6] p-4 text-left transition hover:border-[#0f8b6d] hover:bg-[#f3fbf8] dark:border-white/10 dark:bg-[#121318] dark:hover:border-[#8ea3ff] dark:hover:bg-[#16202d]"
                              >
                                <div className="text-base font-semibold text-[#1f1f1c] dark:text-white">
                                  {service.name}
                                </div>

                                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                                  {type.name}
                                </div>

                                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                  {service.description}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-full bg-[#eef7f4] px-3 py-1 text-xs font-semibold text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                                    ₱ {formatMoney(Number(service.price))}
                                  </span>

                                  {capacityLabel && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                      <Users className="mr-1 inline h-3 w-3" />
                                      {capacityLabel}
                                    </span>
                                  )}
                                </div>

                                {service.capacity_note && (
                                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">
                                    {service.capacity_note}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                      No services match the current search.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]">
                    <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                      Selected Services
                    </div>

                    <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1 scrollbar-hide">
                      {cart.length > 0 ? (
                        cart.map((item) => (
                          <div
                            key={item.service_id}
                            className="rounded-2xl border border-black/10 bg-[#faf9f6] p-4 dark:border-white/10 dark:bg-[#121318]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-[#1f1f1c] dark:text-white">
                                  {item.name}
                                </div>
                                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                                  {item.area}
                                </div>
                                <div className="mt-3 text-sm font-semibold text-[#174f40] dark:text-[#9dc0ff]">
                                  ₱ {formatMoney(Number(item.price))}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeService(item.service_id)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-[#a52a2a] transition hover:bg-[#fff6f6] dark:border-white/10 dark:hover:bg-[#241414]"
                                title="Remove service"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                          No service selected yet. Choose from the left panel.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#dce9e4] bg-[#eef7f4] px-4 py-4 text-sm text-[#174f40] dark:border-[#263541] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                      The selected services shown here are the items that will be sent with the booking after you finalize the form.
                    </div>

                    <div className="mt-4 rounded-2xl border border-black/5 bg-[#f7f5ef] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-300">Services</span>
                        <span className="font-semibold">{cart.length}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-300">Estimated total</span>
                        <span className="font-semibold">₱ {formatMoney(totalAmount)}</span>
                      </div>
                    </div>

                    <FieldError message={localErrors.items || String((errors.items as any) ?? '')} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card ref={setSectionRef('survey')}>
            <CardHeader>
              <CardTitle>Survey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-black/5 bg-[#f7f5ef] px-4 py-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Open the survey, then enter the email used and upload the proof image.
              </div>

              <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#17181c]">
                  <div className="text-sm font-semibold">Survey QR</div>

                  <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-black/10 bg-[#faf9f6] p-4 dark:border-white/10 dark:bg-[#121318]">
                    {qrSrc ? (
                      <img
                        src={qrSrc}
                        alt="Survey QR"
                        className="max-h-52 w-auto object-contain"
                        onError={() => {
                          if (qrStage === 'remote') setQrStage('fallback');
                          else if (qrStage === 'fallback') setQrStage('none');
                        }}
                      />
                    ) : (
                      <div className="text-sm text-slate-500 dark:text-slate-300">QR unavailable</div>
                    )}
                  </div>

                  {survey?.url ? (
                    <a
                      href={survey.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Open Survey
                    </a>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="survey_email">Survey Email</Label>
                    <Input
                      id="survey_email"
                      type="email"
                      value={data.survey_email}
                      onChange={(e) => updateField('survey_email', e.currentTarget.value)}
                      required
                      className={fieldClass(Boolean(localErrors.survey_email || errors.survey_email))}
                    />
                    <FieldError message={localErrors.survey_email || errors.survey_email} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="survey_proof_image">Survey Proof Image</Label>
                    <Input
                      id="survey_proof_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => { updateField('survey_proof_image', e.currentTarget.files?.[0] ?? null); clearLocalError('survey'); }}
                      required
                      className={fieldClass(Boolean(localErrors.survey_proof_image || errors.survey_proof_image))}
                    />
                    <FieldError message={localErrors.survey_proof_image || errors.survey_proof_image} />
                  </div>

                  {previewUrl && (
                    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#17181c]">
                      <img
                        src={previewUrl}
                        alt="Survey proof preview"
                        className="max-h-72 w-full rounded-xl object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-[#dce9e4] bg-[#eef7f4] px-4 py-4 text-sm text-[#174f40] dark:border-[#263541] dark:bg-[#16212b] dark:text-[#9dc0ff]">
            After this booking is saved, the next screen should be used for payment options, proof upload, and reference number submission.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link href="/bookings">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>

            <Button type="submit" disabled={processing || !!capacityError}>
              {processing ? 'Submitting...' : 'Save Booking and Continue to Payment'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
