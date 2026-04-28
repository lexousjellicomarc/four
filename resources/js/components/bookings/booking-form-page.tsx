import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
  BOOKING_VENUE_CATALOG,
  catalogItemMatchesService,
  type BookingVenueCatalogItem,
  type BookingVenueKey,
} from '@/lib/booking-venue-catalog';
import {
  bookingBasePath,
  bookingShowPath,
  formatDateTime,
  normalizeWorkspaceRole,
  type BookingLike,
} from '@/lib/booking-role-ui';
import { getRoleTheme, type RoleThemeKey } from '@/lib/role-theme';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  PackageCheck,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type ServiceOption = {
  id: number | string;
  name: string;
  price?: number | string | null;
  description?: string | null;
  service_type_id?: number | string | null;
  service_type_name?: string | null;
};

type ServiceTypeOption = {
  id: number | string;
  name: string;
  services?: ServiceOption[];
};

type InitialSchedule = {
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

type BookingFormPageProps = {
  workspaceRole?: string;
  booking?: BookingLike;
  serviceTypes?: ServiceTypeOption[];
  services?: ServiceOption[];
  initialSchedule?: InitialSchedule;
  initialVenue?: string | null;
  initialEventType?: string | null;
  initialGuests?: number | string | null;
  isStaffWorkspace?: boolean;
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
  booking_status: string;
  payment_status: string;
  is_public_calendar_visible: boolean;
  public_calendar_title: string;
};

type MatchedVenueItem = BookingVenueCatalogItem & {
  service?: ServiceOption;
  configured: boolean;
};

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
  if (fallback) return toInputDateTime(fallback);

  if (schedule?.date && schedule?.start_time && part === 'from') {
    return `${schedule.date}T${schedule.start_time}`;
  }

  if (schedule?.date && schedule?.end_time && part === 'to') {
    return `${schedule.date}T${schedule.end_time}`;
  }

  return '';
}

function firstValue(...values: unknown[]): string {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value);
    }
  }

  return '';
}

function flattenServices(serviceTypes?: ServiceTypeOption[], services?: ServiceOption[]) {
  const directServices = Array.isArray(services) ? services : [];

  const nestedServices = Array.isArray(serviceTypes)
    ? serviceTypes.flatMap((type) =>
        Array.isArray(type.services)
          ? type.services.map((service) => ({
              ...service,
              service_type_id: service.service_type_id ?? type.id,
              service_type_name: type.name,
            }))
          : [],
      )
    : [];

  const merged = [...directServices, ...nestedServices];
  const seen = new Set<string>();

  return merged.filter((service) => {
    const key = String(service.id);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function matchCatalogWithServices(services: ServiceOption[]): MatchedVenueItem[] {
  return BOOKING_VENUE_CATALOG.map((item) => {
    const service = services.find((option) => catalogItemMatchesService(item, option.name));

    return {
      ...item,
      service,
      configured: Boolean(service),
    };
  });
}

function roleCopy(role: RoleThemeKey, editing: boolean) {
  if (role === 'admin') {
    return {
      title: editing ? 'Edit Executive Reservation' : 'Create Executive Reservation',
      description:
        'Premium backend booking workspace for venue selection, client details, schedule control, status, and public visibility.',
      submit: editing ? 'Save Reservation' : 'Create Reservation',
    };
  }

  if (role === 'manager') {
    return {
      title: 'Review Venue Reservation',
      description:
        'Management review workspace for checking reservation details, schedule readiness, and client information.',
      submit: 'Save Review Changes',
    };
  }

  if (role === 'staff') {
    return {
      title: editing ? 'Update Assisted Reservation' : 'Assist Venue Reservation',
      description:
        'Operations booking screen for walk-ins, phone requests, office-assisted clients, and schedule coordination.',
      submit: editing ? 'Update Assisted Booking' : 'Save Assisted Booking',
    };
  }

  return {
    title: editing ? 'Update Your Event Request' : 'Reserve Your Event Space',
    description:
      'Choose your event space like a premium hotel reservation, then submit your booking request for BCCC review.',
    submit: editing ? 'Update Request' : 'Request Booking',
  };
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] opacity-55">
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
      </span>
      {children}
      {error ? <p className="text-xs font-bold text-red-300">{error}</p> : null}
    </label>
  );
}

function VenueImage({
  item,
  selected,
  large = false,
}: {
  item: BookingVenueCatalogItem;
  selected: boolean;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-[1.35rem] ${large ? 'h-[22rem]' : 'h-60'} ${item.fallbackClass}`}>
      {!failed ? (
        <img
          src={item.image}
          alt={item.displayLabel}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover brightness-[0.52] saturate-[0.78] transition duration-700 group-hover:scale-[1.055] group-hover:brightness-[0.46]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-12 w-12 text-white/30" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

      <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-black/55 px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-white/70 backdrop-blur">
        {item.capacity}
      </div>

      <div className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/60 backdrop-blur ${selected ? 'bg-amber-300 text-black' : 'bg-black/45 text-transparent'}`}>
        {selected ? <Check className="h-4 w-4" /> : null}
      </div>

      <div className="absolute bottom-5 left-5 right-5">
        {item.tag ? (
          <span className="mb-2 inline-flex rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
            {item.tag}
          </span>
        ) : null}

        <h3 className="text-3xl font-black leading-none tracking-[-0.045em] text-white">
          {item.displayLabel}
        </h3>

        <p className="mt-2 text-sm tracking-[0.04em] text-white/65">
          {item.subtitle}
        </p>
      </div>
    </div>
  );
}

function VenueCard({
  item,
  selected,
  onSelect,
  large = false,
  themeButtonClass,
}: {
  item: MatchedVenueItem;
  selected: boolean;
  onSelect: () => void;
  large?: boolean;
  themeButtonClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex w-full flex-col overflow-hidden rounded-[1.65rem] border p-2 text-left backdrop-blur transition duration-300 hover:-translate-y-1 ${
        selected
          ? 'border-amber-200/60 bg-amber-300/10 shadow-2xl shadow-amber-950/20'
          : 'border-white/10 bg-white/[0.055] shadow-lg shadow-black/10 hover:border-white/20 hover:bg-white/[0.085]'
      } ${large ? 'lg:grid lg:grid-cols-[1.18fr_0.82fr]' : ''}`}
    >
      <VenueImage item={item} selected={selected} large={large} />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-45">
              {item.category === 'package' ? 'Complete Package' : 'Individual Space'}
            </p>
            <h4 className="mt-1 text-xl font-black tracking-tight">
              {item.label}
            </h4>
          </div>

          <ChevronRight className={`mt-1 h-5 w-5 shrink-0 transition ${selected ? 'translate-x-1 opacity-100' : 'opacity-45 group-hover:translate-x-1'}`} />
        </div>

        <p className="mt-3 text-sm leading-6 opacity-65">
          {item.description}
        </p>

        {item.category === 'package' ? (
          <div className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-300/10 p-4 text-amber-50">
            <div className="mb-2 flex items-center gap-2 text-sm font-black">
              <PackageCheck className="h-4 w-4" />
              Included in Full Hall
            </div>

            <div className="flex flex-wrap gap-1.5">
              {item.includes.map((included) => (
                <span
                  key={included}
                  className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                >
                  {included}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm font-bold opacity-75">
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
            Individual booking item
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {item.idealFor.slice(0, 3).map((ideal) => (
            <span
              key={ideal}
              className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-bold opacity-70"
            >
              {ideal}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-5">
          {item.configured ? (
            <div className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${themeButtonClass}`}>
              <span>Ready to book</span>
              <span>{item.service?.price ? `₱${item.service.price}` : 'Configured'}</span>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-300/25 bg-red-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-red-100">
              Missing Rental Option
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  children,
  panelClass,
}: {
  icon: typeof UserRound;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  panelClass: string;
}) {
  return (
    <section className={`rounded-[2rem] border p-5 backdrop-blur-xl sm:p-6 ${panelClass}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/10 shadow-inner">
          <Icon className="h-5 w-5 opacity-75" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-55">
            {eyebrow}
          </p>
          <h3 className="text-xl font-black tracking-tight">{title}</h3>
        </div>
      </div>

      {children}
    </section>
  );
}

export function BookingFormPage() {
  const { props } = usePage<BookingFormPageProps>();
  const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
  const theme = getRoleTheme(role);
  const booking = props.booking;
  const editing = Boolean(booking?.id);
  const copy = roleCopy(role, editing);
  const isClient = role === 'user';
  const isManager = role === 'manager';
  const isStaffLike = role === 'admin' || role === 'manager' || role === 'staff';

  const services = useMemo(
    () => flattenServices(props.serviceTypes, props.services),
    [props.serviceTypes, props.services],
  );

  const venueItems = useMemo(() => matchCatalogWithServices(services), [services]);

  const initialServiceId = firstValue(
    booking?.service_id,
    booking?.service?.id,
    props.initialVenue &&
      services.find((service) =>
        String(service.name).toUpperCase().includes(String(props.initialVenue).toUpperCase()),
      )?.id,
  );

  const matchedInitialVenue =
    venueItems.find((item) => String(item.service?.id ?? '') === String(initialServiceId)) ??
    venueItems[0];

  const [selectedVenueKey, setSelectedVenueKey] = useState<BookingVenueKey | null>(
    matchedInitialVenue?.key ?? null,
  );

  const selectedVenue = venueItems.find((item) => item.key === selectedVenueKey);

  const { data, setData, post, put, processing, errors } = useForm<BookingFormData>({
    service_id: initialServiceId,
    organization_type: firstValue(booking?.organization_type, 'Private'),
    company_name: firstValue(booking?.company_name),
    client_name: firstValue(booking?.client_name),
    client_contact_number: firstValue(booking?.client_contact_number),
    client_email: firstValue(booking?.client_email),
    client_address: firstValue(booking?.client_address),
    client_region: firstValue(booking?.client_region, 'CAR'),
    client_province: firstValue(booking?.client_province, 'Benguet'),
    client_city_municipality: firstValue(booking?.client_city_municipality, 'Baguio City'),
    client_barangay: firstValue(booking?.client_barangay),
    client_zip_code: firstValue(booking?.client_zip_code),
    client_street_address: firstValue(booking?.client_street_address),
    head_of_organization: firstValue(booking?.head_of_organization),
    type_of_event: firstValue(booking?.type_of_event, props.initialEventType),
    booking_date_from: buildInitialDateTime(
      props.initialSchedule,
      booking?.booking_date_from,
      'from',
    ),
    booking_date_to: buildInitialDateTime(
      props.initialSchedule,
      booking?.booking_date_to,
      'to',
    ),
    number_of_guests: firstValue(booking?.number_of_guests, props.initialGuests),
    booking_status: firstValue(booking?.booking_status, 'pending'),
    payment_status: firstValue(booking?.payment_status, 'unpaid'),
    is_public_calendar_visible: Boolean(booking?.is_public_calendar_visible ?? false),
    public_calendar_title: firstValue(booking?.public_calendar_title),
  });

  const fullHall = venueItems.find((item) => item.key === 'FULL_HALL');
  const individualItems = venueItems.filter((item) => item.key !== 'FULL_HALL');
  const configuredCount = venueItems.filter((item) => item.configured).length;
  const backHref = editing && booking?.id ? bookingShowPath(role, booking.id) : bookingBasePath(role);

  function selectVenue(item: MatchedVenueItem) {
    setSelectedVenueKey(item.key);
    setData('service_id', item.service?.id ? String(item.service.id) : '');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!data.service_id) {
      window.dispatchEvent(
        new CustomEvent('bccc:feedback', {
          detail: {
            type: 'warning',
            title: 'Select a Configured Venue',
            message:
              'This venue category is not linked to a Rental Option yet. Add it first in Admin → Rental Options.',
            duration: 2800,
          },
        }),
      );

      return;
    }

    if (editing && booking?.id) {
      put(`${bookingBasePath(role)}/${booking.id}`, {
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
      preserveScroll: true,
    });
  }

  return (
    <BookingRolePageShell
      role={role}
      title={copy.title}
      description={copy.description}
      actions={
        <Link href={backHref} className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition ${theme.subtleButtonClass}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-6">
        <section className={`relative overflow-hidden rounded-[2rem] border p-5 backdrop-blur-xl sm:p-6 xl:grid xl:grid-cols-[1.08fr_0.92fr] xl:gap-6 ${theme.heroClass}`}>
          <div className="relative flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-[1.65rem] border border-white/10 bg-black/20 p-5 sm:p-7">
            <div className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.24em] ${theme.badgeClass}`}>
              {theme.eyebrow}
            </div>

            <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.92] tracking-[-0.065em] text-white sm:text-5xl xl:text-6xl">
              Reserve the right space before the form feels official.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
              A premium hotel-style reservation flow for BCCC event spaces. Full Hall is a complete package; the other spaces are individual booking choices.
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:mt-0">
            <section className={`rounded-[1.5rem] border p-5 ${theme.panelClass}`}>
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-55">
                Selected Space
              </p>

              <h3 className="mt-2 text-2xl font-black tracking-tight">
                {selectedVenue?.displayLabel ?? 'Choose a venue'}
              </h3>

              <p className="mt-3 text-sm leading-6 opacity-65">
                {selectedVenue?.description ?? 'Select one booking category from the cards below.'}
              </p>

              {selectedVenue ? (
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-45">
                      Category
                    </p>
                    <p className="mt-2 text-sm font-black">
                      {selectedVenue.category === 'package' ? 'Complete Package' : 'Individual Booking'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-45">
                      Backend Match
                    </p>
                    <p className="mt-2 text-sm font-black">
                      {selectedVenue.service?.name ?? 'Not configured'}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>

            <section className={`rounded-[1.5rem] border p-5 ${theme.panelClass}`}>
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-55">
                Booking Flow
              </p>

              <div className="mt-4 grid gap-3">
                {[
                  'Choose venue category',
                  'Complete client information',
                  'Set schedule and guests',
                  'Submit for BCCC review',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${theme.badgeClass}`}>
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold opacity-75">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className={`rounded-[2rem] border p-5 backdrop-blur-xl sm:p-6 ${theme.panelClass}`}>
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.22em] ${theme.textAccentClass}`}>
                Step 01
              </p>
              <h3 className="mt-1 text-3xl font-black tracking-[-0.045em]">
                Select Your Venue
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 opacity-65">
                Full Hall includes Main Hall, LED Wall, VIP Lounge, and Board Room. The remaining spaces are bookable as individual items.
              </p>
            </div>

            <div className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${theme.badgeClass}`}>
              {configuredCount}/{venueItems.length} configured
            </div>
          </div>

          {fullHall ? (
            <div className="mb-5">
              <VenueCard
                item={fullHall}
                selected={selectedVenueKey === fullHall.key}
                onSelect={() => selectVenue(fullHall)}
                large
                themeButtonClass={theme.badgeClass}
              />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {individualItems.map((item) => (
              <VenueCard
                key={item.key}
                item={item}
                selected={selectedVenueKey === item.key}
                onSelect={() => selectVenue(item)}
                themeButtonClass={theme.badgeClass}
              />
            ))}
          </div>

          {errors.service_id ? (
            <p className="mt-4 rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">
              {errors.service_id}
            </p>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_410px]">
          <div className="space-y-6">
            <SectionCard
              icon={UserRound}
              eyebrow="Step 02"
              title={isClient ? 'Your Details' : 'Client and Organization Details'}
              panelClass={theme.panelClass}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Client Name" required error={errors.client_name}>
                  <input
                    value={data.client_name}
                    onChange={(event) => setData('client_name', event.target.value)}
                    className="ease-input"
                    placeholder="Full name"
                  />
                </Field>

                <Field label="Contact Number" required error={errors.client_contact_number}>
                  <input
                    value={data.client_contact_number}
                    onChange={(event) => setData('client_contact_number', event.target.value)}
                    className="ease-input"
                    placeholder="09XX XXX XXXX"
                  />
                </Field>

                <Field label="Email Address" required error={errors.client_email}>
                  <input
                    value={data.client_email}
                    onChange={(event) => setData('client_email', event.target.value)}
                    className="ease-input"
                    placeholder="name@example.com"
                    type="email"
                    disabled={isClient && editing}
                  />
                </Field>

                <Field label="Organization Type" error={errors.organization_type}>
                  <select
                    value={data.organization_type}
                    onChange={(event) => setData('organization_type', event.target.value)}
                    className="ease-input"
                  >
                    <option value="Private">Private</option>
                    <option value="Government">Government</option>
                    <option value="NGO">NGO</option>
                    <option value="Academe">Academe</option>
                    <option value="Religious">Religious</option>
                    <option value="Others">Others</option>
                  </select>
                </Field>

                <Field label="Company / Organization" error={errors.company_name}>
                  <input
                    value={data.company_name}
                    onChange={(event) => setData('company_name', event.target.value)}
                    className="ease-input"
                    placeholder="Organization name"
                  />
                </Field>

                <Field label="Head of Organization" error={errors.head_of_organization}>
                  <input
                    value={data.head_of_organization}
                    onChange={(event) => setData('head_of_organization', event.target.value)}
                    className="ease-input"
                    placeholder="Optional"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard icon={MapPin} eyebrow="Step 03" title="Client Address" panelClass={theme.panelClass}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Region" error={errors.client_region}>
                  <input
                    value={data.client_region}
                    onChange={(event) => setData('client_region', event.target.value)}
                    className="ease-input"
                  />
                </Field>

                <Field label="Province" error={errors.client_province}>
                  <input
                    value={data.client_province}
                    onChange={(event) => setData('client_province', event.target.value)}
                    className="ease-input"
                  />
                </Field>

                <Field label="City / Municipality" error={errors.client_city_municipality}>
                  <input
                    value={data.client_city_municipality}
                    onChange={(event) => setData('client_city_municipality', event.target.value)}
                    className="ease-input"
                  />
                </Field>

                <Field label="Barangay" error={errors.client_barangay}>
                  <input
                    value={data.client_barangay}
                    onChange={(event) => setData('client_barangay', event.target.value)}
                    className="ease-input"
                  />
                </Field>

                <Field label="ZIP Code" error={errors.client_zip_code}>
                  <input
                    value={data.client_zip_code}
                    onChange={(event) => setData('client_zip_code', event.target.value)}
                    className="ease-input"
                  />
                </Field>

                <Field label="Street Address" error={errors.client_street_address}>
                  <input
                    value={data.client_street_address}
                    onChange={(event) => {
                      setData('client_street_address', event.target.value);
                      setData('client_address', event.target.value);
                    }}
                    className="ease-input"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              icon={CalendarDays}
              eyebrow="Step 04"
              title="Schedule and Event Details"
              panelClass={theme.panelClass}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Selected Booking Category" required error={errors.service_id}>
                  <select
                    value={data.service_id}
                    onChange={(event) => {
                      setData('service_id', event.target.value);

                      const matched = venueItems.find(
                        (item) => String(item.service?.id ?? '') === String(event.target.value),
                      );

                      if (matched) {
                        setSelectedVenueKey(matched.key);
                      }
                    }}
                    className="ease-input"
                  >
                    <option value="">Select configured option</option>
                    {venueItems
                      .filter((item) => item.configured && item.service)
                      .map((item) => (
                        <option key={item.key} value={item.service?.id}>
                          {item.label}
                          {item.service?.price ? ` — ₱${item.service.price}` : ''}
                        </option>
                      ))}
                  </select>
                </Field>

                <Field label="Type of Event" required error={errors.type_of_event}>
                  <input
                    value={data.type_of_event}
                    onChange={(event) => setData('type_of_event', event.target.value)}
                    className="ease-input"
                    placeholder="Conference, exhibit, seminar, ceremony..."
                  />
                </Field>

                <Field label="Date/Time From" required error={errors.booking_date_from}>
                  <input
                    type="datetime-local"
                    value={data.booking_date_from}
                    onChange={(event) => setData('booking_date_from', event.target.value)}
                    className="ease-input"
                  />
                </Field>

                <Field label="Date/Time To" required error={errors.booking_date_to}>
                  <input
                    type="datetime-local"
                    value={data.booking_date_to}
                    onChange={(event) => setData('booking_date_to', event.target.value)}
                    className="ease-input"
                  />
                </Field>

                <Field label="Number of Guests" required error={errors.number_of_guests}>
                  <input
                    value={data.number_of_guests}
                    onChange={(event) => setData('number_of_guests', event.target.value)}
                    className="ease-input"
                    inputMode="numeric"
                    placeholder="0"
                  />
                </Field>

                {isStaffLike ? (
                  <Field label="Public Calendar Title" error={errors.public_calendar_title}>
                    <input
                      value={data.public_calendar_title}
                      onChange={(event) => setData('public_calendar_title', event.target.value)}
                      className="ease-input"
                      placeholder="Optional public title"
                    />
                  </Field>
                ) : null}
              </div>
            </SectionCard>

            {isStaffLike ? (
              <SectionCard
                icon={ShieldCheck}
                eyebrow="Backend Controls"
                title="Internal Status and Visibility"
                panelClass={theme.panelClass}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Booking Status" error={errors.booking_status}>
                    <select
                      value={data.booking_status}
                      onChange={(event) => setData('booking_status', event.target.value)}
                      className="ease-input"
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

                  <Field label="Payment Status" error={errors.payment_status}>
                    <select
                      value={data.payment_status}
                      onChange={(event) => setData('payment_status', event.target.value)}
                      className="ease-input"
                      disabled={isManager}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                      <option value="owing">Owing</option>
                    </select>
                  </Field>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={data.is_public_calendar_visible}
                      onChange={(event) =>
                        setData('is_public_calendar_visible', event.target.checked)
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span>
                      <span className="block text-sm font-black">
                        Show on public calendar
                      </span>
                      <span className="block text-xs opacity-60">
                        Only enable this when the booking can be visible to public visitors.
                      </span>
                    </span>
                  </label>
                </div>
              </SectionCard>
            ) : null}

            <div className="flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-xs font-black uppercase tracking-[0.22em] ${theme.textAccentClass}`}>
                  Ready to submit?
                </p>
                <p className="mt-2 text-sm leading-6 opacity-65">
                  {editing
                    ? 'Your changes will be saved into the current booking record.'
                    : 'Booking requests are reviewed before reservation confirmation.'}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link
                  href={backHref}
                  className={`inline-flex h-12 items-center justify-center rounded-full border px-6 text-sm font-black transition ${theme.subtleButtonClass}`}
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={processing}
                  className={`inline-flex h-12 items-center justify-center rounded-full border px-6 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${theme.buttonClass}`}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {processing ? 'Saving...' : copy.submit}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <section className={`rounded-[2rem] border p-5 ${theme.panelClass}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/10">
                  <Sparkles className="h-5 w-5 opacity-75" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] opacity-55">
                    Workspace Identity
                  </p>
                  <h3 className="text-xl font-black">
                    {role === 'admin'
                      ? 'Executive Backend'
                      : role === 'manager'
                        ? 'Review Backend'
                        : role === 'staff'
                          ? 'Operations Backend'
                          : 'Client Booking'}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 opacity-65">
                {isClient
                  ? 'This client view is designed like a premium reservation screen: visual selection first, form details second.'
                  : 'This backend view keeps the premium reservation style while adding internal workflow controls.'}
              </p>
            </section>

            {selectedVenue ? (
              <section className={`rounded-[2rem] border p-5 ${theme.panelClass}`}>
                <p className={`text-xs font-black uppercase tracking-[0.22em] ${theme.textAccentClass}`}>
                  {selectedVenue.category === 'package' ? 'Package Details' : 'Individual Details'}
                </p>

                <h3 className="mt-2 text-xl font-black">
                  {selectedVenue.category === 'package'
                    ? 'Included with Full Hall'
                    : selectedVenue.label}
                </h3>

                <div className="mt-4 grid gap-2">
                  {selectedVenue.includes.map((included) => (
                    <div
                      key={included}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                      <span className="text-sm font-bold opacity-75">{included}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {editing && booking ? (
              <section className={`rounded-[2rem] border p-5 ${theme.panelClass}`}>
                <p className={`text-xs font-black uppercase tracking-[0.22em] ${theme.textAccentClass}`}>
                  Current Record
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <BookingStatusBadge value={booking.booking_status} />
                    <BookingStatusBadge value={booking.payment_status} />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-45">
                      Current Schedule
                    </p>
                    <p className="mt-2 text-sm font-bold">
                      {formatDateTime(booking.booking_date_from)}
                    </p>
                    <p className="mt-1 text-xs opacity-50">
                      to {formatDateTime(booking.booking_date_to)}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
              <FileText className="mb-3 h-5 w-5" />
              <strong className="block">Reservation reminder</strong>
              A booking is only considered reserved after validation, survey proof, and payment compliance.
            </section>

            {isClient ? (
              <section className="rounded-[2rem] border border-emerald-300/25 bg-emerald-300/10 p-5 text-sm leading-6 text-emerald-100">
                <CheckCircle2 className="mb-3 h-5 w-5" />
                <strong className="block">Next step after submission</strong>
                Continue to the survey proof page, then submit payment proof from your booking details page.
              </section>
            ) : null}
          </aside>
        </div>
      </form>
    </BookingRolePageShell>
  );
}
