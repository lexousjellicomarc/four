import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Search, Sparkles, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { PublicSpaceItem } from '@/types/public-content';
import { cn } from '@/lib/utils';

export default function FacilitiesPage({ spaces = [] }: { spaces?: PublicSpaceItem[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return spaces;

    return spaces.filter((item) =>
      [item.title, item.category, item.capacity, item.summary, item.shortDescription, ...(item.details ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [search, spaces]);

  const featured = filtered[0] ?? spaces[0];

  return (
    <PublicLayout>
      <Head title="Facilities" />

      <PageHero
        eyebrow="Facilities"
        title="A luxury-style venue presentation for every BCCC facility."
        description="The facility page now behaves more like a premium hotel showcase, with richer image treatment, larger spotlight moments, and cleaner room-by-room discovery."
        backgroundImages={[
          featured?.lightImage || featured?.image || '/marketing/images/branding/noon.jpg',
          featured?.darkImage || featured?.image || '/marketing/images/hero/night.png',
        ]}
        actions={[
          { label: 'Check Calendar', href: '/calendar' },
          { label: 'Book Now', href: '/bookings/create', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-8 pb-14">
        <div className="overflow-hidden rounded-[2.15rem] border border-black/5 bg-white/82 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-h-[420px] overflow-hidden">
              <img
                src={featured?.lightImage || featured?.image || '/marketing/images/branding/noon.jpg'}
                alt={featured?.title || 'Featured facility'}
                className="h-full w-full object-cover dark:hidden"
              />
              <img
                src={featured?.darkImage || featured?.image || '/marketing/images/branding/noon.jpg'}
                alt={featured?.title || 'Featured facility'}
                className="hidden h-full w-full object-cover dark:block"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.76))]" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] backdrop-blur-md">
                  Featured Space
                </div>
                <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{featured?.title || 'BCCC Facility'}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/86">
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">{featured?.category || 'Venue Space'}</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                    <Users className="h-4 w-4" />
                    {featured?.capacity || 'Flexible capacity'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f8f4ea] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#174f40] dark:bg-slate-900/70 dark:text-[#b6c6ff]">
                  <Sparkles className="h-4 w-4" />
                  Hotel-style Facility Presentation
                </div>

                <p className="mt-5 text-sm leading-8 text-slate-600 dark:text-slate-300">
                  {featured?.summary || featured?.shortDescription || 'Discover the venue through a more premium and immersive public presentation.'}
                </p>

                <div className="mt-6 grid gap-3">
                  {(featured?.details?.length ? featured.details : [
                    'Designed for polished public and private event staging.',
                    'Supports flexible layouts from conferences to special functions.',
                    'Blends formal venue service with visual warmth for public browsing.',
                  ]).slice(0, 4).map((detail, index) => (
                    <div
                      key={`${detail}-${index}`}
                      className="rounded-[1.35rem] border border-black/5 bg-[#f8f4ea] px-4 py-3 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300"
                    >
                      {detail}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={featured ? `/facilities/${featured.slug}` : '/facilities'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
                >
                  View Featured Space
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <label className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search facilities"
                    className="w-full bg-transparent text-sm font-medium outline-none"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[1.9rem] border border-dashed border-black/10 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            No facilities matched your search.
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((space, index) => {
              const reversed = index % 2 === 1;

              return (
                <article
                  key={String(space.id)}
                  className="overflow-hidden rounded-[2.2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5"
                >
                  <div className={cn('grid gap-0 lg:grid-cols-[1.08fr_0.92fr]', reversed && 'lg:grid-cols-[0.92fr_1.08fr]')}>
                    <div className={cn('relative min-h-[380px] overflow-hidden', reversed && 'lg:order-2')}>
                      <img src={space.lightImage || space.image} alt={space.title} className="h-full w-full object-cover dark:hidden" />
                      <img src={space.darkImage || space.image} alt={space.title} className="hidden h-full w-full object-cover dark:block" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.74))]" />
                      <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/28 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
                        {space.category}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                        <h3 className="text-3xl font-semibold">{space.title}</h3>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-3 py-2 text-sm text-white/86">
                          <Users className="h-4 w-4" />
                          {space.capacity}
                        </div>
                      </div>
                    </div>

                    <div className={cn('flex flex-col justify-between p-6 sm:p-8', reversed && 'lg:order-1')}>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#174f40] dark:text-[#b6c6ff]">
                          Signature Space
                        </div>
                        <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">
                          {space.summary || space.shortDescription}
                        </p>

                        <div className="mt-6 grid gap-3">
                          {(space.details?.length ? space.details : [space.shortDescription || space.summary]).slice(0, 4).map((detail, detailIndex) => (
                            <div
                              key={`${space.id}-${detailIndex}`}
                              className="rounded-[1.25rem] border border-black/5 bg-[#f8f4ea] px-4 py-3 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300"
                            >
                              {detail}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                          href={`/facilities/${space.slug}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
                        >
                          {space.ctaLabel || 'View Space'}
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        <Link
                          href={`/bookings/create?venue=${encodeURIComponent(space.title)}`}
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                        >
                          Reserve this venue
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
