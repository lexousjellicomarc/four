import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  Users2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type RegistryRow = {
  id: number;
  booking_id: number | null;
  btc_group_code: string;
  record_no: number | null;
  establishment_name: string;
  business_type: string;
  seats_unit: string;
  total_employees: number;
  year_recorded: number | null;
  region: string;
  province_huc: string;
  city_municipality: string;
  month_added: string;
  female_employees: number;
  male_employees: number;
  classification: string;
  enterprise_group: string;
  permit_to_engage: boolean;
  dot_accredited: boolean;
  active_member: boolean;
  remarks: string;
  created_at: string | null;
  booking_summary: string;
};

type BreakdownRow = {
  label: string;
  count: number;
  permit_to_engage_count: number;
  dot_accredited_count: number;
  active_member_count: number;
};

type Props = {
  filters: {
    q?: string;
    year_recorded?: string;
    enterprise_group?: string;
    btc_group_code?: string;
    classification?: string;
    city_municipality?: string;
    active_member?: string;
    dot_accredited?: string;
  };
  summary: {
    total_records: number;
    total_permit_to_engage: number;
    total_dot_accredited: number;
    total_active_members: number;
    total_employees: number;
    total_female_employees: number;
    total_male_employees: number;
    pte_records: number;
    ste_records: number;
  };
  enterprise_breakdown: BreakdownRow[];
  group_breakdown: BreakdownRow[];
  year_options: number[];
  rows: RegistryRow[];
  can_manage?: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Reports', href: '/reports/mice-registry' },
  { title: 'MICE Registry', href: '/reports/mice-registry' },
];

function boolLabel(value: boolean) {
  return value ? 'Yes' : 'No';
}

function dt(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function queryString(filters: Props['filters']) {
  const params = new URLSearchParams();

  Object.entries(filters || {}).forEach(([key, value]) => {
    const normalized = String(value ?? '').trim();
    if (normalized !== '') {
      params.set(key, normalized);
    }
  });

  const built = params.toString();
  return built ? `?${built}` : '';
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  helper?: string;
  icon: typeof Building2;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
          {helper ? <div className="mt-2 text-sm text-muted-foreground">{helper}</div> : null}
        </div>

        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge
      className={
        active
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-100 dark:bg-white/10 dark:text-slate-300'
      }
    >
      {label}: {boolLabel(active)}
    </Badge>
  );
}

export default function MiceRegistryPage({
  filters,
  summary,
  enterprise_breakdown,
  group_breakdown,
  year_options,
  rows,
  can_manage = false,
}: Props) {
  const [query, setQuery] = useState(filters.q || '');
  const exportQuery = useMemo(() => queryString(filters), [filters]);

  const applyFilters = (formData: FormData) => {
    router.get(
      '/reports/mice-registry',
      {
        q: String(formData.get('q') || ''),
        year_recorded: String(formData.get('year_recorded') || ''),
        enterprise_group: String(formData.get('enterprise_group') || ''),
        btc_group_code: String(formData.get('btc_group_code') || ''),
        classification: String(formData.get('classification') || ''),
        city_municipality: String(formData.get('city_municipality') || ''),
        active_member: String(formData.get('active_member') || ''),
        dot_accredited: String(formData.get('dot_accredited') || ''),
      },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  };

  const handleDelete = (id: number, label: string) => {
    const confirmed = window.confirm(`Delete MICE registry entry for "${label}"?`);
    if (!confirmed) return;

    router.delete(`/reports/mice-registry/${id}`, {
      preserveScroll: true,
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="MICE Registry" />

      <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#0f8b6d] dark:border-[#7aa6ff]/20 dark:bg-[#16212b] dark:text-[#9dc0ff]">
              Backend workspace report
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight">Connected registry, survey, and booking workflow</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              This report belongs to the backend workspace. Use it together with the booking dashboard, inquiries page,
              and calendar management pages so staff can keep survey records and operational data in the same session.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-muted">
              Booking Dashboard
            </Link>
            <Link href="/calendar/manage" className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-muted">
              Manage Calendar
            </Link>
            <Link href="/admin/inquiries" className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-muted">
              Inquiries
            </Link>
            <Link href="/admin/guidelines-contacts" className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-muted">
              Backend Guidelines
            </Link>
          </div>
        </div>
      </div>

        <Card className="shadow-sm">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="inline-flex rounded-full border bg-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                  MICE Survey & Registry
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  Enterprise registry report and built-in survey index
                </h1>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
                  This page now behaves like the master registry view. It keeps the grouped summary on top and the
                  detailed record table below, while the create and edit pages handle the built-in survey / entry form.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {can_manage ? (
                  <Button asChild>
                    <Link href="/reports/mice-registry/create">
                      <Plus className="mr-2 h-4 w-4" />
                      New MICE survey entry
                    </Link>
                  </Button>
                ) : null}

                <Button variant="outline" asChild>
                  <a href={`/reports/mice-registry/export${exportQuery}`}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </a>
                </Button>

                <Button variant="outline" asChild>
                  <a href={`/reports/mice-registry/print${exportQuery}`} target="_blank" rel="noreferrer">
                    <Printer className="mr-2 h-4 w-4" />
                    Print view
                  </a>
                </Button>
              </div>
            </div>

            <form
              className="grid gap-3 lg:grid-cols-4 xl:grid-cols-8"
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters(new FormData(event.currentTarget));
              }}
            >
              <div className="relative lg:col-span-2 xl:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search establishment, type, city, booking"
                  className="pl-9"
                />
              </div>

              <select name="year_recorded" defaultValue={filters.year_recorded || ''} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">All years</option>
                {year_options.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select name="enterprise_group" defaultValue={filters.enterprise_group || ''} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">All enterprise groups</option>
                <option value="PTE">PTE</option>
                <option value="STE">STE</option>
                <option value="UNCLASSIFIED">Unclassified</option>
              </select>

              <select name="btc_group_code" defaultValue={filters.btc_group_code || ''} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">All BTC groups</option>
                {['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9'].map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              <Input name="classification" defaultValue={filters.classification || ''} placeholder="Classification" />
              <Input name="city_municipality" defaultValue={filters.city_municipality || ''} placeholder="City / Municipality" />

              <select name="active_member" defaultValue={filters.active_member || ''} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Any active member</option>
                <option value="1">Active only</option>
                <option value="0">Inactive only</option>
              </select>

              <select name="dot_accredited" defaultValue={filters.dot_accredited || ''} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Any DOT status</option>
                <option value="1">DOT accredited</option>
                <option value="0">Not accredited</option>
              </select>

              <div className="lg:col-span-4 xl:col-span-8 flex flex-wrap gap-2">
                <Button type="submit">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Apply filters
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/reports/mice-registry">Reset</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Records" value={summary.total_records} helper="Registry entries in current filter" icon={Building2} />
          <StatCard title="Active Members" value={summary.total_active_members} helper="Active BTC / enterprise members" icon={Users2} />
          <StatCard title="DOT Accredited" value={summary.total_dot_accredited} helper="Entries marked as DOT accredited" icon={FileSpreadsheet} />
          <StatCard title="Employees" value={summary.total_employees} helper={`${summary.total_female_employees} female • ${summary.total_male_employees} male`} icon={Users2} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Enterprise group summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Group</th>
                      <th className="px-4 py-3 text-right font-semibold">Records</th>
                      <th className="px-4 py-3 text-right font-semibold">Permit</th>
                      <th className="px-4 py-3 text-right font-semibold">DOT</th>
                      <th className="px-4 py-3 text-right font-semibold">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enterprise_breakdown.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No enterprise summary rows yet.
                        </td>
                      </tr>
                    ) : (
                      enterprise_breakdown.map((row) => (
                        <tr key={row.label} className="border-t">
                          <td className="px-4 py-3 font-semibold">{row.label}</td>
                          <td className="px-4 py-3 text-right">{row.count}</td>
                          <td className="px-4 py-3 text-right">{row.permit_to_engage_count}</td>
                          <td className="px-4 py-3 text-right">{row.dot_accredited_count}</td>
                          <td className="px-4 py-3 text-right">{row.active_member_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>BTC group summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Code</th>
                      <th className="px-4 py-3 text-right font-semibold">Records</th>
                      <th className="px-4 py-3 text-right font-semibold">Permit</th>
                      <th className="px-4 py-3 text-right font-semibold">DOT</th>
                      <th className="px-4 py-3 text-right font-semibold">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group_breakdown.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No BTC group rows yet.
                        </td>
                      </tr>
                    ) : (
                      group_breakdown.map((row) => (
                        <tr key={row.label} className="border-t">
                          <td className="px-4 py-3 font-semibold">{row.label}</td>
                          <td className="px-4 py-3 text-right">{row.count}</td>
                          <td className="px-4 py-3 text-right">{row.permit_to_engage_count}</td>
                          <td className="px-4 py-3 text-right">{row.dot_accredited_count}</td>
                          <td className="px-4 py-3 text-right">{row.active_member_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Detailed registry table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-[1680px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                    <th className="px-4 py-3 text-left font-semibold">BTC / No</th>
                    <th className="px-4 py-3 text-left font-semibold">Establishment</th>
                    <th className="px-4 py-3 text-left font-semibold">Type / Seats</th>
                    <th className="px-4 py-3 text-left font-semibold">Year / Month</th>
                    <th className="px-4 py-3 text-left font-semibold">Location</th>
                    <th className="px-4 py-3 text-right font-semibold">Employees</th>
                    <th className="px-4 py-3 text-left font-semibold">Classification</th>
                    <th className="px-4 py-3 text-left font-semibold">Flags</th>
                    <th className="px-4 py-3 text-left font-semibold">Linked Booking</th>
                    <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                    <th className="px-4 py-3 text-left font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                        No registry entries matched the current filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-t align-top">
                        <td className="px-4 py-4">
                          {can_manage ? (
                            <div className="flex flex-col gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/reports/mice-registry/${row.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-500/10"
                                onClick={() => handleDelete(row.id, row.establishment_name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold">{row.btc_group_code || '—'}</div>
                          <div className="mt-1 text-muted-foreground">No. {row.record_no ?? '—'}</div>
                          <div className="mt-2">
                            <Badge variant="secondary">{row.enterprise_group || 'UNCLASSIFIED'}</Badge>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold">{row.establishment_name}</div>
                        </td>

                        <td className="px-4 py-4">
                          <div>{row.business_type || '—'}</div>
                          <div className="mt-1 text-muted-foreground">Seats / Unit: {row.seats_unit || '—'}</div>
                        </td>

                        <td className="px-4 py-4">
                          <div>{row.year_recorded || '—'}</div>
                          <div className="mt-1 text-muted-foreground">{row.month_added || '—'}</div>
                        </td>

                        <td className="px-4 py-4">
                          <div>{row.region || '—'}</div>
                          <div className="mt-1 text-muted-foreground">{row.province_huc || '—'}</div>
                          <div className="mt-1 text-muted-foreground">{row.city_municipality || '—'}</div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="font-semibold">{row.total_employees}</div>
                          <div className="mt-1 text-muted-foreground">F: {row.female_employees} • M: {row.male_employees}</div>
                        </td>

                        <td className="px-4 py-4">{row.classification || '—'}</td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <StatusBadge active={row.permit_to_engage} label="Permit" />
                            <StatusBadge active={row.dot_accredited} label="DOT" />
                            <StatusBadge active={row.active_member} label="Active" />
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {row.booking_id ? (
                            <div>
                              <div className="font-semibold">#{row.booking_id}</div>
                              <div className="mt-1 text-muted-foreground">{row.booking_summary || 'Linked booking'}</div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[240px] whitespace-pre-wrap text-muted-foreground">
                            {row.remarks || '—'}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-muted-foreground">{dt(row.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
