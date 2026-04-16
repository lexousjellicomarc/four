import { Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PublicEventItem } from '@/types/public-content';

type Props = {
  items?: PublicEventItem[];
  pageMode?: boolean;
};

function EventMeta({ item }: { item: PublicEventItem }) {
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/88">
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
  );
}

function CurvedCarousel({ items, badge }: { items: PublicEventItem[]; badge: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (activeIndex > items.length - 1) setActiveIndex(0);
  }, [activeIndex, items.length]);

  if (items.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 px-6 py-12 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        No events are visible in this section yet.
      </div>
    );
  }

  const visible = items.slice(0, Math.min(items.length, 8));
  const active = visible[activeIndex] ?? visible[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setActiveIndex((prev) => (prev - 1 + visible.length) % visible.length)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-800 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
          aria-label="Previous event"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-300">
          {activeIndex + 1} / {visible.length}
        </div>
        <button
          type="button"
          onClick={() => setActiveIndex((prev) => (prev + 1) % visible.length)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-slate-800 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
          aria-label="Next event"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-[2.2rem] border border-black/5 bg-white/86 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
        <div className="scrollbar-hide flex items-center gap-4 overflow-x-auto px-1 py-5">
          {visible.map((item, index) => {
            const distance = Math.abs(index - activeIndex);
            const isActive = index === activeIndex;
            const scaleClass = isActive ? 'scale-100 opacity-100' : distance === 1 ? 'scale-[0.88] opacity-85' : 'scale-[0.76] opacity-55';
            const rotate = index < activeIndex ? '-rotate-[8deg]' : index > activeIndex ? 'rotate-[8deg]' : 'rotate-0';

            return (
              <button
                key={String(item.id)}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative min-w-[280px] flex-1 rounded-[2rem] transition duration-500 sm:min-w-[340px] lg:min-w-[420px] ${scaleClass} ${rotate}`}
              >
                <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
                  <div className="relative h-[420px] overflow-hidden">
                    <img
                      src={item.images?.[0] || item.image || '/marketing/images/events/1.JPG'}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.85))]" />
                    <div className="absolute left-5 top-5 rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-800">
                      {badge}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6 text-left text-white">
                      <h3 className="text-2xl font-semibold sm:text-3xl">{item.title}</h3>
                      <EventMeta item={item} />
                      <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/86">{item.summary || item.description}</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-[1.6rem] border border-black/5 bg-slate-50 p-5 text-slate-700 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Centered highlight</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{active.title}</div>
          <p className="mt-3 text-sm leading-7">{active.note || active.summary || active.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function EventsHighlights({ items = [], pageMode = false }: Props) {
  const [tab, setTab] = useState<'bccc' | 'city'>('bccc');
  const bcccEvents = useMemo(() => items.filter((item) => item.isPublic && item.scope !== 'city'), [items]);
  const cityEvents = useMemo(() => items.filter((item) => item.isPublic && item.scope === 'city'), [items]);
  const activeItems = tab === 'bccc' ? bcccEvents : cityEvents;

  if (bcccEvents.length === 0 && cityEvents.length === 0) return null;

  return (
    <section className={`${pageMode ? 'mt-0' : 'mt-14'} w-full px-4 sm:px-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-[1600px] space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="public-chip border-[#0f8b6d]/20 bg-[#0f8b6d]/10 text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
              Event Highlights
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Animated centered event cards with separate BCCC and Baguio City views.
            </h2>
          </div>

          {!pageMode ? (
            <Link
              href="/events"
              className="inline-flex items-center rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
            >
              View All Events
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTab('bccc')}
            className={`rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition ${
              tab === 'bccc'
                ? 'bg-[#174f40] text-white shadow-[0_14px_35px_rgba(23,79,64,0.18)] dark:bg-[#294CFF]'
                : 'border border-black/10 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white'
            }`}
          >
            BCCC Events
          </button>
          <button
            type="button"
            onClick={() => setTab('city')}
            className={`rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition ${
              tab === 'city'
                ? 'bg-[#7c3aed] text-white shadow-[0_14px_35px_rgba(124,58,237,0.20)] dark:bg-[#8b5cf6]'
                : 'border border-black/10 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white'
            }`}
          >
            Baguio City Events
          </button>
        </div>

        <CurvedCarousel items={activeItems} badge={tab === 'bccc' ? 'BCCC Event' : 'City Event'} />
      </div>
    </section>
  );
}
