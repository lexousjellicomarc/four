import { Head } from '@inertiajs/react';

type Breakdown = { label: string; value: number };
type TrendPoint = { label: string; bookings: number; guests: number; confirmed_revenue: number };
type ServicePoint = { label: string; usage_count: number; revenue_total: number };
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
    down_payment_due_at: string | null;
    full_payment_due_at: string | null;
  };
};

type Props = {
  generatedAt: string;
  filters: Record<string, string>;
  summary: Record<string, number>;
  statusBreakdown: Breakdown[];
  paymentBreakdown: Breakdown[];
  monthlyTrend: TrendPoint[];
  topServices: ServicePoint[];
  highRiskBookings: RiskBooking[];
};

function money(value: number) {
  return `₱ ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dt(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function niceKey(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function BookingAnalyticsPrint({
  generatedAt,
  filters,
  summary,
  statusBreakdown,
  paymentBreakdown,
  monthlyTrend,
  topServices,
  highRiskBookings,
}: Props) {
  return (
    <>
      <Head title="Booking Analytics Print" />
      <div className="min-h-screen bg-white text-slate-900 print:bg-white">
        <div className="mx-auto max-w-7xl p-6 print:max-w-none print:p-4">
          <div className="mb-6 flex items-start justify-between gap-4 border-b pb-4 print:mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">BCCC EASE</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Booking Analytics Report</h1>
              <p className="mt-2 text-sm text-slate-600">Generated at: {dt(generatedAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border px-4 py-2 text-sm font-medium print:hidden"
            >
              Print now
            </button>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:mb-4">
            <div className="rounded-2xl border p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Filtered bookings</div>
              <div className="mt-2 text-2xl font-semibold">{summary.total_bookings ?? 0}</div>
              <div className="mt-2 text-sm text-slate-600">Guests: {summary.total_guests ?? 0}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Confirmed revenue</div>
              <div className="mt-2 text-2xl font-semibold">{money(summary.confirmed_revenue ?? 0)}</div>
              <div className="mt-2 text-sm text-slate-600">Submitted: {money(summary.submitted_revenue ?? 0)}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Outstanding</div>
              <div className="mt-2 text-2xl font-semibold">{money(summary.outstanding_balance ?? 0)}</div>
              <div className="mt-2 text-sm text-slate-600">50% met: {summary.half_paid_met ?? 0}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Automation (7d)</div>
              <div className="mt-2 text-2xl font-semibold">{summary.automation_events_7d ?? 0}</div>
              <div className="mt-2 text-sm text-slate-600">Declined: {summary.auto_declined_7d ?? 0} • Deleted: {summary.auto_deleted_7d ?? 0}</div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border p-4 print:mb-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Applied Filters</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.keys(filters || {}).length === 0 ? (
                <div className="text-sm text-slate-600">No filters applied.</div>
              ) : (
                Object.entries(filters).map(([key, value]) => (
                  <div key={key} className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">
                    <strong>{niceKey(key)}:</strong> {String(value || '—')}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 print:gap-4">
            <div className="rounded-2xl border p-4">
              <h2 className="text-lg font-semibold">Booking Status Distribution</h2>
              <div className="mt-3 overflow-hidden rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusBreakdown.map((row) => (
                      <tr key={row.label} className="border-t">
                        <td className="px-3 py-2">{row.label}</td>
                        <td className="px-3 py-2 text-right">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <h2 className="text-lg font-semibold">Payment Status Distribution</h2>
              <div className="mt-3 overflow-hidden rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentBreakdown.map((row) => (
                      <tr key={row.label} className="border-t">
                        <td className="px-3 py-2">{row.label}</td>
                        <td className="px-3 py-2 text-right">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2 print:mt-4 print:gap-4">
            <div className="rounded-2xl border p-4">
              <h2 className="text-lg font-semibold">Monthly Trend</h2>
              <div className="mt-3 overflow-hidden rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Month</th>
                      <th className="px-3 py-2 text-right">Bookings</th>
                      <th className="px-3 py-2 text-right">Guests</th>
                      <th className="px-3 py-2 text-right">Confirmed Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTrend.map((row) => (
                      <tr key={row.label} className="border-t">
                        <td className="px-3 py-2">{row.label}</td>
                        <td className="px-3 py-2 text-right">{row.bookings}</td>
                        <td className="px-3 py-2 text-right">{row.guests}</td>
                        <td className="px-3 py-2 text-right">{money(row.confirmed_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <h2 className="text-lg font-semibold">Top Services</h2>
              <div className="mt-3 overflow-hidden rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Service</th>
                      <th className="px-3 py-2 text-right">Usage</th>
                      <th className="px-3 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topServices.map((row) => (
                      <tr key={row.label} className="border-t">
                        <td className="px-3 py-2">{row.label}</td>
                        <td className="px-3 py-2 text-right">{row.usage_count}</td>
                        <td className="px-3 py-2 text-right">{money(row.revenue_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border p-4 print:mt-4">
            <h2 className="text-lg font-semibold">High-Risk Bookings</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Booking</th>
                    <th className="px-3 py-2 text-left">Schedule</th>
                    <th className="px-3 py-2 text-left">Statuses</th>
                    <th className="px-3 py-2 text-right">Totals</th>
                    <th className="px-3 py-2 text-left">Policy</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">No high-risk bookings for the current filters.</td>
                    </tr>
                  ) : (
                    highRiskBookings.map((row) => (
                      <tr key={row.id} className="border-t align-top">
                        <td className="px-3 py-3">
                          <div className="font-semibold">{row.company_name || row.client_name}</div>
                          <div className="mt-1 text-slate-600">{row.client_name}</div>
                          <div className="mt-1 text-slate-600">{row.type_of_event || '—'}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div>{dt(row.booking_date_from)}</div>
                          <div className="mt-1 text-slate-600">to {dt(row.booking_date_to)}</div>
                          <div className="mt-1 text-slate-600">Created: {dt(row.created_at)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div>{row.booking_status}</div>
                          <div className="mt-1 text-slate-600">{row.payment_status}</div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div>Total: {money(row.items_total)}</div>
                          <div className="mt-1 text-slate-600">Submitted: {money(row.submitted_total)}</div>
                          <div className="mt-1 text-slate-600">Confirmed: {money(row.confirmed_total)}</div>
                          <div className="mt-1 font-semibold text-red-700">Outstanding: {money(row.outstanding)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-semibold">{row.policy.label}</div>
                          <div className="mt-1 text-slate-600">50% target: {money(row.policy.half_required)}</div>
                          <div className="mt-1 text-slate-600">24H: {dt(row.policy.down_payment_due_at)}</div>
                          <div className="mt-1 text-slate-600">48H: {dt(row.policy.full_payment_due_at)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
