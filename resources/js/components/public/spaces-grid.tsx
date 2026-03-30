import { Link } from '@inertiajs/react';
import { ArrowRight, Users } from 'lucide-react';
import { useMemo } from 'react';
import type { PublicSpaceItem } from '@/types/public-content';

type Props = {
  items?: PublicSpaceItem[];
};

export default function SpacesGrid({ items = [] }: Props) {
  const visible = useMemo(() => items.filter((item) => item.homepageVisible).slice(0, 8), [items]);

  return (
    <section className="public-container mt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="public-chip border-black/10 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Our Spaces
          </div>
          <h2 className="mt-3 public-section-title">The home of conferences, culture, and collaboration.</h2>
        </div>

        <p className="max-w-xl text-sm italic leading-7 text-slate-500 dark:text-slate-300">
          Browse selected venue spaces designed for meetings, exhibits, public activities, and special functions.
        </p>
      </div>

      <div className="scrollbar-hide mt-6 flex gap-4 overflow-x-auto pb-2">
        {visible.map((item) => (
          <article
            key={item.slug}
            className="group relative min-w-[265px] max-w-[265px] overflow-hidden rounded-[1.85rem] border border-black/5 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-950/50"
          >
            <div className="relative h-[360px] overflow-hidden">
              <img
                src={item.lightImage || item.image}
                alt={item.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105 dark:hidden"
              />
              <img
                src={item.darkImage || item.image}
                alt={item.title}
                className="hidden h-full w-full object-cover transition duration-500 group-hover:scale-105 dark:block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
                  {item.category}
                </div>
                <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
                <div className="mt-2 inline-flex items-center gap-2 text-sm text-white/80">
                  <Users className="h-4 w-4" />
                  {item.capacity}
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/80">{item.summary || item.shortDescription}</p>

                <Link
                  href={`/facilities/${item.slug}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {visible.map((item) => (
          <span key={item.slug} className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        ))}
      </div>
    </section>
  );
}
