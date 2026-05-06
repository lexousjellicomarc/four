import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import {
  bookingShowPath,
  bookingSurveyPath,
  cleanLabel,
  formatDateTime,
  normalizeWorkspaceRole,
} from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { type FormEvent, useMemo } from 'react';

type BookingPayload = {
  id: number | string;
  type_of_event?: string | null;
  organization_type?: string | null;
  company_name?: string | null;
  client_name?: string | null;
  client_contact_number?: string | null;
  client_email?: string | null;
  client_address?: string | null;
  head_of_organization?: string | null;
  number_of_guests?: number | string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  booking_date_from?: string | null;
  booking_date_to?: string | null;
  items?: Array<{
    id?: number | string;
    service_name?: string | null;
    area?: string | null;
  }>;
};

type MiceRecordPayload = Record<string, any>;

type PageProps = {
  workspaceRole?: string;
  booking?: BookingPayload;
  miceRecord?: MiceRecordPayload | null;
  defaults?: MiceRecordPayload;
  formOptions?: {
    eventCategories?: string[];
    organizerTypes?: string[];
    enterpriseGroups?: string[];
  };
};

type MiceFormData = {
  year_recorded: string;
  enterprise_group: string;
  btc_group_code: string;

  event_name: string;
  event_category: string;
  type_of_event: string;
  venue_area: string;
  event_date_from: string;
  event_date_to: string;

  organization_name: string;
  organizer_name: string;
  organizer_type: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;

  local_male_participants: string;
  local_female_participants: string;
  domestic_male_participants: string;
  domestic_female_participants: string;
  foreign_male_participants: string;
  foreign_female_participants: string;

  main_origin_country: string;
  main_origin_province: string;
  main_origin_city: string;

  same_day_visitors: string;
  overnight_visitors: string;
  estimated_room_nights: string;
  estimated_tourism_receipts: string;

  total_employees: string;
  female_employees: string;
  male_employees: string;

  permit_to_engage: boolean;
  dot_accredited: boolean;
  active_member: boolean;

  remarks: string;
  certified: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function first(...values: unknown[]): string {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value);
    }
  }

  return '';
}

function dateOnly(value?: string | null): string {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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
    <label className="mice-survey-field">
      <span>
        {label}
        {required ? <strong>*</strong> : null}
      </span>

      {children}

      {error ? (
        <small>
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </small>
      ) : null}
    </label>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  icon: typeof FileSpreadsheet;
  tone?: 'default' | 'green' | 'gold' | 'red';
}) {
  return (
    <article className={cx('mice-survey-stat-card', `tone-${tone}`)}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>

      <Icon className="h-5 w-5" />
    </article>
  );
}

export function BookingSurveyPage() {
  const { props } = usePage<PageProps>();

  const role = normalizeWorkspaceRole(props.workspaceRole) as RoleThemeKey;
  const booking = props.booking;
  const record = props.miceRecord;
  const defaults = props.defaults || {};
  const options = props.formOptions || {};

  const eventCategories = options.eventCategories || [
    'Meeting',
    'Incentive',
    'Convention',
    'Exhibition',
    'Government',
    'Cultural',
    'Corporate',
    'Social',
    'Other',
  ];

  const organizerTypes = options.organizerTypes || [
    'Private',
    'Government',
    'NGO',
    'Academe',
    'Religious',
    'Corporate',
    'Association',
    'Other',
  ];

  const enterpriseGroups = options.enterpriseGroups || ['PTE', 'STE', 'UNCLASSIFIED'];

  const { data, setData, post, processing, errors } = useForm<MiceFormData>({
    year_recorded: first(record?.year_recorded, defaults.year_recorded, new Date().getFullYear()),
    enterprise_group: first(record?.enterprise_group, 'UNCLASSIFIED'),
    btc_group_code: first(record?.btc_group_code),

    event_name: first(record?.event_name, defaults.event_name),
    event_category: first(record?.event_category, defaults.event_category, 'Other'),
    type_of_event: first(record?.type_of_event, defaults.type_of_event),
    venue_area: first(record?.venue_area, defaults.venue_area),

    event_date_from: first(record?.event_date_from, defaults.event_date_from),
    event_date_to: first(record?.event_date_to, defaults.event_date_to),

    organization_name: first(record?.organization_name, defaults.organization_name),
    organizer_name: first(record?.organizer_name, defaults.organizer_name),
    organizer_type: first(record?.organizer_type, defaults.organizer_type, 'Private'),
    contact_person: first(record?.contact_person, defaults.contact_person),
    contact_number: first(record?.contact_number, defaults.contact_number),
    email: first(record?.email, defaults.email),
    address: first(record?.address, defaults.address),

    local_male_participants: first(record?.local_male_participants, 0),
    local_female_participants: first(record?.local_female_participants, defaults.total_participants || 0),
    domestic_male_participants: first(record?.domestic_male_participants, 0),
    domestic_female_participants: first(record?.domestic_female_participants, 0),
    foreign_male_participants: first(record?.foreign_male_participants, 0),
    foreign_female_participants: first(record?.foreign_female_participants, 0),

    main_origin_country: first(record?.main_origin_country, 'Philippines'),
    main_origin_province: first(record?.main_origin_province),
    main_origin_city: first(record?.main_origin_city),

    same_day_visitors: first(record?.same_day_visitors, 0),
    overnight_visitors: first(record?.overnight_visitors, 0),
    estimated_room_nights: first(record?.estimated_room_nights, 0),
    estimated_tourism_receipts: first(record?.estimated_tourism_receipts, 0),

    total_employees: first(record?.total_employees, 0),
    female_employees: first(record?.female_employees, 0),
    male_employees: first(record?.male_employees, 0),

    permit_to_engage: Boolean(record?.permit_to_engage ?? false),
    dot_accredited: Boolean(record?.dot_accredited ?? false),
    active_member: Boolean(record?.active_member ?? false),

    remarks: first(record?.remarks),
    certified: Boolean(record?.submitted_at),
  });

  const totalParticipants = useMemo(() => {
    return (
      numberValue(data.local_male_participants) +
      numberValue(data.local_female_participants) +
      numberValue(data.domestic_male_participants) +
      numberValue(data.domestic_female_participants) +
      numberValue(data.foreign_male_participants) +
      numberValue(data.foreign_female_participants)
    );
  }, [
    data.local_male_participants,
    data.local_female_participants,
    data.domestic_male_participants,
    data.domestic_female_participants,
    data.foreign_male_participants,
    data.foreign_female_participants,
  ]);

  const isSubmitted = Boolean(record?.submitted_at);

  function submit(event: FormEvent) {
    event.preventDefault();

    if (!booking?.id) return;

    post(bookingSurveyPath(role, booking.id), {
      preserveScroll: true,
    });
  }

  if (!booking) {
    return (
      <BookingRolePageShell
        role={role}
        title="MICE Report"
        description="Booking record could not be loaded."
      >
        <Link href="/my-bookings" className="booking-ghost-action">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </BookingRolePageShell>
    );
  }

  return (
    <BookingRolePageShell
      role={role}
      title="Required MICE Report"
      description={`${booking.type_of_event || 'Booking'} · ${booking.company_name || booking.client_name || 'Client'}`}
      actions={
        <Link href={bookingShowPath(role, booking.id)} className="booking-ghost-action">
          <ArrowLeft className="h-4 w-4" />
          Back to Booking
        </Link>
      }
    >
      <form onSubmit={submit} className="mice-survey-page">
        <section className="mice-survey-hero">
          <div>
            <p className="mice-survey-kicker">
              <Sparkles className="h-4 w-4" />
              Required booking report
            </p>

            <h2>Complete the MICE report for this booking.</h2>

            <span>
              This built-in report replaces the old external survey/proof upload flow. It is required for every booking request and will feed the MICE registry/reporting module.
            </span>

            <div className="mt-5 flex flex-wrap gap-2">
              <BookingStatusBadge value={booking.booking_status} />
              <BookingStatusBadge value={booking.payment_status} compact />
              <span className="mice-survey-chip">{formatDateTime(booking.booking_date_from)}</span>
              <span className="mice-survey-chip">{formatDateTime(booking.booking_date_to)}</span>
            </div>
          </div>

          <div className="mice-survey-status-card">
            <FileSpreadsheet className="h-10 w-10 text-[var(--bccc-backend-gold)]" />
            <p>MICE Status</p>
            <strong>{isSubmitted ? 'Submitted' : 'Required'}</strong>
            <span>
              {isSubmitted
                ? `Record No. ${record?.record_no || '—'} · ${record?.year_recorded || data.year_recorded}`
                : 'Submit this report before the booking can be treated as requirement-complete.'}
            </span>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Participants" value={totalParticipants} icon={Users} tone={totalParticipants > 0 ? 'green' : 'red'} />
          <StatCard label="Event Category" value={data.event_category || '—'} icon={BarChart3} />
          <StatCard label="Venue Area" value={data.venue_area || '—'} icon={MapPin} />
          <StatCard label="Report Year" value={data.year_recorded || '—'} icon={CalendarDays} />
        </div>

        <section className="mice-survey-panel">
          <header className="mice-survey-section-header">
            <div>
              <p>Event Information</p>
              <h3>Booking and MICE classification</h3>
            </div>
            <CalendarDays className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Report Year" required error={errors.year_recorded}>
              <input value={data.year_recorded} onChange={(e) => setData('year_recorded', e.target.value)} className="backend-booking-input" inputMode="numeric" />
            </Field>

            <Field label="Enterprise Group" error={errors.enterprise_group}>
              <select value={data.enterprise_group} onChange={(e) => setData('enterprise_group', e.target.value)} className="backend-booking-input">
                {enterpriseGroups.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="BTC Group Code" error={errors.btc_group_code}>
              <input value={data.btc_group_code} onChange={(e) => setData('btc_group_code', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="MICE Category" required error={errors.event_category}>
              <select value={data.event_category} onChange={(e) => setData('event_category', e.target.value)} className="backend-booking-input">
                {eventCategories.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Event Name" required error={errors.event_name}>
              <input value={data.event_name} onChange={(e) => setData('event_name', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Type of Event" required error={errors.type_of_event}>
              <input value={data.type_of_event} onChange={(e) => setData('type_of_event', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Venue Area" required error={errors.venue_area}>
              <input value={data.venue_area} onChange={(e) => setData('venue_area', e.target.value)} className="backend-booking-input" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event Date From" required error={errors.event_date_from}>
                <input type="date" value={dateOnly(data.event_date_from)} onChange={(e) => setData('event_date_from', e.target.value)} className="backend-booking-input" />
              </Field>

              <Field label="Event Date To" required error={errors.event_date_to}>
                <input type="date" value={dateOnly(data.event_date_to)} onChange={(e) => setData('event_date_to', e.target.value)} className="backend-booking-input" />
              </Field>
            </div>
          </div>
        </section>

        <section className="mice-survey-panel">
          <header className="mice-survey-section-header">
            <div>
              <p>Organizer Information</p>
              <h3>Organization and contact details</h3>
            </div>
            <Building2 className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Organization Name" required error={errors.organization_name}>
              <input value={data.organization_name} onChange={(e) => setData('organization_name', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Organizer Type" error={errors.organizer_type}>
              <select value={data.organizer_type} onChange={(e) => setData('organizer_type', e.target.value)} className="backend-booking-input">
                {organizerTypes.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>

            <Field label="Organizer / Head" error={errors.organizer_name}>
              <input value={data.organizer_name} onChange={(e) => setData('organizer_name', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Contact Person" required error={errors.contact_person}>
              <input value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Contact Number" error={errors.contact_number}>
              <input value={data.contact_number} onChange={(e) => setData('contact_number', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Email" error={errors.email}>
              <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="backend-booking-input" />
            </Field>

            <div className="lg:col-span-2">
              <Field label="Address" error={errors.address}>
                <textarea value={data.address} onChange={(e) => setData('address', e.target.value)} className="backend-booking-input min-h-24 py-3" />
              </Field>
            </div>
          </div>
        </section>

        <section className="mice-survey-panel">
          <header className="mice-survey-section-header">
            <div>
              <p>Participants</p>
              <h3>Visitor and attendance breakdown</h3>
            </div>
            <Users className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['Local Male', 'local_male_participants'],
              ['Local Female', 'local_female_participants'],
              ['Domestic Male', 'domestic_male_participants'],
              ['Domestic Female', 'domestic_female_participants'],
              ['Foreign Male', 'foreign_male_participants'],
              ['Foreign Female', 'foreign_female_participants'],
            ].map(([label, key]) => (
              <Field key={key} label={label} required error={(errors as Record<string, string>)[key]}>
                <input
                  value={(data as unknown as Record<string, string>)[key]}
                  onChange={(e) => setData(key as keyof MiceFormData, e.target.value as never)}
                  className="backend-booking-input"
                  inputMode="numeric"
                />
              </Field>
            ))}
          </div>

          {errors.total_participants ? (
            <div className="mice-survey-warning">
              <AlertTriangle className="h-5 w-5" />
              <span>{errors.total_participants}</span>
            </div>
          ) : null}
        </section>

        <section className="mice-survey-panel">
          <header className="mice-survey-section-header">
            <div>
              <p>Tourism Impact</p>
              <h3>Origin, nights, and estimated receipts</h3>
            </div>
            <ReceiptText className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
          </header>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Main Origin Country" error={errors.main_origin_country}>
              <input value={data.main_origin_country} onChange={(e) => setData('main_origin_country', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Main Origin Province" error={errors.main_origin_province}>
              <input value={data.main_origin_province} onChange={(e) => setData('main_origin_province', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Main Origin City" error={errors.main_origin_city}>
              <input value={data.main_origin_city} onChange={(e) => setData('main_origin_city', e.target.value)} className="backend-booking-input" />
            </Field>

            <Field label="Same-Day Visitors" error={errors.same_day_visitors}>
              <input value={data.same_day_visitors} onChange={(e) => setData('same_day_visitors', e.target.value)} className="backend-booking-input" inputMode="numeric" />
            </Field>

            <Field label="Overnight Visitors" error={errors.overnight_visitors}>
              <input value={data.overnight_visitors} onChange={(e) => setData('overnight_visitors', e.target.value)} className="backend-booking-input" inputMode="numeric" />
            </Field>

            <Field label="Estimated Room Nights" error={errors.estimated_room_nights}>
              <input value={data.estimated_room_nights} onChange={(e) => setData('estimated_room_nights', e.target.value)} className="backend-booking-input" inputMode="numeric" />
            </Field>

            <Field label="Estimated Tourism Receipts" error={errors.estimated_tourism_receipts}>
              <input value={data.estimated_tourism_receipts} onChange={(e) => setData('estimated_tourism_receipts', e.target.value)} className="backend-booking-input" inputMode="decimal" />
            </Field>
          </div>
        </section>

        <section className="mice-survey-panel">
          <header className="mice-survey-section-header">
            <div>
              <p>Enterprise Details</p>
              <h3>Employment and accreditation indicators</h3>
            </div>
            <ShieldCheck className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
          </header>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Total Employees" error={errors.total_employees}>
              <input value={data.total_employees} onChange={(e) => setData('total_employees', e.target.value)} className="backend-booking-input" inputMode="numeric" />
            </Field>

            <Field label="Female Employees" error={errors.female_employees}>
              <input value={data.female_employees} onChange={(e) => setData('female_employees', e.target.value)} className="backend-booking-input" inputMode="numeric" />
            </Field>

            <Field label="Male Employees" error={errors.male_employees}>
              <input value={data.male_employees} onChange={(e) => setData('male_employees', e.target.value)} className="backend-booking-input" inputMode="numeric" />
            </Field>
          </div>

          <div className="mice-survey-checkbox-grid">
            {[
              ['permit_to_engage', 'Permit to Engage'],
              ['dot_accredited', 'DOT Accredited'],
              ['active_member', 'Active Member'],
            ].map(([key, label]) => (
              <label key={key} className="mice-survey-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean((data as unknown as Record<string, boolean>)[key])}
                  onChange={(e) => setData(key as keyof MiceFormData, e.target.checked as never)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="mice-survey-panel">
          <header className="mice-survey-section-header">
            <div>
              <p>Certification</p>
              <h3>Final report confirmation</h3>
            </div>
            <CheckCircle2 className="h-7 w-7 text-[var(--bccc-backend-gold)]" />
          </header>

          <Field label="Remarks" error={errors.remarks}>
            <textarea value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} className="backend-booking-input min-h-28 py-3" />
          </Field>

          <label className={cx('mice-survey-certification', errors.certified && 'has-error')}>
            <input type="checkbox" checked={data.certified} onChange={(e) => setData('certified', e.target.checked)} />
            <span>
              <strong>I certify that the encoded MICE report information is accurate.</strong>
              <small>This report will be included in BCCC MICE registry/reporting records.</small>
            </span>
          </label>

          {errors.certified ? (
            <div className="mice-survey-warning">
              <AlertTriangle className="h-5 w-5" />
              <span>{errors.certified}</span>
            </div>
          ) : null}

          <footer className="mice-survey-submit-row">
            <div>
              <p>{isSubmitted ? 'Updating submitted MICE report' : 'Required before requirement completion'}</p>
              <span>
                {isSubmitted
                  ? `Current record: ${cleanLabel(record?.status || 'submitted')}`
                  : 'Submit this built-in MICE report for the booking request.'}
              </span>
            </div>

            <button type="submit" disabled={processing} className="booking-primary-action">
              {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Submit MICE Report
            </button>
          </footer>
        </section>
      </form>
    </BookingRolePageShell>
  );
}
