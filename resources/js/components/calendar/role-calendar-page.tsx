import { BookingRolePageShell } from '@/components/bookings/booking-role-page-shell';
import {
  addMonths,
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
  type CalendarBlockKey,
  type CalendarDayCell,
  type CalendarEventItem,
} from '@/lib/calendar-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import { Link, router, usePage } from '@inertiajs/react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clock3,
  ExternalLink,
  ListFilter,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type CalendarAvailabilityDay = {
  AM?: boolean;
  PM?: boolean;
  EVE?: boolean;
  is_fully_booked?: boolean;
  day_status?: string;
};

type RoleCalendarPageProps = {
  workspaceRole?: string;
  counts?: Record<string, number>;
  events?: CalendarEventItem[];
  month?: string;
  monthAvailability?: Record<string, CalendarAvailabilityDay>;
  areaOptions?: string[];
};

const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function availabilityLabel(day?: CalendarAvailabilityDay): string {
  const status = String(day?.day_status || '').toLowerCase();

  if (!day) return 'No Data';
  if (status === 'blocked') return 'Blocked';
  if (status === 'public_booked') return 'Public Event';
  if (status === 'private_booked') return 'Private / Reserved';
  if (status === 'limited' || status === 'partial' || status === 'partially_booked') return 'Limited';
  if (day.is_fully_booked) return 'Fully Booked';

  return 'Available';
}

function availabilityTone(day?: CalendarAvailabilityDay): string {
  const status = String(day?.day_status || '').toLowerCase();

  if (!day) {
    return 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)]';
  }

  if (status === 'blocked' || day.is_fully_booked) {
    return 'border-rose-300/32 bg-rose-400/10';
  }

  if (status === 'public_booked') {
    return 'border-sky-300/32 bg-sky-400/10';
  }

  if (status === 'private_booked') {
    return 'border-amber-300/40 bg-amber-400/10';
  }

  if (status === 'limited' || status === 'partial' || status === 'partially_booked') {
    return 'border-blue-300/32 bg-blue-400/10';
  }

  return 'border-emerald-300/32 bg-emerald-400/10';
}

function statusDot(day?: CalendarAvailabilityDay): string {
  const status = String(day?.day_status || '').toLowerCase();

  if (status === 'blocked' || day?.is_fully_booked) return 'bg-rose-500';
  if (status === 'public_booked') return 'bg-sky-500';
  if (status === 'private_booked') return 'bg-amber-500';
  if (status === 'limited' || status === 'partial' || status === 'partially_booked') return 'bg-blue-500';

  return 'bg-emerald-500';
}

function blockOpen(day: CalendarAvailabilityDay | undefined, block: CalendarBlockKey): boolean {
  if (!day) return true;

  return day[block] !== false;
}

function calendarActionPaths(role: RoleThemeKey, dateKey: string) {
  return {
    booking: roleBookingCreatePath(role, dateKey),
    manage: roleCalendarManagePath(role, dateKey),
    month: roleCalendarBasePath(role),
  };
}

function eventHref(role: RoleThemeKey, event: CalendarEventItem): string | null {
  if (event.kind === 'booking' && /^\d+$/.test(String(event.id))) {
    return roleBookingShowPath(role, event.id);
  }

  if (event.kind === 'block' && (role === 'admin' || role === 'manager')) {
    return roleCalendarManagePath(role);
  }

  return null;
}

function CountCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: typeof CalendarDays;
}) {
  return (
    <article className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-muted)]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.065em] text-[var(--bccc-backend-text)]">
            {value}
          </p>
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.11)] text-[var(--bccc-backend-gold)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
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
      className={cx(
        'inline-flex min-h-6 items-center justify-center border px-2 text-[9px] font-black uppercase tracking-[0.14em]',
        open
          ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
          : 'border-rose-300/35 bg-rose-400/10 text-rose-700 dark:text-rose-200',
      )}
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
  role: RoleThemeKey;
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
      className={cx(
        'group relative min-h-[9.5rem] border-b border-r border-[var(--bccc-backend-line)] p-2 text-left transition duration-500 hover:z-10 hover:border-[var(--bccc-backend-gold-line)] hover:bg-[var(--bccc-backend-hover)]',
        day.isCurrentMonth ? '' : 'opacity-45',
        availabilityTone(day.availability),
        selected && 'z-20 ring-2 ring-inset ring-[var(--bccc-backend-gold)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cx(
            'flex h-8 w-8 items-center justify-center text-sm font-black',
            day.isToday
              ? 'bg-[var(--bccc-green-800)] text-white'
              : 'bg-[var(--bccc-backend-panel)] text-[var(--bccc-backend-text)]',
          )}
        >
          {day.dayNumber}
        </span>

        <span className="hidden items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--bccc-backend-muted)] sm:inline-flex">
          <span className={cx('h-2 w-2 rounded-full', statusDot(day.availability))} />
          {availabilityLabel(day.availability)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {(['AM', 'PM', 'EVE'] as CalendarBlockKey[]).map((block) => (
          <AvailabilityPill key={block} block={block} open={blockOpen(day.availability, block)} />
        ))}
      </div>

      <div className="mt-2 grid gap-1.5">
        {visibleEvents.map((event) => (
          <span
            key={`${event.kind}-${event.id}-${event.start}`}
            className={cx(
              'block truncate border px-2 py-1 text-[10px] font-semibold',
              eventTone(event),
            )}
          >
            {cleanCalendarLabel(event.title)}
          </span>
        ))}

        {overflow > 0 ? (
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bccc-backend-muted)]">
            +{overflow} more
          </span>
        ) : null}

        {day.events.length === 0 ? (
          <span className="text-[10px] text-[var(--bccc-backend-muted)]">
            No scheduled item
          </span>
        ) : null}
      </div>

      <div className="absolute bottom-2 left-2 right-2 hidden gap-1 group-hover:flex">
        {canCreate ? (
          <Link
            href={calendarActionPaths(role, day.key).booking}
            onClick={(event) => event.stopPropagation()}
            className="flex-1 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.12em] text-[var(--bccc-backend-text)] hover:border-[var(--bccc-backend-gold-line)]"
          >
            Book
          </Link>
        ) : null}

        {canBlock ? (
          <Link
            href={calendarActionPaths(role, day.key).manage}
            onClick={(event) => event.stopPropagation()}
            className="flex-1 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.12em] text-[var(--bccc-backend-text)] hover:border-[var(--bccc-backend-gold-line)]"
          >
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
  role: RoleThemeKey;
  day?: CalendarDayCell;
}) {
  if (!day) {
    return (
      <aside className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-6 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
        <p className="text-sm text-[var(--bccc-backend-muted)]">
          Select a date to view details.
        </p>
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
    <aside className="sticky top-28 space-y-4 self-start">
      <section className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
          Selected Date
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--bccc-backend-text)]">
          {formattedDate}
        </h2>

        <p className="mt-2 text-sm leading-7 text-[var(--bccc-backend-muted)]">
          Availability, blocks, bookings, and public events attached to this day.
        </p>

        <div className="mt-5 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-muted)]">
            Day Status
          </p>

          <div className="mt-3 inline-flex items-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.10)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-gold)]">
            <span className={cx('h-2 w-2 rounded-full', statusDot(day.availability))} />
            {availabilityLabel(day.availability)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['AM', 'PM', 'EVE'] as CalendarBlockKey[]).map((block) => (
              <AvailabilityPill key={block} block={block} open={blockOpen(day.availability, block)} />
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          {canCreate ? (
            <Link
              href={calendarActionPaths(role, day.key).booking}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)]"
            >
              <Plus className="h-4 w-4" />
              Create Booking
            </Link>
          ) : null}

          {canBlock ? (
            <Link
              href={calendarActionPaths(role, day.key).manage}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
            >
              <ShieldCheck className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
              Manage Blocks
            </Link>
          ) : null}
        </div>
      </section>

      <section className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
        <div className="border-b border-[var(--bccc-backend-line)] p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
            Schedule Items
          </p>

          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--bccc-backend-text)]">
            {day.events.length} item{day.events.length === 1 ? '' : 's'}
          </h3>
        </div>

        {day.events.length > 0 ? (
          <div className="divide-y divide-[var(--bccc-backend-line)]">
            {day.events.map((event) => {
              const href = eventHref(role, event);

              const content = (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--bccc-backend-text)]">
                      {cleanCalendarLabel(event.title)}
                    </p>

                    <p className="mt-1 text-xs leading-6 text-[var(--bccc-backend-muted)]">
                      {event.area || event.block || event.kind || 'Calendar item'}
                    </p>
                  </div>

                  {href ? (
                    <ExternalLink className="h-4 w-4 shrink-0 text-[var(--bccc-backend-gold)]" />
                  ) : null}
                </div>
              );

              return href ? (
                <Link
                  key={`${event.kind}-${event.id}-${event.start}`}
                  href={href}
                  className="block p-4 transition hover:bg-[var(--bccc-backend-hover)]"
                >
                  {content}
                </Link>
              ) : (
                <div key={`${event.kind}-${event.id}-${event.start}`} className="p-4">
                  {content}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-sm leading-7 text-[var(--bccc-backend-muted)]">
            No booking, block, or public event is attached to this date.
          </div>
        )}
      </section>
    </aside>
  );
}

export function RoleCalendarPage() {
  const { props } = usePage<RoleCalendarPageProps>();
  const role = normalizeCalendarRole(props.workspaceRole) as RoleThemeKey;
  const copy = calendarRoleCopy(role);

  const month = props.month || formatDateKey(new Date()).slice(0, 7);
  const availability = props.monthAvailability || {};
  const events = Array.isArray(props.events) ? props.events : [];
  const counts = props.counts || {};

  const [selectedKey, setSelectedKey] = useState(() => formatDateKey(new Date()));

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
    <BookingRolePageShell
      role={role}
      title={copy.title}
      description={copy.description}
      actions={
        <>
          <Link
            href={copy.manageHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)]"
          >
            <CalendarDays className="h-4 w-4" />
            {copy.primaryAction}
          </Link>

          <Link
            href={copy.createHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
          >
            <Plus className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
            {copy.secondaryAction}
          </Link>

          <Link
            href={copy.analyticsHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
          >
            <BarChart3 className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
            {copy.tertiaryAction}
          </Link>
        </>
      }
    >
      <section className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CountCard label="Calendar Items" value={events.length} icon={ListFilter} />
          <CountCard label="Bookings" value={counts.bookings ?? events.filter((event) => event.kind === 'booking').length} icon={CalendarDays} />
          <CountCard label="Blocks" value={counts.blocks ?? events.filter((event) => event.kind === 'block').length} icon={ShieldCheck} />
          <CountCard label="Public Events" value={counts.public_events ?? events.filter((event) => event.kind === 'public_event').length} icon={Sparkles} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
          <main className="min-w-0">
            <section className="overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 border-b border-[var(--bccc-backend-line)] p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
                    Calendar Month
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--bccc-backend-text)]">
                    {monthLabel(month)}
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-[var(--bccc-backend-muted)]">
                    View bookings, public events, blocked dates, and AM / PM / EVE availability.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => goToMonth(previousMonth)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => goToMonth(formatDateKey(new Date()).slice(0, 7))}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.12)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-gold)] transition hover:-translate-y-0.5"
                  >
                    <Clock3 className="h-4 w-4" />
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => goToMonth(nextMonth)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)]">
                {weekLabels.map((label) => (
                  <div
                    key={label}
                    className="px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-gold)]"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
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
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-4">
              {[
                ['Available', 'Open or mostly open date', 'bg-emerald-500'],
                ['Limited', 'Some blocks occupied', 'bg-blue-500'],
                ['Private / Reserved', 'Private booking or reserved block', 'bg-amber-500'],
                ['Blocked', 'Unavailable for requests', 'bg-rose-500'],
              ].map(([label, description, dot]) => (
                <div
                  key={label}
                  className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-4 shadow-[var(--bccc-backend-shadow-soft)]"
                >
                  <div className="flex items-center gap-2">
                    <span className={cx('h-2.5 w-2.5 rounded-full', dot)} />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-text)]">
                      {label}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-[var(--bccc-backend-muted)]">
                    {description}
                  </p>
                </div>
              ))}
            </section>
          </main>

          <SelectedDayPanel role={role} day={selectedDay} />
        </div>
      </section>
    </BookingRolePageShell>
  );
}
