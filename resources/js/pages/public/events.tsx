import { Head, Link } from '@inertiajs/react';
import { CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { events as fallbackEvents, type EventItem } from '@/data/events';
import PublicLayout from '@/layouts/public-layout';
import PageHero from '@/components/public/page-hero';

type FilterMode = 'all' | 'bccc' | 'city';

export default function EventsPage({ events }: { events?: EventItem[] }) {
  const sourceEvents = events && events.length > 0 ? events : fallbackEvents;
  const [filter, setFilter] = useState<FilterMode>('all');

  const normalizedEvents = useMemo(
    () =>
      sourceEvents
        .filter((item) => item.isPublic)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [sourceEvents],
  );

  const bcccEvents = useMemo(
    () => normalizedEvents.filter((item) => item.scope === 'bccc'),
    [normalizedEvents],
  );

  const cityEvents = useMemo(
    () => normalizedEvents.filter((item) => item.scope === 'city'),
    [normalizedEvents],
  );

  const featuredEvent =
    bcccEvents.find((item) => item.highlighted || item.featured) ??
    bcccEvents[0] ??
    normalizedEvents[0];

  const visibleBcccEvents = filter === 'all' || filter === 'bccc' ? bcccEvents : [];
  const visibleCityEvents = filter === 'all' || filter === 'city' ? cityEvents : [];

  return (
    <PublicLayout>
      <Head title="Events" />
<PageHero
  eyebrow="Events & Announcements"
  title="Public convention-center events and Baguio City highlights"
  description="This page separates BCCC public events from Baguio City public events so the frontend follows the content structure you want."
  backgroundImages={[
    featuredEvent?.lightImage || '/marketing/images/events/1.JPG',
    '/marketing/images/events/2.JPG',
    '/marketing/images/events/3.JPG',
  ]}
  actions={[
    { label: 'View Calendar', href: '/calendar' },
    { label: 'Ask About Events', href: '/contact', variant: 'secondary' },
  ]}
/>

      <section className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-neutral-950 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5 px-6 py-8 sm:px-8 sm:py-10">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Events &amp; Announcements
              </span>

              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                  Public convention-center events and Baguio City highlights
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  This page separates BCCC public events from Baguio City public
                  events so the frontend follows the content structure you want.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
                >
                  <CalendarDays className="h-4 w-4" />
                  View Calendar
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Sparkles className="h-4 w-4" />
                  Ask About Events
                </Link>
              </div>
            </div>

            {featuredEvent ? (
              <div className="relative min-h-[320px] overflow-hidden">
                <img
                  src={featuredEvent.lightImage}
                  alt={featuredEvent.title}
                  className="h-full w-full object-cover dark:hidden"
                />
                <img
                  src={featuredEvent.darkImage}
                  alt={featuredEvent.title}
                  className="hidden h-full w-full object-cover dark:block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 text-white sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur">
                      {featuredEvent.category}
                    </span>
                    {featuredEvent.highlighted && (
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100 backdrop-blur">
                        Highlighted
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {featuredEvent.title}
                  </h2>

                  <div className="flex flex-wrap gap-4 text-sm text-white/85">
                    <div className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {featuredEvent.date}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {featuredEvent.venue}
                    </div>
                  </div>

                  <p className="max-w-2xl text-sm leading-7 text-white/85">
                    {featuredEvent.description}
                  </p>

                  <p className="text-sm text-white/75">{featuredEvent.note}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center px-6 py-10 text-sm text-slate-500 dark:text-slate-300">
                No public events are available yet.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { key: 'all', label: 'All Public Events' },
            { key: 'bccc', label: 'BCCC Events' },
            { key: 'city', label: 'Baguio City Events' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key as FilterMode)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                filter === item.key
                  ? 'bg-[#174f40] text-white dark:bg-[#2d47ff]'
                  : 'border border-black/10 bg-white text-[#232320] dark:border-white/10 dark:bg-[#16171b] dark:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {(filter === 'all' || filter === 'bccc') && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">
                BCCC Events
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Public events held at the convention center
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {visibleBcccEvents.map((event) => (
                <article
                  key={`${event.scope}-${event.title}`}
                  className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950"
                >
                  <div className="h-60 overflow-hidden">
                    <img
                      src={event.lightImage}
                      alt={event.title}
                      className="h-full w-full object-cover dark:hidden"
                    />
                    <img
                      src={event.darkImage}
                      alt={event.title}
                      className="hidden h-full w-full object-cover dark:block"
                    />
                  </div>

                  <div className="space-y-4 px-5 py-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {event.category}
                      </span>
                      {event.highlighted && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Highlighted
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {event.title}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-300">
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {event.date}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.venue}
                      </div>
                    </div>

                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {event.summary}
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {event.note}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {(filter === 'all' || filter === 'city') && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                Baguio City Events
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Public city highlights and community activities
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleCityEvents.map((event) => (
                <article
                  key={`${event.scope}-${event.title}`}
                  className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-950"
                >
                  <div className="space-y-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {event.category}
                    </span>

                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {event.title}
                    </h3>

                    <div className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {event.date}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.venue}
                      </div>
                    </div>

                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {event.summary}
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {event.note}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
