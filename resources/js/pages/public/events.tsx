import { Head } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { PublicEventItem } from '@/types/public-content';

function EventCard({ item, badge }: { item: PublicEventItem; badge: string }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
      <div className="relative h-[360px] overflow-hidden">
        <img
          src={item.images?.[0] || item.image || '/marketing/images/events/1.JPG'}
          alt={item.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/18 to-transparent" />
        <div className="absolute left-5 top-5 rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-800">
          {badge}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <h3 className="text-3xl font-semibold">{item.title}</h3>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/85">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {item.date}
            </span>
            {item.time ? (
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {item.time}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {item.venue}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-3 p-6">
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{item.summary || item.description}</p>
        <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">{item.note || 'Public event details remain subject to final operational confirmation.'}</p>
      </div>
    </article>
  );
}

function EventsCarousel({
  title,
  eyebrow,
  items,
  badge,
  accentClass,
}: {
  title: string;
  eyebrow: string;
  items: PublicEventItem[];
  badge: string;
  accentClass: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (activeIndex > items.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  if (items.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 px-6 py-12 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        No public events are visible in this section yet.
      </section>
    );
  }

  const active = items[activeIndex] ?? items[0];

  return (
    <section className="rounded-[2.2rem] border border-black/5 bg-white/86 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={`inline-flex rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] ${accentClass}`}>
            {eyebrow}
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-800 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
            aria-label={`Previous ${title}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-300">
            {activeIndex + 1} / {items.length}
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-800 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
            aria-label={`Next ${title}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <EventCard item={active} badge={badge} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {items.map((item, index) => (
            <button
              key={String(item.id)}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-[1.6rem] border p-4 text-left transition ${
                index === activeIndex
                  ? 'border-[#174fda]/30 bg-[#eef4ff] shadow-[0_14px_35px_rgba(23,79,218,0.12)] dark:border-[#8ea3ff]/30 dark:bg-[#1a2448]'
                  : 'border-black/5 bg-slate-50 hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-950/50'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {badge}
              </div>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {item.date}
                </div>
                {item.time ? (
                  <div className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {item.time}
                  </div>
                ) : null}
                <div className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {item.venue}
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item.summary || item.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function EventsPage({ events = [] }: { events?: PublicEventItem[] }) {
  const publicEvents = useMemo(() => events.filter((item) => item.isPublic), [events]);
  const bcccEvents = useMemo(() => publicEvents.filter((item) => item.scope !== 'city'), [publicEvents]);
  const cityEvents = useMemo(() => publicEvents.filter((item) => item.scope === 'city'), [publicEvents]);

  const featured = publicEvents.find((item) => item.highlighted) ?? bcccEvents[0] ?? cityEvents[0] ?? null;
  const heroImage = featured?.images?.[0] || featured?.image || '/marketing/images/events/lightmain.JPG';

  return (
    <PublicLayout>
      <Head title="Events" />

      <PageHero
        eyebrow="Events"
        title="BCCC public events and Baguio City highlights in separate carousel sections."
        description="This page now separates venue-based BCCC activities from Baguio City event highlights so visitors can scan them faster and with less confusion."
        backgroundImages={[heroImage, heroImage]}
        actions={[
          { label: 'View Calendar', href: '/calendar' },
          { label: 'Book Now', href: '/bookings/create', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-8 pb-12">
        <EventsCarousel
          title="BCCC events featured in the middle section with slide-based browsing"
          eyebrow="BCCC Events"
          items={bcccEvents}
          badge="BCCC Event"
          accentClass="border-[#174f40]/20 bg-[#174f40]/10 text-[#174f40] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]"
        />

        <EventsCarousel
          title="Baguio City events shown in their own carousel below the venue section"
          eyebrow="Baguio City Events"
          items={cityEvents}
          badge="City Event"
          accentClass="border-[#7c3aed]/20 bg-[#7c3aed]/10 text-[#7c3aed] dark:border-[#c4b5fd]/20 dark:bg-[#c4b5fd]/10 dark:text-[#ddd6fe]"
        />
      </section>
    </PublicLayout>
  );
}
