import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Building2, LayoutGrid, Users } from 'lucide-react';
import { useMemo } from 'react';
import { facilities as fallbackFacilities, type Facility } from '@/data/facilities';
import PublicLayout from '@/layouts/public-layout';
import PageHero from '@/components/public/page-hero';

function groupFacilities(items: Facility[]) {
  const mainTitles = [
    'Foyer & Lobby',
    'Ground & Parking Area',
    'Grounds & Parking Area',
    'Basement',
    'VIP Lounge & Boardroom',
    'VIP Lounge',
    'Gallery2600',
    'Gallery 2600',
    'Main Hall',
    'Tech Booth',
    'Tourism Office',
  ];

  const isMain = (title: string) =>
    mainTitles.some((item) => item.toLowerCase() === title.toLowerCase());

  return {
    mainSpaces: items.filter((item) => isMain(item.title)),
    supportSpaces: items.filter((item) => !isMain(item.title)),
  };
}

export default function FacilitiesPage({ spaces }: { spaces?: Facility[] }) {
  const facilities = spaces && spaces.length > 0 ? spaces : fallbackFacilities;

  const { mainSpaces, supportSpaces } = useMemo(
    () => groupFacilities(facilities),
    [facilities],
  );

  return (
    <PublicLayout>
      <Head title="Facilities" />
<PageHero
  eyebrow="Venue Spaces"
  title="Explore the spaces of the Baguio Convention and Cultural Center"
  description="Browse the center’s public-facing venue areas, support spaces, and assistance zones before proceeding to inquiry or booking coordination."
  backgroundImages={[
    '/marketing/images/branding/noon.jpg',
    '/marketing/images/events/4.jpg',
    '/marketing/images/events/lightmain.JPG',
  ]}
  actions={[
    { label: 'Check Calendar', href: '/calendar' },
    { label: 'Ask for Venue Assistance', href: '/contact', variant: 'secondary' },
  ]}
/>

      <section className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-neutral-950 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5 px-6 py-8 sm:px-8 sm:py-10">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Venue Spaces
              </span>

              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                  Explore the spaces that shape the Baguio Convention and Cultural Center
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  Browse the center’s public-facing venue areas, support spaces,
                  and assistance zones before proceeding to inquiry or booking coordination.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Check Calendar
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Users className="h-4 w-4" />
                  Ask for Venue Assistance
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center border-t border-black/5 bg-[#f7f5ef] px-6 py-8 dark:border-white/10 dark:bg-white/5 lg:border-l lg:border-t-0">
              <div className="grid w-full gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-[#13141a]">
                  <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                    Main Public Spaces
                  </div>
                  <div className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">
                    {mainSpaces.length}
                  </div>
                </div>

                <div className="rounded-3xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-[#13141a]">
                  <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                    Support Spaces
                  </div>
                  <div className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">
                    {supportSpaces.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">
              Main Public Spaces
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Core venue areas
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {mainSpaces.map((facility) => (
              <article
                key={facility.slug}
                className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950"
              >
                <div className="h-64 overflow-hidden">
                  <img
                    src={facility.lightImage}
                    alt={facility.title}
                    className="h-full w-full object-cover dark:hidden"
                  />
                  <img
                    src={facility.darkImage}
                    alt={facility.title}
                    className="hidden h-full w-full object-cover dark:block"
                  />
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {facility.category}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {facility.capacity}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {facility.title}
                    </h3>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {facility.shortDescription}
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                      Suitable For
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {facility.details.slice(0, 3).map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/facilities/${facility.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
                  >
                    {facility.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {supportSpaces.length > 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                Supporting Areas
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Operational and assistance spaces
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {supportSpaces.map((facility) => (
                <article
                  key={facility.slug}
                  className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-950"
                >
                  <div className="space-y-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {facility.category}
                    </span>

                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {facility.title}
                    </h3>

                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {facility.shortDescription}
                    </p>

                    <div className="rounded-2xl border border-black/5 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Capacity / Type
                      </div>
                      <div className="mt-1 text-slate-600 dark:text-slate-300">
                        {facility.capacity}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/5 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Public Role
                      </div>
                      <div className="mt-1 text-slate-600 dark:text-slate-300">
                        Venue-linked assistance and operational support.
                      </div>
                    </div>

                    <Link
                      href={`/facilities/${facility.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
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
