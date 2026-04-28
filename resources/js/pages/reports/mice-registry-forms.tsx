import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { FormEvent, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type MiceRecord = {
  id?: number;
  booking_id?: number | null;
  btc_group_code?: string | null;
  record_no?: number | string | null;
  establishment_name?: string | null;
  business_type?: string | null;
  seats_unit?: string | null;
  total_employees?: number | string | null;
  year_recorded?: number | string | null;
  region?: string | null;
  province_huc?: string | null;
  city_municipality?: string | null;
  month_added?: string | null;
  female_employees?: number | string | null;
  male_employees?: number | string | null;
  classification?: string | null;
  enterprise_group?: string | null;
  permit_to_engage?: boolean | number | string | null;
  dot_accredited?: boolean | number | string | null;
  active_member?: boolean | number | string | null;
  remarks?: string | null;
};

type PageProps = {
  record?: MiceRecord | null;
  miceRecord?: MiceRecord | null;
};

type FormData = {
  booking_id: string;
  btc_group_code: string;
  record_no: string;
  establishment_name: string;
  business_type: string;
  seats_unit: string;
  total_employees: string;
  year_recorded: string;
  region: string;
  province_huc: string;
  city_municipality: string;
  month_added: string;
  female_employees: string;
  male_employees: string;
  classification: string;
  enterprise_group: string;
  permit_to_engage: boolean;
  dot_accredited: boolean;
  active_member: boolean;
  remarks: string;
};

function boolValue(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'yes';
}

function textValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function baseRegistryPath(): string {
  if (typeof window === 'undefined') {
    return '/reports/mice-registry';
  }

  const path = window.location.pathname;

  if (path.startsWith('/admin/')) {
    return '/admin/reports/mice-registry';
  }

  if (path.startsWith('/manager/')) {
    return '/manager/reports/mice-registry';
  }

  return '/reports/mice-registry';
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border"
      />
      <span>{label}</span>
    </label>
  );
}

export default function MiceRegistryForm() {
  const page = usePage<PageProps>();
  const record = page.props.record ?? page.props.miceRecord ?? null;
  const basePath = baseRegistryPath();

  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { title: 'Reports', href: basePath },
      { title: 'MICE Registry', href: basePath },
      {
        title: record?.id ? 'Edit Record' : 'Create Record',
        href: record?.id ? `${basePath}/${record.id}/edit` : `${basePath}/create`,
      },
    ],
    [basePath, record?.id],
  );

  const { data, setData, post, put, processing, errors } = useForm<FormData>({
    booking_id: textValue(record?.booking_id),
    btc_group_code: textValue(record?.btc_group_code),
    record_no: textValue(record?.record_no),
    establishment_name: textValue(record?.establishment_name),
    business_type: textValue(record?.business_type),
    seats_unit: textValue(record?.seats_unit),
    total_employees: textValue(record?.total_employees),
    year_recorded: textValue(record?.year_recorded ?? new Date().getFullYear()),
    region: textValue(record?.region ?? 'CAR'),
    province_huc: textValue(record?.province_huc ?? 'Benguet'),
    city_municipality: textValue(record?.city_municipality ?? 'Baguio City'),
    month_added: textValue(record?.month_added),
    female_employees: textValue(record?.female_employees),
    male_employees: textValue(record?.male_employees),
    classification: textValue(record?.classification),
    enterprise_group: textValue(record?.enterprise_group),
    permit_to_engage: boolValue(record?.permit_to_engage),
    dot_accredited: boolValue(record?.dot_accredited),
    active_member: boolValue(record?.active_member),
    remarks: textValue(record?.remarks),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (record?.id) {
      put(`${basePath}/${record.id}`, {
        preserveScroll: true,
      });

      return;
    }

    post(basePath, {
      preserveScroll: true,
    });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={record?.id ? 'Edit MICE Registry Record' : 'Create MICE Registry Record'} />

      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
              <Building2 className="h-3.5 w-3.5" />
              MICE Registry
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {record?.id ? 'Edit registry record' : 'Create registry record'}
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Encode the establishment, classification, employment, accreditation, and reporting
                details used for the MICE registry.
              </p>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href={basePath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to registry
            </Link>
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Business / Establishment Details</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Booking ID" error={errors.booking_id}>
                <Input
                  value={data.booking_id}
                  onChange={(event) => setData('booking_id', event.target.value)}
                  placeholder="Optional booking reference"
                />
              </Field>

              <Field label="BTC Group Code" error={errors.btc_group_code}>
                <Input
                  value={data.btc_group_code}
                  onChange={(event) => setData('btc_group_code', event.target.value)}
                  placeholder="Example: BCCC-MICE"
                />
              </Field>

              <Field label="Record No." error={errors.record_no}>
                <Input
                  value={data.record_no}
                  onChange={(event) => setData('record_no', event.target.value)}
                  placeholder="Record number"
                />
              </Field>

              <Field label="Year Recorded" error={errors.year_recorded}>
                <Input
                  value={data.year_recorded}
                  onChange={(event) => setData('year_recorded', event.target.value)}
                  placeholder="2026"
                />
              </Field>

              <Field label="Establishment Name" error={errors.establishment_name}>
                <Input
                  value={data.establishment_name}
                  onChange={(event) => setData('establishment_name', event.target.value)}
                  placeholder="Company / organization / establishment"
                />
              </Field>

              <Field label="Business Type" error={errors.business_type}>
                <Input
                  value={data.business_type}
                  onChange={(event) => setData('business_type', event.target.value)}
                  placeholder="Convention, event, association, tourism, etc."
                />
              </Field>

              <Field label="Classification" error={errors.classification}>
                <Input
                  value={data.classification}
                  onChange={(event) => setData('classification', event.target.value)}
                  placeholder="Primary / secondary classification"
                />
              </Field>

              <Field label="Enterprise Group" error={errors.enterprise_group}>
                <Input
                  value={data.enterprise_group}
                  onChange={(event) => setData('enterprise_group', event.target.value)}
                  placeholder="PTE, STE, association, etc."
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Location and Employment</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Region" error={errors.region}>
                <Input
                  value={data.region}
                  onChange={(event) => setData('region', event.target.value)}
                  placeholder="CAR"
                />
              </Field>

              <Field label="Province / HUC" error={errors.province_huc}>
                <Input
                  value={data.province_huc}
                  onChange={(event) => setData('province_huc', event.target.value)}
                  placeholder="Benguet"
                />
              </Field>

              <Field label="City / Municipality" error={errors.city_municipality}>
                <Input
                  value={data.city_municipality}
                  onChange={(event) => setData('city_municipality', event.target.value)}
                  placeholder="Baguio City"
                />
              </Field>

              <Field label="Month Added" error={errors.month_added}>
                <Input
                  value={data.month_added}
                  onChange={(event) => setData('month_added', event.target.value)}
                  placeholder="January, February, March..."
                />
              </Field>

              <Field label="Seats / Unit" error={errors.seats_unit}>
                <Input
                  value={data.seats_unit}
                  onChange={(event) => setData('seats_unit', event.target.value)}
                  placeholder="Seats, booth, office, unit count"
                />
              </Field>

              <Field label="Total Employees" error={errors.total_employees}>
                <Input
                  value={data.total_employees}
                  onChange={(event) => setData('total_employees', event.target.value)}
                  placeholder="Total number"
                />
              </Field>

              <Field label="Female Employees" error={errors.female_employees}>
                <Input
                  value={data.female_employees}
                  onChange={(event) => setData('female_employees', event.target.value)}
                  placeholder="Female employees"
                />
              </Field>

              <Field label="Male Employees" error={errors.male_employees}>
                <Input
                  value={data.male_employees}
                  onChange={(event) => setData('male_employees', event.target.value)}
                  placeholder="Male employees"
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Compliance and Accreditation</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <CheckField
                  label="Permit to Engage"
                  checked={data.permit_to_engage}
                  onChange={(checked) => setData('permit_to_engage', checked)}
                />

                <CheckField
                  label="DOT Accredited"
                  checked={data.dot_accredited}
                  onChange={(checked) => setData('dot_accredited', checked)}
                />

                <CheckField
                  label="Active Member"
                  checked={data.active_member}
                  onChange={(checked) => setData('active_member', checked)}
                />
              </div>

              <Field label="Remarks" error={errors.remarks}>
                <textarea
                  value={data.remarks}
                  onChange={(event) => setData('remarks', event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Notes, verification details, survey observations, or internal remarks"
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href={basePath}>Cancel</Link>
            </Button>

            <Button type="submit" disabled={processing}>
              <Save className="mr-2 h-4 w-4" />
              {processing ? 'Saving...' : record?.id ? 'Update Record' : 'Save Record'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
