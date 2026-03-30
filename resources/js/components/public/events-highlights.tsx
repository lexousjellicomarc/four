import { Link } from '@inertiajs/react';
import { CalendarDays, MapPin } from 'lucide-react';
import type { PublicEventItem } from '@/types/public-content';

type Props = {
  items?: PublicEventItem[];
};

export default function EventsHighlights({ items = [] }: Props) {
  const featured = items.filter((item) => item.isPublic).slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section className="public-container mt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="public-chip border-[#0f8b6d]/20 bg-[#0f8b6d]/10 text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
            Event Highlights
          </div>
          <h2 className="mt-3 public-section-title">Upcoming public events and city activities.</h2>
        </div>

        <Link
          href="/events"
          className="inline-flex items-center rounded-full border border-black/10 bg-white/80 px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-white/5"
        >
          View All Events
        </Link>
      </div>

      <div className="scrollbar-hide mt-6 flex gap-4 overflow-x-auto pb-2">
        {featured.map((item, index) => (
          <article
            key={`${item.scope}-${item.title}-${index}`}
            className="min-w-[310px] max-w-[310px] overflow-hidden rounded-[1.85rem] border border-black/5 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-950/50"
          >
            <div className="relative h-52 overflow-hidden">
              <img src={item.images?.[0] || '/marketing/images/events/1.JPG'} alt={item.title} className="h-full w-full object-cover" />
              <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                {item.scope === 'city' ? 'Baguio City' : 'BCCC'}
              </div>
            </div>

            <div className="space-y-3 p-5">
              <h3 className="line-clamp-2 text-xl font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {item.date}
                </div>
                <div className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {item.venue}
                </div>
              </div>
              <p className="line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item.summary || item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
