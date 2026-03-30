import { Head, Link } from '@inertiajs/react';
import { Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { PublicSpaceItem } from '@/types/public-content';

export default function FacilitiesPage({ spaces = [] }: { spaces?: PublicSpaceItem[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return spaces;

    return spaces.filter((item) => {
      return [item.title, item.category, item.capacity, item.summary, item.shortDescription]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [search, spaces]);

  const featured = filtered[0] ?? spaces[0];

  return (
    <PublicLayout>
      <Head title="Facilities" />

      <PageHero
        eyebrow="Facilities"
        title="Browse venue spaces with a more premium and guided presentation."
        description="Review the main hall, lounges, foyers, boardroom spaces, and other key areas available within the public-facing venue guide."
        backgroundImages={[
          featured?.lightImage || '/marketing/images/branding/noon.jpg',
          featured?.darkImage || '/marketing/images/hero/night.png',
        ]}
        actions={[
          { label: 'Check Calendar', href: '/calendar' },
          { label: 'Book Now', href: '/bookings/create', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-8 pb-12">
        <div className="glass-card rounded-[1.8rem] p-3">
          <div className="flex items-center gap-3 rounded-[1.2rem] bg-white/80 px-4 py-3 dark:bg-slate-900/80">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search spaces"
              className="w-full bg-transparent text-sm font-medium outline-none"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((space) => (
            <article
              key={space.slug}
              className="overflow-hidden rounded-[1.9rem] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5"
            >
              <div className="relative h-72 overflow-hidden">
                <img src={space.lightImage || space.image} alt={space.title} className="h-full w-full object-cover dark:hidden" />
                <img src={space.darkImage || space.image} alt={space.title} className="hidden h-full w-full object-cover dark:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">{space.category}</div>
                  <h2 className="mt-2 text-2xl font-semibold">{space.title}</h2>
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-white/80">
                    <Users className="h-4 w-4" />
                    {space.capacity}
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {space.summary || space.shortDescription}
                </p>
                <Link
                  href={`/facilities/${space.slug}`}
                  className="inline-flex rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white dark:bg-[#294CFF]"
                >
                  View Space
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
