import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Download, Printer, TrendingUp } from 'lucide-react';

type MetricRow = { [key: string]: any };

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
  date_series: Array<{ date: string; occupied_blocks: number; bookings: number; calendar_blocks: number; public_events: number; total_activity: number }>;
  upcoming_window: Array<{ date: string; occupied_blocks: number; bookings: number; calendar_blocks: number; public_events: number; total_activity: number }>;
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Calendar Analytics', href: '/calendar/analytics' },
];

function formatNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString();
}

function prettyLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function maxValue(rows: MetricRow[], key: string) {
  return Math.max(1, ...rows.map((row) => Number(row[key] ?? 0)));
}

function MiniBars({ rows, labelKey, valueKey, tone = 'bg-sky-600' }: { rows: MetricRow[]; labelKey: string; valueKey: string; tone?: string }) {
  const max = maxValue(rows, valueKey);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const value = Number(row[valueKey] ?? 0);
        const width = `${Math.max(5, (value / max) * 100)}%`;

        return (
          <div key={`${row[labelKey]}-${index}`} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="font-medium text-slate-700 dark:text-slate-200">{String(row[labelKey])}</div>
              <div className="text-slate-500 dark:text-slate-300">{formatNumber(value)}</div>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-2.5 rounded-full ${tone}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DateSeriesBars({ rows }: { rows: Props['date_series'] }) {
  const subset = rows.slice(-31);
  const max = Math.max(1, ...subset.map((row) => Number(row.total_activity ?? 0)));

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[780px] items-end gap-2">
        {subset.map((row) => {
          const h = `${Math.max(10, (Number(row.total_activity ?? 0) / max) * 180)}px`;
          return (
            <div key={row.date} className="flex w-6 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-emerald-600/85"
                style={{ height: h }}
                title={`${row.date} • total ${row.total_activity} • blocks ${row.occupied_blocks} • public events ${row.public_events}`}
              />
              <div className="-rotate-45 text-[10px] text-slate-500 dark:text-slate-400">{row.date.slice(5)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildExportHref(filters: Props['filters']) {
  const qs = new URLSearchParams({
    start_date: filters.start_date,
    end_date: filters.end_date,
  });

  return `/calendar/analytics/export?${qs.toString()}`;
}

function buildPrintHref(filters: Props['filters']) {
  const qs = new URLSearchParams({
    start_date: filters.start_date,
    end_date: filters.end_date,
  });

  return `/calendar/analytics/print?${qs.toString()}`;
}

export default function CalendarAnalyticsPage(props: Props) {
  const [startDate, setStartDate] = useState(props.filters.start_date ?? '');
  const [endDate, setEndDate] = useState(props.filters.end_date ?? '');

  const summaryCards = useMemo(() => {
    return [
      { label: 'Bookings in Range', value: props.summary.bookings_in_range, tone: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-200' },
      { label: 'Occupied Block Days', value: props.summary.occupied_block_days, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200' },
      { label: 'Public Events', value: props.summary.public_events_in_range, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-200' },
      { label: 'Calendar Blocks', value: props.summary.calendar_blocks_in_range, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200' },
      { label: 'Guest Volume', value: props.summary.booked_guest_volume, tone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200' },
      { label: 'Peak Daily Activity', value: props.summary.peak_daily_activity, tone: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
    ];
  }, [props.summary]);

  const applyFilters = () => {
    router.get('/calendar/analytics', {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Calendar Analytics" />

      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                <CalendarDays className="h-3.5 w-3.5" /> Calendar Analytics
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Venue utilization and AM / PM / EVE activity dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                This view combines bookings, admin calendar blocks, and public events so you can see busiest dates, most used areas, and block-level utilization in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <a href={buildExportHref(props.filters)}>
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={buildPrintHref(props.filters)} target="_blank" rel="noreferrer">
                  <Printer className="mr-2 h-4 w-4" /> Print Report
                </a>
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  <TrendingUp className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Start date</div>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">End date</div>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button onClick={applyFilters}>Apply Range</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  router.get('/calendar/analytics', {}, { preserveState: true, preserveScroll: true, replace: true });
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className={`rounded-[1.6rem] border p-5 ${card.tone}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{card.label}</div>
              <div className="mt-2 text-3xl font-semibold">{formatNumber(card.value)}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Last 31 days of activity inside the selected range</CardTitle>
            </CardHeader>
            <CardContent>
              <DateSeriesBars rows={props.date_series} />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>AM / PM / EVE usage</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBars rows={props.block_usage} labelKey="block" valueKey="count" tone="bg-blue-600" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[2rem] xl:col-span-1">
            <CardHeader>
              <CardTitle>Calendar block status mix</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBars rows={props.block_status_mix.map((row) => ({ ...row, status: prettyLabel(row.status) }))} labelKey="status" valueKey="count" tone="bg-violet-600" />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] xl:col-span-1">
            <CardHeader>
              <CardTitle>Weekday utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBars rows={props.weekday_usage} labelKey="weekday" valueKey="count" tone="bg-emerald-600" />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] xl:col-span-1">
            <CardHeader>
              <CardTitle>Upcoming 30-day workload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {props.upcoming_window.slice(0, 10).map((row) => (
                  <div key={row.date} className="rounded-2xl border border-black/5 p-4 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{row.date}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-300">{formatNumber(row.total_activity)} total</div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div>Blocks: {row.occupied_blocks}</div>
                      <div>Bookings: {row.bookings}</div>
                      <div>Admin blocks: {row.calendar_blocks}</div>
                      <div>Public: {row.public_events}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Top utilized areas / venues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/5 text-left dark:border-white/10">
                      <th className="px-3 py-3 font-semibold">Area / Venue</th>
                      <th className="px-3 py-3 font-semibold">Bookings</th>
                      <th className="px-3 py-3 font-semibold">Calendar Blocks</th>
                      <th className="px-3 py-3 font-semibold">Public Events</th>
                      <th className="px-3 py-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.area_usage.map((row) => (
                      <tr key={row.area} className="border-b border-black/5 dark:border-white/10">
                        <td className="px-3 py-3">{row.area}</td>
                        <td className="px-3 py-3">{formatNumber(row.bookings)}</td>
                        <td className="px-3 py-3">{formatNumber(row.calendar_blocks)}</td>
                        <td className="px-3 py-3">{formatNumber(row.public_events)}</td>
                        <td className="px-3 py-3 font-semibold">{formatNumber(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Busiest dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {props.busiest_dates.map((row) => (
                  <div key={row.date} className="rounded-2xl border border-black/5 p-4 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{row.date}</div>
                      <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">{formatNumber(row.total_activity)} total activity</div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-4">
                      <div>Occupied blocks: {formatNumber(row.occupied_blocks)}</div>
                      <div>Bookings: {formatNumber(row.bookings)}</div>
                      <div>Calendar blocks: {formatNumber(row.calendar_blocks)}</div>
                      <div>Public events: {formatNumber(row.public_events)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Generated at: {new Date(props.generated_at).toLocaleString()}
        </div>
      </div>
    </AppLayout>
  );
}
