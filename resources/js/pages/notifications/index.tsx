
import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage, Link } from '@inertiajs/react';
import {
  Bell,
  Calendar,
  CreditCard,
  RefreshCw,
  Info,
  CheckCheck,
  Search,
  Package,
  Users,
  CalendarOff,
  Bot,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OpsPageHeader from '@/components/ui/ops-page-header';
import OpsKpiCard from '@/components/ui/ops-kpi-card';
import OpsStatusChip from '@/components/ui/ops-status-chip';
import OpsEmptyState from '@/components/ui/ops-empty-state';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Notifications', href: '/notifications' }];

type NotificationRow = {
  id: number;
  type: string | null;
  title: string;
  message: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string | null;
  is_unread?: boolean;
};

interface LaravelPaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

type SharedSummary = {
  unread_count: number;
  latest: NotificationRow[];
  automation_unread_count?: number;
};

type NotificationFeed = {
  data: NotificationRow[];
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: LaravelPaginationLink[];
    to?: number | null;
    total?: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
};

type NotificationStats = {
  all: number;
  unread: number;
  automation: number;
  automation_unread: number;
  bookings: number;
  payments: number;
  calendar: number;
  services: number;
  users: number;
};

type NotificationFilters = {
  q: string;
  status: 'all' | 'unread' | 'read';
  kind: 'all' | 'automation' | 'bookings' | 'payments' | 'calendar' | 'services' | 'users' | 'system';
};

type PageProps = {
  notifications: SharedSummary;
  notificationFeed: NotificationFeed;
  notificationFilters?: NotificationFilters;
  notificationStats?: NotificationStats;
  automationLatest?: { data?: NotificationRow[] } | NotificationRow[];
};

function formatRelativeTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString();
}

function normalizeLabel(label: any): string {
  const raw = String(label ?? '');
  return raw.replace(/&laquo;|&raquo;/g, '').replace(/<[^>]*>/g, '').trim();
}

function getNotificationKind(type: string | null) {
  const value = String(type ?? '').toLowerCase();

  if (value === 'booking_lifecycle_maintenance' || value.startsWith('booking_auto_')) {
    return 'automation';
  }
  if (value.startsWith('payment')) return 'payments';
  if (value.startsWith('calendar_block')) return 'calendar';
  if (value.startsWith('service_') || value.startsWith('service_type_')) return 'services';
  if (value.startsWith('user_') || value.includes('roles')) return 'users';
  if (value.startsWith('booking')) return 'bookings';

  return 'system';
}

function NotificationIcon({ type }: { type: string | null }) {
  const kind = getNotificationKind(type);

  if (kind === 'automation') return <Bot className="h-4 w-4 text-violet-600" />;
  if (kind === 'bookings') return <Calendar className="h-4 w-4 text-emerald-600" />;
  if (kind === 'payments') return <CreditCard className="h-4 w-4 text-blue-600" />;
  if (kind === 'calendar') return <CalendarOff className="h-4 w-4 text-rose-600" />;
  if (kind === 'users') return <Users className="h-4 w-4 text-cyan-700" />;
  if (kind === 'services') return <Package className="h-4 w-4 text-indigo-600" />;

  return <Info className="h-4 w-4 text-slate-500" />;
}

function kindTone(kind: string) {
  if (kind === 'automation') return 'violet';
  if (kind === 'bookings') return 'emerald';
  if (kind === 'payments') return 'sky';
  if (kind === 'calendar') return 'rose';
  if (kind === 'services') return 'indigo';
  if (kind === 'users') return 'sky';
  return 'slate';
}

function prettyKind(kind: string) {
  if (kind === 'automation') return 'Automation';
  if (kind === 'bookings') return 'Bookings';
  if (kind === 'payments') return 'Payments';
  if (kind === 'calendar') return 'Calendar';
  if (kind === 'services') return 'Services';
  if (kind === 'users') return 'Users';
  return 'System';
}

export default function NotificationsIndex() {
  const pageProps = usePage<PageProps>().props;

  const summaryFromProps = pageProps.notifications;
  const feedFromProps = pageProps.notificationFeed;
  const stats = pageProps.notificationStats;
  const filtersFromProps = pageProps.notificationFilters ?? {
    q: '',
    status: 'all',
    kind: 'all',
  };

  const automationLatest = Array.isArray(pageProps.automationLatest)
    ? pageProps.automationLatest
    : pageProps.automationLatest?.data ?? [];

  const [unreadCount, setUnreadCount] = useState<number>(summaryFromProps?.unread_count ?? 0);
  const [rows, setRows] = useState<NotificationRow[]>(feedFromProps?.data ?? []);
  const [query, setQuery] = useState<string>(filtersFromProps.q ?? '');
  const [status, setStatus] = useState<'all' | 'unread' | 'read'>(filtersFromProps.status ?? 'all');
  const [kind, setKind] = useState<NotificationFilters['kind']>(filtersFromProps.kind ?? 'all');

  useEffect(() => {
    setUnreadCount(summaryFromProps?.unread_count ?? 0);
  }, [summaryFromProps?.unread_count]);

  useEffect(() => {
    setRows(feedFromProps?.data ?? []);
  }, [feedFromProps?.data]);

  useEffect(() => {
    setQuery(filtersFromProps.q ?? '');
    setStatus(filtersFromProps.status ?? 'all');
    setKind(filtersFromProps.kind ?? 'all');
  }, [filtersFromProps.q, filtersFromProps.status, filtersFromProps.kind]);

  const handleOpen = (n: NotificationRow) => {
    router.visit(`/notifications/${n.id}/open`, { preserveScroll: true });
  };

  const applyFilters = () => {
    router.get(
      '/notifications',
      {
        q: query || undefined,
        status: status !== 'all' ? status : undefined,
        kind: kind !== 'all' ? kind : undefined,
      },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const resetFilters = () => {
    setQuery('');
    setStatus('all');
    setKind('all');
    router.get('/notifications', {}, { preserveState: true, preserveScroll: true, replace: true });
  };

  const metricCards = [
    { label: 'Unread', value: stats?.unread ?? unreadCount ?? 0, icon: Bell, tone: 'amber' as const },
    { label: 'Automation', value: stats?.automation ?? 0, icon: Bot, tone: 'violet' as const },
    { label: 'Automation unread', value: stats?.automation_unread ?? 0, icon: Sparkles, tone: 'violet' as const },
    { label: 'Bookings', value: stats?.bookings ?? 0, icon: Calendar, tone: 'emerald' as const },
    { label: 'Payments', value: stats?.payments ?? 0, icon: CreditCard, tone: 'sky' as const },
    { label: 'Calendar', value: stats?.calendar ?? 0, icon: CalendarOff, tone: 'red' as const },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notifications" />

      <div className="space-y-6 p-4 md:p-6">
        <OpsPageHeader
          eyebrow="Notification Center"
          title="Automation alerts, bookings, payments, and system activity in one place."
          description="This view now matches the other operations pages so staff can scan unread counts, filter by category, and jump straight into the important events."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.post('/notifications/read-all', {}, { preserveScroll: true })}
              >
                <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
              </Button>
              <Button type="button" variant="outline" onClick={applyFilters}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button asChild>
                <Link href="/bookings/operations">Operations center</Link>
              </Button>
            </>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metricCards.map((metric) => (
            <OpsKpiCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} tone={metric.tone} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="grid gap-2 lg:grid-cols-[1.3fr_0.6fr_0.6fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, message, automation reason" />
                </div>

                <select className="rounded-md border bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="all">All read states</option>
                  <option value="unread">Unread only</option>
                  <option value="read">Read only</option>
                </select>

                <select className="rounded-md border bg-background px-3 py-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value as any)}>
                  <option value="all">All kinds</option>
                  <option value="automation">Automation</option>
                  <option value="bookings">Bookings</option>
                  <option value="payments">Payments</option>
                  <option value="calendar">Calendar</option>
                  <option value="services">Services</option>
                  <option value="users">Users</option>
                  <option value="system">System</option>
                </select>

                <div className="flex gap-2">
                  <Button onClick={applyFilters}>Apply</Button>
                  <Button variant="outline" onClick={resetFilters}>Reset</Button>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Notification feed</h2>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    Open any row to mark it read and follow the linked action.
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {rows.length === 0 ? (
                  <OpsEmptyState title="No notifications matched the current filter set" />
                ) : (
                  rows.map((notification) => {
                    const kindValue = getNotificationKind(notification.type);
                    const unread = typeof notification.is_unread === 'boolean' ? notification.is_unread : !notification.read_at;

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleOpen(notification)}
                        className="w-full rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                <NotificationIcon type={notification.type} />
                                {notification.title}
                              </div>
                              <OpsStatusChip label={prettyKind(kindValue)} tone={kindTone(kindValue)} />
                              {unread ? <OpsStatusChip label="Unread" tone="amber" /> : <OpsStatusChip label="Read" tone="slate" />}
                            </div>

                            {notification.message ? (
                              <div className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {notification.message}
                              </div>
                            ) : null}

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span>{formatRelativeTime(notification.created_at)}</span>
                              {notification.created_at ? <span>{new Date(notification.created_at).toLocaleString()}</span> : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                            Open <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {feedFromProps?.meta?.links?.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {feedFromProps.meta.links.map((link, index) => (
                    <button
                      key={`${link.label}-${index}`}
                      type="button"
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true, replace: true })}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${link.active ? 'bg-primary text-primary-foreground' : 'bg-background'} ${!link.url ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      {normalizeLabel(link.label)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Latest automation activity</h2>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    The newest lifecycle and system automation events.
                  </div>
                </div>
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>

              <div className="mt-5 space-y-4">
                {automationLatest.length === 0 ? (
                  <OpsEmptyState title="No recent automation events found" />
                ) : (
                  automationLatest.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpen(item)}
                      className="w-full rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-violet-600" />
                            <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                          </div>
                          {item.message ? (
                            <div className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                              {item.message}
                            </div>
                          ) : null}
                          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {formatRelativeTime(item.created_at)}
                          </div>
                        </div>
                        <OpsStatusChip label="Automation" tone="violet" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Unread summary</h2>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Unread notifications</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{unreadCount}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Automation unread</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stats?.automation_unread ?? 0}</div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Latest fetched</div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {summaryFromProps?.latest?.[0]?.created_at ? new Date(summaryFromProps.latest[0].created_at as string).toLocaleString() : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
