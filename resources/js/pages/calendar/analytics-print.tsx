import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

type Props = {
  filters: {
    start_date: string;
    end_date: string;
  };
  generated_at: string;
  summary: Record<string, number | string>;
  block_usage: Array<{ block: string; count: number }>;
  block_status_mix: Array<{ status: string; count: number }>;
  weekday_usage: Array<{ weekday: string; count: number }>;
  area_usage: Array<{ area: string; bookings: number; calendar_blocks: number; public_events: number; total: number }>;
  busiest_dates: Array<{ date: string; occupied_blocks: number; bookings: number; calendar_blocks: number; public_events: number; total_activity: number }>;
};

function prettyLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function CalendarAnalyticsPrintPage(props: Props) {
  useEffect(() => {
    document.title = `Calendar Analytics ${props.filters.start_date} to ${props.filters.end_date}`;
  }, [props.filters.start_date, props.filters.end_date]);

  return (
    <>
      <Head title="Calendar Analytics Print" />
      <div className="min-h-screen bg-white px-6 py-8 text-black print:px-0 print:py-0">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Calendar Analytics Report</div>
              <h1 className="mt-2 text-3xl font-semibold">Venue utilization and schedule activity</h1>
              <div className="mt-2 text-sm text-slate-600">
                {props.filters.start_date} to {props.filters.end_date}
              </div>
              <div className="mt-1 text-sm text-slate-500">Generated at {new Date(props.generated_at).toLocaleString()}</div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Print
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Object.entries(props.summary).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{prettyLabel(key)}</div>
                <div className="mt-2 text-2xl font-semibold">{String(value)}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">AM / PM / EVE Usage</h2>
              <div className="mt-3 space-y-2 text-sm">
                {props.block_usage.map((row) => (
                  <div key={row.block} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <span>{row.block}</span>
                    <span className="font-semibold">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Calendar Block Status Mix</h2>
              <div className="mt-3 space-y-2 text-sm">
                {props.block_status_mix.map((row) => (
                  <div key={row.status} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <span>{prettyLabel(row.status)}</span>
                    <span className="font-semibold">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Weekday Utilization</h2>
              <div className="mt-3 space-y-2 text-sm">
                {props.weekday_usage.map((row) => (
                  <div key={row.weekday} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <span>{row.weekday}</span>
                    <span className="font-semibold">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Busiest Dates</h2>
              <div className="mt-3 space-y-2 text-sm">
                {props.busiest_dates.map((row) => (
                  <div key={row.date} className="rounded-xl bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{row.date}</span>
                      <span className="font-semibold">{row.total_activity}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Blocks {row.occupied_blocks} • Bookings {row.bookings} • Admin blocks {row.calendar_blocks} • Public events {row.public_events}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="text-lg font-semibold">Area / Venue Utilization</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left">Area / Venue</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Bookings</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Calendar Blocks</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Public Events</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {props.area_usage.map((row) => (
                    <tr key={row.area}>
                      <td className="border border-slate-200 px-3 py-2">{row.area}</td>
                      <td className="border border-slate-200 px-3 py-2">{row.bookings}</td>
                      <td className="border border-slate-200 px-3 py-2">{row.calendar_blocks}</td>
                      <td className="border border-slate-200 px-3 py-2">{row.public_events}</td>
                      <td className="border border-slate-200 px-3 py-2 font-semibold">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
