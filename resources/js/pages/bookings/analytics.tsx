import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import type { ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  Gauge,
  ShieldAlert,
  Wallet,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Bookings', href: '/bookings' },
  { title: 'Analytics', href: '/bookings/analytics' },
];

type Option = { id: number; name: string };
type Breakdown = { label: string; value: number };
type TrendPoint = { label: string; bookings: number; guests: number; confirmed_revenue: number };
type ServicePoint = { label: string; usage_count: number; revenue_total: number };
type WorkloadPoint = { label: string; bookings: number; guests: number };
type RiskBooking = {
  id: number;
  client_name: string;
  company_name: string;
  type_of_event: string;
  booking_status: string;
  payment_status: string;
  booking_date_from: string | null;
  booking_date_to: string | null;
  created_at: string | null;
  number_of_guests: number;
  items_total: number;
  submitted_total: number;
  confirmed_total: number;
  outstanding: number;
  policy: {
    state: string;
    label: string;
    half_required: number;
    half_paid_met: boolean;
    fully_paid_met: boolean;
    down_payment_due_at: string | null;
    full_payment_due_at: string | null;
    hours_since_created: number | null;
  };
};

type Props = {
  filters: {
    q?: string;
    booking_status?: string;
    payment_status?: string;
    service_id?: string;
    date_from?: string;
    date_to?: string;
  };
  services: Option[];
  summary: {
    total_bookings: number;
    total_guests: number;
    pending: number;
    active: number;
    confirmed: number;
    completed: number;
    cancelled_declined: number;
    submitted_revenue: number;
    confirmed_revenue: number;
    outstanding_balance: number;
    due_24h_soon: number;
    due_24h_overdue: number;
    due_48h_soon: number;
    due_48h_overdue: number;
    half_paid_met: number;
    fully_paid_met: number;
    automation_events_7d: number;
    auto_declined_7d: number;
    auto_deleted_7d: number;
  };
  statusBreakdown: Breakdown[];
  paymentBreakdown: Breakdown[];
  monthlyTrend: TrendPoint[];
  upcomingWorkload: WorkloadPoint[];
  topServices: ServicePoint[];
  highRiskBookings: RiskBooking[];
};

const PIE_COLORS = ['#2563eb', '#0f766e', '#d97706', '#dc2626', '#7c3aed', '#475569', '#0891b2'];

function money(value: number) {
  return `₱ ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dt(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function statusTone(value?: string) {
  const v = String(value || '').toLowerCase();
  if (v === 'pending') return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200';
  if (v === 'active' || v === 'confirmed') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200';
  if (v === 'completed') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200';
  if (v === 'declined' || v === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200';
  if (v === 'paid') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200';
  if (v === 'partial') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200';
  if (v === 'unpaid' || v === 'owing') return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200';
}

function policyTone(state?: string) {
  switch (state) {
    case '24h_overdue':
      return 'bg-red-600 text-white';
    case '48h_overdue':
      return 'bg-red-500 text-white';
    case '24h_soon':
      return 'bg-amber-500 text-black';
    case '48h_soon':
      return 'bg-yellow-400 text-black';
    default:
      return 'bg-emerald-600 text-white';
  }
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
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[1.6rem] border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
          {helper ? <div className="mt-2 text-sm text-muted-foreground">{helper}</div> : null}
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function BookingAnalytics({
  filters,
  services,
  summary,
  statusBreakdown,
  paymentBreakdown,
  monthlyTrend,
  upcomingWorkload,
  topServices,
  highRiskBookings,
}: Props) {
  const applyFilters = (formData: FormData) => {
    router.get(
      '/bookings/analytics',
      {
        q: String(formData.get('q') || ''),
        booking_status: String(formData.get('booking_status') || ''),
        payment_status: String(formData.get('payment_status') || ''),
        service_id: String(formData.get('service_id') || ''),
        date_from: String(formData.get('date_from') || ''),
        date_to: String(formData.get('date_to') || ''),
      },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  };

  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters || {}).filter(([, value]) => String(value || '').trim() !== ''),
    ) as Record<string, string>,
  ).toString();

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Booking Analytics" />

      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex rounded-full border bg-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Admin Analytics
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Booking analytics dashboard</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                This page gives you the faster admin view: status distribution, payment distribution, monthly trend,
                service demand, upcoming workload, and the bookings most at risk of violating the 24-hour / 48-hour payment rules.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/bookings" className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted">
                Back to bookings
              </Link>
              <a
                href={query ? `/bookings/analytics/export?${query}` : '/bookings/analytics/export'}
                className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </a>
              <a
                href={query ? `/bookings/analytics/print?${query}` : '/bookings/analytics/print'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <FileText className="mr-2 h-4 w-4" /> Printable report
              </a>
            </div>
          </div>

          <form
            className="mt-6 grid gap-3 lg:grid-cols-6"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters(new FormData(event.currentTarget));
            }}
          >
            <input name="q" defaultValue={filters.q || ''} placeholder="Search client, company, email, event" className="rounded-xl border bg-background px-3 py-2 text-sm" />

            <select name="booking_status" defaultValue={filters.booking_status || ''} className="rounded-xl border bg-background px-3 py-2 text-sm">
              <option value="">All booking statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select name="payment_status" defaultValue={filters.payment_status || ''} className="rounded-xl border bg-background px-3 py-2 text-sm">
              <option value="">All payment statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="owing">Owing</option>
            </select>

            <select name="service_id" defaultValue={filters.service_id || ''} className="rounded-xl border bg-background px-3 py-2 text-sm">
              <option value="">All services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>

            <input name="date_from" type="date" defaultValue={filters.date_from || ''} className="rounded-xl border bg-background px-3 py-2 text-sm" />
            <input name="date_to" type="date" defaultValue={filters.date_to || ''} className="rounded-xl border bg-background px-3 py-2 text-sm" />

            <div className="lg:col-span-6 flex flex-wrap gap-2">
              <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Apply filters</button>
              <Link href="/bookings/analytics" className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted">Reset</Link>
            </div>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Filtered bookings" value={summary.total_bookings} helper={`${summary.total_guests} total guests`} icon={Gauge} />
          <StatCard title="Confirmed revenue" value={money(summary.confirmed_revenue)} helper={`Submitted: ${money(summary.submitted_revenue)}`} icon={CircleDollarSign} />
          <StatCard title="Outstanding balance" value={money(summary.outstanding_balance)} helper={`${summary.half_paid_met} reached 50% threshold`} icon={Wallet} />
          <StatCard title="Automation (7d)" value={summary.automation_events_7d} helper={`${summary.auto_declined_7d} auto-declined • ${summary.auto_deleted_7d} auto-deleted`} icon={Activity} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="24H due soon" value={summary.due_24h_soon} helper="Down payment nearing deadline" icon={AlertTriangle} />
          <StatCard title="24H overdue" value={summary.due_24h_overdue} helper="50% not yet reached" icon={ShieldAlert} />
          <StatCard title="48H due soon" value={summary.due_48h_soon} helper="Full payment nearing deadline" icon={CalendarDays} />
          <StatCard title="48H overdue" value={summary.due_48h_overdue} helper={`${summary.fully_paid_met} already fully paid`} icon={ShieldAlert} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.8rem] border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Trend</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Monthly booking and revenue trend</h2>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="bookings" name="Bookings" stroke="#2563eb" strokeWidth={2.5} />
                  <Line yAxisId="left" type="monotone" dataKey="guests" name="Guests" stroke="#0f766e" strokeWidth={2.5} />
                  <Line yAxisId="right" type="monotone" dataKey="confirmed_revenue" name="Confirmed Revenue" stroke="#d97706" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[1.8rem] border bg-card p-5 shadow-sm">
              <div className="mb-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status Mix</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Booking status distribution</h2>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Bookings" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[1.8rem] border bg-card p-5 shadow-sm">
              <div className="mb-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment Mix</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Payment status distribution</h2>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={paymentBreakdown} dataKey="value" nameKey="label" outerRadius={88} innerRadius={42} paddingAngle={4}>
                      {paymentBreakdown.map((entry, index) => (
                        <Cell key={`${entry.label}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.8rem] border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Service Demand</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Top-used services</h2>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical" margin={{ left: 24, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usage_count" name="Usage Count" fill="#0f766e" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="revenue_total" name="Revenue" fill="#d97706" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[1.8rem] border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Upcoming Load</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Next 30 days workload</h2>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={upcomingWorkload}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" name="Bookings" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="guests" name="Guests" fill="#0891b2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Policy Watch</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Bookings that need quick admin attention</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This list prioritizes bookings that are close to or past the 24-hour / 48-hour payment policy deadlines.
              </p>
            </div>
            <Link href="/bookings/audit" className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted">
              Open lifecycle audit
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="px-3">Booking</th>
                  <th className="px-3">Schedule</th>
                  <th className="px-3">Statuses</th>
                  <th className="px-3">Amounts</th>
                  <th className="px-3">Policy</th>
                  <th className="px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {highRiskBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                      No high-risk bookings matched the current filters.
                    </td>
                  </tr>
                ) : (
                  highRiskBookings.map((booking) => (
                    <tr key={booking.id} className="rounded-2xl border bg-background/70">
                      <td className="rounded-l-2xl border-y border-l px-3 py-4 align-top">
                        <div className="font-semibold">{booking.company_name || booking.client_name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{booking.client_name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{booking.type_of_event || '—'}</div>
                        <div className="mt-2 text-xs text-muted-foreground">Created: {dt(booking.created_at)}</div>
                      </td>
                      <td className="border-y px-3 py-4 align-top text-sm">
                        <div>{dt(booking.booking_date_from)}</div>
                        <div className="mt-1 text-muted-foreground">to {dt(booking.booking_date_to)}</div>
                        <div className="mt-2 text-muted-foreground">Guests: {booking.number_of_guests}</div>
                      </td>
                      <td className="border-y px-3 py-4 align-top">
                        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(booking.booking_status)}`}>
                          {booking.booking_status || 'unknown'}
                        </div>
                        <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(booking.payment_status)}`}>
                          {booking.payment_status || 'unknown'}
                        </div>
                      </td>
                      <td className="border-y px-3 py-4 align-top text-sm">
                        <div>Total: {money(booking.items_total)}</div>
                        <div className="mt-1 text-muted-foreground">Submitted: {money(booking.submitted_total)}</div>
                        <div className="mt-1 text-muted-foreground">Confirmed: {money(booking.confirmed_total)}</div>
                        <div className="mt-2 font-semibold text-red-600">Outstanding: {money(booking.outstanding)}</div>
                      </td>
                      <td className="border-y px-3 py-4 align-top text-sm">
                        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${policyTone(booking.policy.state)}`}>
                          {booking.policy.label}
                        </div>
                        <div className="mt-2 text-muted-foreground">50% target: {money(booking.policy.half_required)}</div>
                        <div className="mt-1 text-muted-foreground">24H: {dt(booking.policy.down_payment_due_at)}</div>
                        <div className="mt-1 text-muted-foreground">48H: {dt(booking.policy.full_payment_due_at)}</div>
                      </td>
                      <td className="rounded-r-2xl border-y border-r px-3 py-4 text-right align-top">
                        <Link href={`/bookings/${booking.id}`} className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                          Open booking
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
