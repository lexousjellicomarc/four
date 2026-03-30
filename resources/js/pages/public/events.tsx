import { Head } from '@inertiajs/react';
import { CalendarDays, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { PublicEventItem } from '@/types/public-content';

type FilterMode = 'all' | 'bccc' | 'city';

export default function EventsPage({ events = [] }: { events?: PublicEventItem[] }) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const source = useMemo(() => events.filter((item) => item.isPublic), [events]);
  const featured = source.find((item) => item.highlighted) ?? source[0];

  const visible = useMemo(() => {
    if (filter === 'all') return source;
    return source.filter((item) => item.scope === filter);
  }, [filter, source]);

  return (
    <PublicLayout>
      <Head title="Events" />

      <PageHero
        eyebrow="Events"
        title="Public events, city highlights, and convention-center announcements."
        description="Browse visible BCCC public events and Baguio City highlights in a cleaner, more premium layout inspired by your reference."
        backgroundImages={[
          featured?.images?.[0] || '/marketing/images/events/lightmain.JPG',
          featured?.images?.[0] || '/marketing/images/events/darkmain.JPG',
        ]}
        actions={[
          { label: 'View Calendar', href: '/calendar' },
          { label: 'Send Inquiry', href: '/contact', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-8 pb-12">
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'All Public Events' },
            { key: 'bccc', label: 'BCCC Events' },
            { key: 'city', label: 'Baguio City Events' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key as FilterMode)}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition ${
                filter === item.key
                  ? 'bg-[#0f8b6d] text-white dark:bg-[#294CFF]'
                  : 'border border-black/10 bg-white/80 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {featured ? (
          <div className="grid gap-0 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[350px] overflow-hidden">
              <img src={featured.images?.[0] || '/marketing/images/events/1.JPG'} alt={featured.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="public-chip border-white/20 bg-white/10 text-white">
                  {featured.scope === 'city' ? 'Baguio City Event' : 'BCCC Public Event'}
                </div>
                <h2 className="mt-3 text-3xl font-semibold">{featured.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85">
                  {featured.description || featured.summary}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                Featured Event
              </div>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {featured.date}
                </div>
                <div className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {featured.venue}
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-[#f7f4ec] p-4 text-sm leading-7 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                {featured.note || 'Public details remain subject to final operational confirmation.'}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((event, index) => (
            <article
              key={`${event.title}-${index}`}
              className="overflow-hidden rounded-[1.9rem] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5"
            >
              <div className="relative h-56 overflow-hidden">
                <img src={event.images?.[0] || '/marketing/images/events/1.JPG'} alt={event.title} className="h-full w-full object-cover" />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                  {event.scope === 'city' ? 'City Event' : 'BCCC Event'}
                </div>
              </div>

              <div className="space-y-3 p-5">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{event.title}</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {event.date}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event.venue}
                  </div>
                </div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{event.summary || event.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
