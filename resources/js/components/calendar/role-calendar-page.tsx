import { RoleWorkspaceShell } from '@/components/role/role-workspace-shell';
import {
  addMonths,
  availabilityLabel,
  availabilityTone,
  blockLabel,
  buildMonthGrid,
  calendarRoleCopy,
  cleanCalendarLabel,
  eventTone,
  formatDateKey,
  monthLabel,
  normalizeCalendarRole,
  parseMonth,
  roleBookingCreatePath,
  roleBookingShowPath,
  roleCalendarBasePath,
  roleCalendarManagePath,
  type CalendarAvailabilityDay,
  type CalendarBlockKey,
  type CalendarDayCell,
  type CalendarEventItem,
} from '@/lib/calendar-role-ui';
import type { RoleKey } from '@/lib/role-workspaces';
import type { BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ExternalLink,
  ListFilter,
  LockKeyhole,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type RoleCalendarPageProps = {
  workspaceRole?: string;
  counts?: Record<string, number>;
  events?: CalendarEventItem[];
  month?: string;
  monthAvailability?: Record<string, CalendarAvailabilityDay>;
  areaOptions?: string[];
};

const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function calendarBreadcrumbs(role: RoleKey): BreadcrumbItem[] {
  if (role === 'admin') {
    return [
      { title: 'Admin', href: '/admin/dashboard' },
      { title: 'Booking Calendar', href: '/admin/calendar' },
    ];
  }

  if (role === 'manager') {
    return [
      { title: 'Manager', href: '/manager/dashboard' },
      { title: 'Calendar Monitoring', href: '/manager/calendar' },
    ];
  }

  if (role === 'staff') {
    return [
      { title: 'Staff', href: '/staff/dashboard' },
      { title: 'Daily Calendar', href: '/staff/calendar' },
    ];
  }

  return [
    { title: 'Account', href: '/my-dashboard' },
    { title: 'Calendar', href: '/my-dashboard' },
  ];
}

function eventHref(role: RoleKey, event: CalendarEventItem): string | null {
  if (event.kind === 'booking' && typeof event.id !== 'string') {
    return roleBookingShowPath(role, event.id);
  }

  if (event.kind === 'booking' && /^\d+$/.test(String(event.id))) {
    return roleBookingShowPath(role, event.id);
  }

  if (event.kind === 'block' && (role === 'admin' || role === 'manager')) {
    return roleCalendarManagePath(role);
  }

  return null;
}

function AvailabilityPill({
  block,
  open,
}: {
  block: CalendarBlockKey;
  open?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-black tracking-[0.12em] ${
        open
          ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
          : 'border-red-300/25 bg-red-400/10 text-red-100'
      }`}
    >
      {blockLabel(block)}
    </span>
  );
}

function CalendarDay({
  role,
  day,
  selected,
  onSelect,
}: {
  role: RoleKey;
  day: CalendarDayCell;
  selected: boolean;
  onSelect: (day: CalendarDayCell) => void;
}) {
  const visibleEvents = day.events.slice(0, 3);
  const overflow = Math.max(day.events.length - visibleEvents.length, 0);
  const canCreate = role === 'admin' || role === 'staff' || role === 'user';
  const canBlock = role === 'admin' || role === 'manager';

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      className={`group min-h-[9.5rem] rounded-3xl border p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.08] ${
        selected
          ? 'border-white/30 bg-white/[0.12] shadow-lg shadow-black/10'
          : `${availabilityTone(day.availability)}`
      } ${day.isCurrentMonth ? '' : 'opacity-45'}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-black ${
              day.isToday
                ? 'bg-white text-black'
                : 'bg-black/15 text-current'
            }`}
          >
            {day.dayNumber}
          </span>
        </div>

        <span className="rounded-full border border-white/10 bg-black/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-70">
          {availabilityLabel(day.availability)}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        <AvailabilityPill block="AM" open={day.availability?.AM} />
        <AvailabilityPill block="PM" open={day.availability?.PM} />
        <AvailabilityPill block="EVE" open={day.availability?.EVE} />
      </div>

      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <div
            key={`${event.kind}-${event.id}-${event.start}-${event.title}`}
            className={`truncate rounded-xl border px-2 py-1 text-[11px] font-bold ${eventTone(event)}`}
            title={event.title}
          >
            {cleanCalendarLabel(event.title)}
          </div>
        ))}

        {overflow > 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/10 px-2 py-1 text-[11px] font-bold opacity-70">
            +{overflow} more
          </div>
        ) : null}

        {day.events.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/10 px-2 py-1 text-[11px] opacity-45">
            No scheduled item
          </div>
        ) : null}
      </div>

      <div className="mt-3 hidden gap-1 group-hover:flex">
        {canCreate ? (
          <Link
            href={roleBookingCreatePath(role, day.key)}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black transition hover:bg-white/15"
          >
            <Plus className="mr-1 h-3 w-3" />
            Book
          </Link>
        ) : null}

        {canBlock ? (
          <Link
            href={roleCalendarManagePath(role, day.key)}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black transition hover:bg-white/15"
          >
            <LockKeyhole className="mr-1 h-3 w-3" />
            Block
          </Link>
        ) : null}
      </div>
    </button>
  );
}

function SelectedDayPanel({
  role,
  day,
}: {
  role: RoleKey;
  day?: CalendarDayCell;
}) {
  if (!day) {
    return (
      <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
        <p className="text-sm opacity-70">Select a date to view details.</p>
      </aside>
    );
  }

  const formattedDate = day.date.toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const canCreate = role === 'admin' || role === 'staff' || role === 'user';
  const canBlock = role === 'admin' || role === 'manager';

  return (
    <aside className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
          Selected Date
        </p>

        <h3 className="mt-2 text-xl font-black">{formattedDate}</h3>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <AvailabilityPill block="AM" open={day.availability?.AM} />
          <AvailabilityPill block="PM" open={day.availability?.PM} />
          <AvailabilityPill block="EVE" open={day.availability?.EVE} />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/[0.08] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] opacity-50">
            Day Status
          </p>
          <p className="mt-2 text-sm font-bold">
            {availabilityLabel(day.availability)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {canCreate ? (
            <Link
              href={roleBookingCreatePath(role, day.key)}
              className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/15"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Booking
            </Link>
          ) : null}

          {canBlock ? (
            <Link
              href={roleCalendarManagePath(role, day.key)}
              className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/15"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Manage Blocks
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
          Schedule Items
        </p>

        <h3 className="mt-2 text-xl font-black">
          {day.events.length} item{day.events.length === 1 ? '' : 's'}
        </h3>

        <div className="mt-4 space-y-3">
          {day.events.length > 0 ? (
            day.events.map((event) => {
              const href = eventHref(role, event);

              const content = (
                <div
                  className={`rounded-2xl border p-4 transition ${eventTone(event)} ${
                    href ? 'hover:bg-white/15' : ''
                  }`}
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black">
                        {cleanCalendarLabel(event.title)}
                      </p>
                      <p className="mt-1 truncate text-xs opacity-70">
                        {event.area || event.block || event.kind || 'Calendar item'}
                      </p>
                    </div>

                    {href ? <ExternalLink className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </div>
                </div>
              );

              return href ? (
                <Link
                  href={href}
                  key={`${event.kind}-${event.id}-${event.start}-${event.title}`}
                >
                  {content}
                </Link>
              ) : (
                <div key={`${event.kind}-${event.id}-${event.start}-${event.title}`}>
                  {content}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/[0.08] p-4 text-sm opacity-70">
              No booking, block, or public event is attached to this date.
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

export function RoleCalendarPage() {
  const { props } = usePage<RoleCalendarPageProps>();
  const role = normalizeCalendarRole(props.workspaceRole);
  const copy = calendarRoleCopy(role);

  const month = props.month || formatDateKey(new Date()).slice(0, 7);
  const availability = props.monthAvailability || {};
  const events = Array.isArray(props.events) ? props.events : [];
  const counts = props.counts || {};

  const [selectedKey, setSelectedKey] = useState<string>(() => formatDateKey(new Date()));

  const grid = useMemo(
    () => buildMonthGrid(month, availability, events),
    [month, availability, events],
  );

  const selectedDay = useMemo(
    () => grid.find((day) => day.key === selectedKey) ?? grid.find((day) => day.isToday) ?? grid[0],
    [grid, selectedKey],
  );

  const currentMonthDate = parseMonth(month);
  const previousMonth = formatDateKey(addMonths(currentMonthDate, -1)).slice(0, 7);
  const nextMonth = formatDateKey(addMonths(currentMonthDate, 1)).slice(0, 7);

  function goToMonth(nextMonthValue: string) {
    router.get(
      roleCalendarBasePath(role),
      { month: nextMonthValue },
      {
        preserveScroll: true,
        preserveState: false,
        replace: true,
      },
    );
  }

  return (
    <RoleWorkspaceShell
      role={role}
      title={copy.title}
      eyebrow={copy.eyebrow}
      description={copy.description}
      breadcrumbs={calendarBreadcrumbs(role)}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={copy.manageHref}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {copy.primaryAction}
          </Link>

          <Link
            href={copy.createHref}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
          >
            <Plus className="mr-2 h-4 w-4" />
            {copy.secondaryAction}
          </Link>

          <Link
            href={copy.analyticsHref}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {copy.tertiaryAction}
          </Link>
        </div>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
            Pending
          </p>
          <p className="mt-3 text-3xl font-black">{counts.pending ?? 0}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
            Confirmed
          </p>
          <p className="mt-3 text-3xl font-black">{counts.confirmed ?? 0}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
            Active
          </p>
          <p className="mt-3 text-3xl font-black">{counts.active ?? 0}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
            Completed
          </p>
          <p className="mt-3 text-3xl font-black">{counts.completed ?? 0}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                  Calendar Month
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {monthLabel(month)}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => goToMonth(previousMonth)}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/15"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => goToMonth(formatDateKey(new Date()).slice(0, 7))}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/15"
                >
                  <Clock3 className="mr-2 h-4 w-4" />
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => goToMonth(nextMonth)}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/15"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-sm backdrop-blur sm:p-4">
            <div className="grid grid-cols-7 gap-2 pb-2">
              {weekLabels.map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-black/[0.08] px-2 py-2 text-center text-xs font-black uppercase tracking-[0.18em] opacity-70"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
              {grid.map((day) => (
                <CalendarDay
                  key={day.key}
                  role={role}
                  day={day}
                  selected={selectedDay?.key === day.key}
                  onSelect={(nextDay) => setSelectedKey(nextDay.key)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <ListFilter className="h-5 w-5 opacity-70" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                  Legend
                </p>
                <h3 className="text-lg font-black">Calendar colors</h3>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">
                Confirmed / Active Booking
              </div>
              <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">
                Pending / Private / Partial
              </div>
              <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-4 text-sm font-bold text-red-100">
                Blocked / Unavailable
              </div>
              <div className="rounded-2xl border border-sky-300/25 bg-sky-300/10 p-4 text-sm font-bold text-sky-100">
                Public Event
              </div>
            </div>
          </div>
        </div>

        <SelectedDayPanel role={role} day={selectedDay} />
      </section>
    </RoleWorkspaceShell>
  );
}
