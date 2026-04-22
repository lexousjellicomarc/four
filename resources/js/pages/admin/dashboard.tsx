import { Head, Link } from '@inertiajs/react';
import {
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  Megaphone,
  PanelsTopLeft,
  ShieldCheck,
  TableProperties,
  MessagesSquare,
  FileSpreadsheet,
  Globe,
  BookUser,
} from 'lucide-react';

import AdminLayout from '@/layouts/admin-layout';

type BookingCounts = {
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  declined: number;
  cancelled: number;
};

type ContentCounts = {
  bcccEvents: number;
  cityEvents: number;
  featuredEvents: number;
  packages: number;
  calendarBlocks: number;
  spaces: number;
  homepageVisibleSpaces: number;
  stats: number;
};

type RecentEvent = {
  id: number | string;
  title: string;
  scope: 'bccc' | 'city' | string;
  venue: string;
  date: string | null;
  highlighted: boolean;
};

type RecentSpace = {
  id: number | string;
  title: string;
  category: string;
  capacity: string;
  homepageVisible: boolean;
};

type AdminDashboardProps = {
  bookingCounts: BookingCounts;
  contentCounts: ContentCounts;
  recentEvents: RecentEvent[];
  recentSpaces: RecentSpace[];
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
  tone = 'green',
}: {
  icon: any;
  label: string;
  value: string;
  note: string;
  tone?: 'green' | 'blue' | 'gold';
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-[#e4eeff] text-[#1645ac] dark:bg-[#1d2943] dark:text-[#a6c0ff]'
      : tone === 'gold'
        ? 'bg-[#fff0c7] text-[#8a6500] dark:bg-[#322911] dark:text-[#f3d17a]'
        : 'bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#9dc0ff]';

  return (
    <div className="rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#66625c] dark:text-[#c8c8ce]">
        {label}
      </p>
      <h3 className="mt-2 text-3xl font-black tracking-tight">{value}</h3>
      <p className="mt-2 text-sm leading-6 text-[#595651] dark:text-[#c8c8ce]">{note}</p>
    </div>
  );
}

function BarPanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: number; tone?: 'green' | 'blue' | 'gold' | 'red' }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  const toneClass = (tone?: 'green' | 'blue' | 'gold' | 'red') => {
    if (tone === 'blue') return 'bg-[#1d5bd8] dark:bg-[#7aa6ff]';
    if (tone === 'gold') return 'bg-[#c58b16] dark:bg-[#f0c14b]';
    if (tone === 'red') return 'bg-[#c53434] dark:bg-[#ff8e8e]';
    return 'bg-[#174f40] dark:bg-[#5d8bff]';
  };

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#174f40] dark:text-[#9dc0ff]">
        Graph
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#595651] dark:text-[#c8c8ce]">{description}</p>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-sm font-black">{item.value}</p>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-[#ece7dc] dark:bg-[#1d1f25]">
              <div
                className={`h-full rounded-full ${toneClass(item.tone)}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkspaceLinkCard({
  href,
  title,
  description,
  icon: Icon,
  tone = 'frontend',
}: {
  href: string;
  title: string;
  description: string;
  icon: any;
  tone?: 'frontend' | 'backend' | 'public';
}) {
  const toneClass =
    tone === 'backend'
      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
      : tone === 'public'
        ? 'bg-[#fff0c7] text-[#8a6500] dark:bg-[#322911] dark:text-[#f3d17a]'
        : 'bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#9dc0ff]';

  return (
    <Link
      href={href}
      className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#16171b]"
    >
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#595651] dark:text-[#c8c8ce]">{description}</p>
    </Link>
  );
}

export default function AdminDashboardPage({
  bookingCounts,
  contentCounts,
  recentEvents,
  recentSpaces,
}: AdminDashboardProps) {
  const bookingChartItems = [
    { label: 'Pending', value: bookingCounts.pending, tone: 'gold' as const },
    { label: 'Confirmed', value: bookingCounts.confirmed, tone: 'green' as const },
    { label: 'Active', value: bookingCounts.active, tone: 'blue' as const },
    { label: 'Completed', value: bookingCounts.completed, tone: 'green' as const },
    { label: 'Declined', value: bookingCounts.declined, tone: 'red' as const },
    { label: 'Cancelled', value: bookingCounts.cancelled, tone: 'red' as const },
  ];

  const contentChartItems = [
    { label: 'BCCC Events', value: contentCounts.bcccEvents, tone: 'green' as const },
    { label: 'City Events', value: contentCounts.cityEvents, tone: 'blue' as const },
    { label: 'Featured BCCC', value: contentCounts.featuredEvents, tone: 'gold' as const },
    { label: 'Packages', value: contentCounts.packages, tone: 'green' as const },
    { label: 'Calendar Rules', value: contentCounts.calendarBlocks, tone: 'gold' as const },
    { label: 'Spaces', value: contentCounts.spaces, tone: 'blue' as const },
    { label: 'Homepage Visible Spaces', value: contentCounts.homepageVisibleSpaces, tone: 'green' as const },
    { label: 'Homepage Stats', value: contentCounts.stats, tone: 'blue' as const },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Graphs, content totals, booking lifecycle counts, and quick access to every public-facing admin page."
    >
      <Head title="Admin Dashboard" />

      <div className="space-y-6">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={Megaphone}
            label="Total Public Events"
            value={String(contentCounts.bcccEvents + contentCounts.cityEvents)}
            note="Combined BCCC and city-facing event entries."
          />
          <SummaryCard
            icon={LayoutGrid}
            label="Venue Spaces"
            value={String(contentCounts.spaces)}
            note="All configured venue/facility public cards."
            tone="blue"
          />
          <SummaryCard
            icon={CalendarDays}
            label="Calendar Rules"
            value={String(contentCounts.calendarBlocks)}
            note="Public availability rules affecting the calendar."
            tone="gold"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Confirmed + Active"
            value={String(bookingCounts.confirmed + bookingCounts.active)}
            note="Bookings already in confirmed or active lifecycle states."
          />
        </section>

        <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#174f40] dark:text-[#9dc0ff]">
                Unified Workspace Bridge
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Frontend content control and backend booking tools now share one admin session</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#595651] dark:text-[#c8c8ce]">
                Use these shortcuts when switching between public-page configuration and backend booking operations. No second login is required for MICE registry, inquiries, booking calendar work, or guidelines management.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f2ee] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#174f40] dark:bg-[#18231f] dark:text-[#9dc0ff]">
              <ShieldCheck className="h-4 w-4" />
              Same frontend + backend session
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <WorkspaceLinkCard
              href="/admin/home?tab=home"
              title="Frontend Admin Config"
              description="Update homepage, events, calendar preview, facilities, tourism office, and contact-page content from the frontend admin side."
              icon={PanelsTopLeft}
            />
            <WorkspaceLinkCard
              href="/dashboard"
              title="Backend Booking Calendar"
              description="Open the booking calendar workspace for actual reservation operations, day blocks, and booking-side visibility."
              icon={TableProperties}
              tone="backend"
            />
            <WorkspaceLinkCard
              href="/reports/mice-registry"
              title="MICE Survey & Registry"
              description="Go straight to the built-in MICE survey and registry report page from the same admin session."
              icon={FileSpreadsheet}
              tone="backend"
            />
            <WorkspaceLinkCard
              href="/admin/inquiries"
              title="Inquiries"
              description="Review and manage submitted public inquiries without leaving the unified admin access flow."
              icon={MessagesSquare}
              tone="backend"
            />
            <WorkspaceLinkCard
              href="/admin/guidelines-contacts"
              title="Backend Guidelines & Contacts"
              description="Open the backend-only guidelines, contact references, reservation policy copy, and attached office details."
              icon={BookUser}
              tone="backend"
            />
            <WorkspaceLinkCard
              href="/"
              title="Public Website"
              description="Open the live public-facing site to review frontend changes while staying inside the same authenticated admin session."
              icon={Globe}
              tone="public"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <BarPanel
            title="Frontend content distribution"
            description="This graph summarizes the public-facing content records currently managed from the admin side."
            items={contentChartItems}
          />

          <BarPanel
            title="Booking lifecycle status graph"
            description="This graph keeps the admin aware of how many bookings are waiting, confirmed, active, finished, declined, or cancelled."
            items={bookingChartItems}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#174f40] dark:text-[#9dc0ff]">
              Quick Access
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Jump to preview pages</h2>
            <p className="mt-3 text-sm leading-7 text-[#595651] dark:text-[#c8c8ce]">
              These links open the admin preview pages, not the old all-forms-at-once workflow.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/home?tab=home"
                className="rounded-[1.4rem] bg-[#f7f2e8] px-4 py-4 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-[#1d1e23]"
              >
                Home Preview
              </Link>
              <Link
                href="/admin/home?tab=facilities"
                className="rounded-[1.4rem] bg-[#f7f2e8] px-4 py-4 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-[#1d1e23]"
              >
                Facilities Preview
              </Link>
              <Link
                href="/admin/home?tab=events"
                className="rounded-[1.4rem] bg-[#f7f2e8] px-4 py-4 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-[#1d1e23]"
              >
                Events Preview
              </Link>
              <Link
                href="/admin/home?tab=calendar"
                className="rounded-[1.4rem] bg-[#f7f2e8] px-4 py-4 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-[#1d1e23]"
              >
                Calendar Preview
              </Link>
              <Link
                href="/admin/home?tab=tourism-office"
                className="rounded-[1.4rem] bg-[#f7f2e8] px-4 py-4 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-[#1d1e23]"
              >
                Tourism Office Preview
              </Link>
              <Link
                href="/admin/home?tab=contact"
                className="rounded-[1.4rem] bg-[#f7f2e8] px-4 py-4 text-sm font-semibold transition hover:-translate-y-0.5 dark:bg-[#1d1e23]"
              >
                Contact Preview
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#174f40] dark:text-[#9dc0ff]">
              Direct Editors
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Open one form at a time</h2>
            <p className="mt-3 text-sm leading-7 text-[#595651] dark:text-[#c8c8ce]">
              These links open a single editor panel instead of showing all config forms at once.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/admin/home?tab=events&editor=bccc-events" className="rounded-[1.4rem] bg-[#eef4f1] px-4 py-4 text-sm font-semibold dark:bg-[#18231f]">
                BCCC Events Form
              </Link>
              <Link href="/admin/home?tab=events&editor=city-events" className="rounded-[1.4rem] bg-[#eef4f1] px-4 py-4 text-sm font-semibold dark:bg-[#18231f]">
                Baguio City Events Form
              </Link>
              <Link href="/admin/home?tab=facilities&editor=spaces" className="rounded-[1.4rem] bg-[#eef4f1] px-4 py-4 text-sm font-semibold dark:bg-[#18231f]">
                Spaces Form
              </Link>
              <Link href="/admin/home?tab=calendar&editor=calendar-rules" className="rounded-[1.4rem] bg-[#eef4f1] px-4 py-4 text-sm font-semibold dark:bg-[#18231f]">
                Calendar Rules Form
              </Link>
              <Link href="/admin/home?tab=home&editor=stats" className="rounded-[1.4rem] bg-[#eef4f1] px-4 py-4 text-sm font-semibold dark:bg-[#18231f]">
                Homepage Stats Form
              </Link>
              <Link href="/admin/home?tab=contact&editor=site-details" className="rounded-[1.4rem] bg-[#eef4f1] px-4 py-4 text-sm font-semibold dark:bg-[#18231f]">
                Site Details Form
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#174f40] dark:text-[#9dc0ff]">
              Recent Public Events
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Latest event-side records</h2>

            <div className="mt-5 space-y-3">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[1.4rem] border border-black/10 bg-[#faf8f3] px-4 py-4 dark:border-white/10 dark:bg-[#1d1e23]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em]">
                      <span className="rounded-full bg-[#e8f2ee] px-3 py-1 text-[#174f40] dark:bg-[#18231f] dark:text-[#9dc0ff]">
                        {event.scope === 'city' ? 'City' : 'BCCC'}
                      </span>
                      {event.highlighted ? (
                        <span className="rounded-full bg-[#fff0c7] px-3 py-1 text-[#8a6500] dark:bg-[#322911] dark:text-[#f3d17a]">
                          Highlighted
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 text-lg font-black">{event.title}</h3>
                    <p className="mt-1 text-sm text-[#595651] dark:text-[#c8c8ce]">{event.venue}</p>
                    <p className="mt-1 text-sm text-[#595651] dark:text-[#c8c8ce]">{event.date ?? 'No date'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#595651] dark:text-[#c8c8ce]">
                  No event records are available yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#174f40] dark:text-[#9dc0ff]">
              Recent Spaces
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Latest facility-side records</h2>

            <div className="mt-5 space-y-3">
              {recentSpaces.length > 0 ? (
                recentSpaces.map((space) => (
                  <div
                    key={space.id}
                    className="rounded-[1.4rem] border border-black/10 bg-[#faf8f3] px-4 py-4 dark:border-white/10 dark:bg-[#1d1e23]"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em]">
                      <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-[#1d5bd8] dark:bg-[#1b2742] dark:text-[#a9c4ff]">
                        {space.category}
                      </span>
                      {space.homepageVisible ? (
                        <span className="rounded-full bg-[#e8f2ee] px-3 py-1 text-[#174f40] dark:bg-[#18231f] dark:text-[#9dc0ff]">
                          Homepage Visible
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 text-lg font-black">{space.title}</h3>
                    <p className="mt-1 text-sm text-[#595651] dark:text-[#c8c8ce]">{space.capacity}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#595651] dark:text-[#c8c8ce]">
                  No venue-space records are available yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
