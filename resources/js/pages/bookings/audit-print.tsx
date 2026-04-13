import { Head, Link } from '@inertiajs/react';

type AuditEvent = {
  id: number;
  booking_id: number | null;
  booking_exists: boolean;
  event_key: string;
  title: string;
  from_status?: string | null;
  to_status?: string | null;
  from_payment_status?: string | null;
  to_payment_status?: string | null;
  reason?: string | null;
  meta?: Record<string, unknown> | null;
  event_at?: string | null;
  created_at?: string | null;
  actor?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type Props = {
  events: AuditEvent[];
  filters: {
    q?: string;
    event_key?: string;
    status?: string;
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    booking_id?: string;
    only_deleted?: boolean;
  };
  stats: {
    total: number;
    status_changes: number;
    payment_changes: number;
    auto_deleted: number;
    today: number;
    unique_bookings: number;
  };
  generatedAt: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function activeFilters(filters: Props['filters']) {
  return Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== false)
    .map(([key, value]) => `${key}: ${value === true ? 'Yes' : String(value)}`);
}

export default function BookingAuditPrintPage({ events, filters, stats, generatedAt }: Props) {
  const chips = activeFilters(filters);

  return (
    <>
      <Head title="Booking Audit Print Report" />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-slate-900">
        <div className="no-print sticky top-0 z-10 border-b bg-white/95 backdrop-blur px-6 py-4">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Printable report</div>
              <div className="mt-1 text-lg font-semibold">Booking Lifecycle Audit</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Print now
              </button>
              <Link href="/bookings/audit" className="rounded-full border px-4 py-2 text-sm font-semibold">
                Back to audit page
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-[2rem] border border-slate-200 p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">BCCC EASE</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Booking Lifecycle Audit Report</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  This printable report summarizes booking lifecycle events, status transitions, payment transitions, and automation actions based on the current audit filter set.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
                <div><span className="font-semibold">Generated:</span> {formatDateTime(generatedAt)}</div>
                <div className="mt-1"><span className="font-semibold">Rows in report:</span> {events.length}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {[
                ['Visible events', stats.total],
                ['Status changes', stats.status_changes],
                ['Payment changes', stats.payment_changes],
                ['Auto-deleted', stats.auto_deleted],
                ['Today', stats.today],
                ['Unique bookings', stats.unique_bookings],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</div>
                  <div className="mt-2 text-2xl font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Applied filters</div>
              {chips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <div key={chip} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium">
                      {chip}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-600">No filters applied. This report includes the latest visible audit events.</div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {events.map((event) => (
              <div key={event.id} className="rounded-[1.6rem] border border-slate-200 p-5 break-inside-avoid">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xl font-semibold">{event.title}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Audit #{event.id}
                      {event.booking_id ? ` • Booking #${event.booking_id}` : ''}
                      {' • '}
                      {formatDateTime(event.event_at ?? event.created_at)}
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <div><span className="font-semibold">Actor:</span> {event.actor?.name || 'System automation'}</div>
                    <div><span className="font-semibold">Email:</span> {event.actor?.email || 'Console / scheduled maintenance'}</div>
                  </div>
                </div>

                {event.reason ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                    {event.reason}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Event key</div>
                    <div className="mt-2 font-medium">{event.event_key}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Booking status</div>
                    <div className="mt-2">{event.from_status || '—'} → {event.to_status || '—'}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Payment status</div>
                    <div className="mt-2">{event.from_payment_status || '—'} → {event.to_payment_status || '—'}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Booking record</div>
                    <div className="mt-2">{event.booking_exists ? 'Still exists' : 'No longer in bookings table'}</div>
                  </div>
                </div>

                {event.meta && Object.keys(event.meta).length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Meta</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(event.meta).map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                          <span className="font-semibold">{key}:</span> {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
