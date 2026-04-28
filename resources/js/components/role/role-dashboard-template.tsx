import { RoleActionCard } from '@/components/role/role-action-card';
import { RoleKpiCard } from '@/components/role/role-kpi-card';
import { RoleWorkspaceShell } from '@/components/role/role-workspace-shell';
import { getRoleWorkspace, type RoleKey } from '@/lib/role-workspaces';
import type { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  FileBarChart,
  Inbox,
  LayoutDashboard,
  Users,
} from 'lucide-react';

type WorkspaceStats = {
  pending?: number;
  confirmed?: number;
  active?: number;
  completed?: number;
  cancelled?: number;
  declined?: number;
  total_bookings?: number;
  today_bookings?: number;
  month_bookings?: number;
  month_blocks?: number;
  month_public_events?: number;
};

type RecentBooking = {
  id: number | string;
  client_name?: string;
  company_name?: string;
  type_of_event?: string;
  booking_status?: string;
  booking_date_from?: string;
  booking_date_to?: string;
};

type TodayScheduleItem = {
  id: number | string;
  title: string;
  status: string;
  time: string;
};

type WorkspaceSummary = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

type RoleDashboardTemplateProps = {
  role: RoleKey;
  workspaceStats?: WorkspaceStats;
  recentBookings?: RecentBooking[];
  todaySchedule?: TodayScheduleItem[];
  workspaceSummary?: WorkspaceSummary;
};

const roleBreadcrumbs: Record<RoleKey, BreadcrumbItem[]> = {
  admin: [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Dashboard', href: '/admin/dashboard' },
  ],
  manager: [
    { title: 'Manager', href: '/manager/dashboard' },
    { title: 'Dashboard', href: '/manager/dashboard' },
  ],
  staff: [
    { title: 'Staff', href: '/staff/dashboard' },
    { title: 'Dashboard', href: '/staff/dashboard' },
  ],
  user: [
    { title: 'Account', href: '/my-bookings' },
    { title: 'Dashboard', href: '/my-bookings' },
  ],
};

const roleTitles: Record<RoleKey, WorkspaceSummary> = {
  admin: {
    eyebrow: 'Executive Control Center',
    title: 'Administrator Dashboard',
    description:
      'Full command workspace for content publishing, booking operations, payment compliance, MICE reporting, venue setup, and account governance.',
  },
  manager: {
    eyebrow: 'Review and Approval Workspace',
    title: 'Manager Dashboard',
    description:
      'A focused management view for booking review, payment monitoring, reporting, calendar activity, and operational decisions.',
  },
  staff: {
    eyebrow: 'Daily Operations Desk',
    title: 'Staff Dashboard',
    description:
      'A fast operational workspace for client assistance, schedule checking, booking support, and inquiry follow-ups.',
  },
  user: {
    eyebrow: 'Client Booking Portal',
    title: 'My Booking Dashboard',
    description:
      'A simple client workspace for starting an event request, checking submitted bookings, and returning to the public BCCC website.',
  },
};

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusLabel(status?: string) {
  return String(status || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status?: string) {
  const normalized = String(status || '').toLowerCase();

  if (['confirmed', 'approved', 'active', 'completed'].includes(normalized)) {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  }

  if (['pending', 'pencil_booked', 'for_review'].includes(normalized)) {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
  }

  if (['cancelled', 'declined', 'failed'].includes(normalized)) {
    return 'border-red-500/20 bg-red-500/10 text-red-200';
  }

  return 'border-slate-500/20 bg-slate-500/10 text-slate-200';
}

function getPrimaryActions(role: RoleKey) {
  if (role === 'admin') {
    return [
      {
        title: 'Public Website Content',
        description: 'Edit homepage sections, events, facilities, tourism office, contact, and guidelines.',
        href: '/admin/content',
        icon: Building2,
      },
      {
        title: 'Booking Calendar',
        description: 'Open the full venue calendar with bookings, public events, and blocked dates.',
        href: '/admin/calendar',
        icon: CalendarDays,
      },
      {
        title: 'Payment Review',
        description: 'Check payment compliance, settlement progress, and payment actions.',
        href: '/admin/payments/review',
        icon: CreditCard,
      },
      {
        title: 'Users & Roles',
        description: 'Manage admin, manager, staff, and user access levels.',
        href: '/admin/users',
        icon: Users,
      },
    ];
  }

  if (role === 'manager') {
    return [
      {
        title: 'Review Bookings',
        description: 'Open bookings that need review, updates, or approval decisions.',
        href: '/manager/bookings',
        icon: ClipboardList,
      },
      {
        title: 'Calendar Monitoring',
        description: 'Review venue use, calendar conflicts, and reserved schedules.',
        href: '/manager/calendar',
        icon: CalendarDays,
      },
      {
        title: 'Payment Review',
        description: 'Check payment compliance and remaining settlement actions.',
        href: '/manager/payments/review',
        icon: CreditCard,
      },
      {
        title: 'MICE Registry',
        description: 'View registry data and reporting outputs.',
        href: '/manager/reports/mice-registry',
        icon: FileBarChart,
      },
    ];
  }

  if (role === 'staff') {
    return [
      {
        title: 'Today’s Calendar',
        description: 'Open the operational calendar and check today’s venue use.',
        href: '/staff/calendar',
        icon: CalendarDays,
      },
      {
        title: 'Assist Booking',
        description: 'Create or update a booking request for client assistance.',
        href: '/staff/bookings/create',
        icon: ClipboardList,
      },
      {
        title: 'Booking Records',
        description: 'Search, review, and update booking information.',
        href: '/staff/bookings',
        icon: CheckCircle2,
      },
      {
        title: 'Inquiries',
        description: 'Review and follow up with public inquiries.',
        href: '/staff/inquiries',
        icon: Inbox,
      },
    ];
  }

  return [
    {
      title: 'Book Event',
      description: 'Start a new event booking request.',
      href: '/book',
      icon: CalendarDays,
    },
    {
      title: 'My Bookings',
      description: 'View submitted booking requests.',
      href: '/my-bookings',
      icon: ClipboardList,
    },
    {
      title: 'Public Website',
      description: 'Return to the public BCCC website.',
      href: '/',
      icon: Building2,
    },
  ];
}

export function RoleDashboardTemplate({
  role,
  workspaceStats = {},
  recentBookings = [],
  todaySchedule = [],
  workspaceSummary = {},
}: RoleDashboardTemplateProps) {
  const workspace = getRoleWorkspace(role);
  const summary = {
    ...roleTitles[role],
    ...workspaceSummary,
  };

  const primaryActions = getPrimaryActions(role);

  const pending = numberValue(workspaceStats.pending);
  const confirmed = numberValue(workspaceStats.confirmed);
  const active = numberValue(workspaceStats.active);
  const completed = numberValue(workspaceStats.completed);
  const monthBookings = numberValue(workspaceStats.month_bookings);
  const todayBookings = numberValue(workspaceStats.today_bookings);
  const monthBlocks = numberValue(workspaceStats.month_blocks);
  const totalBookings = numberValue(workspaceStats.total_bookings);

  return (
    <RoleWorkspaceShell
      role={role}
      title={summary.title || workspace.label}
      eyebrow={summary.eyebrow || workspace.badge}
      description={summary.description || workspace.description}
      breadcrumbs={roleBreadcrumbs[role]}
      actions={
        <>
          <Link
            href={workspace.homeHref}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Role Home
          </Link>

          {role !== 'user' ? (
            <Link
              href={`/${role}/calendar`}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </Link>
          ) : (
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Book Event
            </Link>
          )}
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RoleKpiCard
          tone={role}
          title="Pending"
          value={pending}
          description="Bookings or requests needing attention."
          icon={Clock3}
        />

        <RoleKpiCard
          tone={role}
          title="Confirmed"
          value={confirmed}
          description="Approved and reserved booking records."
          icon={CheckCircle2}
        />

        <RoleKpiCard
          tone={role}
          title="Today"
          value={todayBookings}
          description="Bookings active for today’s schedule."
          icon={CalendarDays}
        />

        <RoleKpiCard
          tone={role}
          title="This Month"
          value={monthBookings}
          description="Booking records touching the current month."
          icon={BarChart3}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {primaryActions.map((action) => (
              <RoleActionCard
                key={action.href}
                tone={role}
                title={action.title}
                description={action.description}
                href={action.href}
                icon={action.icon}
              />
            ))}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-60">
                  Recent Booking Activity
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  Latest records
                </h2>
              </div>

              <Link
                href={role === 'user' ? '/my-bookings' : `/${role}/bookings`}
                className="text-sm font-bold opacity-75 transition hover:opacity-100"
              >
                View all
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              {recentBookings.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="grid gap-3 bg-black/[0.08] p-4 transition hover:bg-white/[0.06] md:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {booking.type_of_event || 'Event Booking'}
                        </p>
                        <p className="mt-1 truncate text-sm opacity-70">
                          {booking.company_name || booking.client_name || 'Client'}
                        </p>
                        <p className="mt-1 text-xs opacity-50">
                          {booking.booking_date_from || 'No date'} → {booking.booking_date_to || 'No end date'}
                        </p>
                      </div>

                      <div className="flex items-start justify-start md:justify-end">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(booking.booking_status)}`}>
                          {statusLabel(booking.booking_status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-black/[0.08] p-6 text-sm opacity-70">
                  No recent booking records found yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-60">
              Workspace Summary
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-50">
                  Total
                </p>
                <p className="mt-2 text-2xl font-black">{totalBookings}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-50">
                  Active
                </p>
                <p className="mt-2 text-2xl font-black">{active}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-50">
                  Completed
                </p>
                <p className="mt-2 text-2xl font-black">{completed}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-50">
                  Blocks
                </p>
                <p className="mt-2 text-2xl font-black">{monthBlocks}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-60">
                Today’s Schedule
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                Active today
              </h2>
            </div>

            <div className="space-y-3">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/[0.08] p-4"
                  >
                    <p className="font-bold">{item.title}</p>
                    <p className="mt-1 text-xs opacity-60">{item.time}</p>
                    <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4 text-sm opacity-70">
                  No active booking schedule for today.
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </RoleWorkspaceShell>
  );
}
