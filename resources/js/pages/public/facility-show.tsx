import { Head, Link } from '@inertiajs/react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  MapPin,
  Users,
} from 'lucide-react';
import { facilities as fallbackFacilities, type Facility } from '@/data/facilities';
import PublicLayout from '@/layouts/public-layout';
import PageHero from '@/components/public/page-hero';


type FacilityShowPageProps = {
  facility?: Facility | null;
  relatedFacilities?: Facility[];
};

function getExtendedPoints(facility: Facility) {
  const base = [...facility.details];

  if (facility.title.toLowerCase() === 'main hall') {
    return [
      ...base,
      'Includes stage access as part of the Main Hall experience',
      'Includes backstage support areas under the Main Hall presentation',
      'Includes dressing room support under the Main Hall presentation',
    ];
  }

  return base;
}

export default function FacilityShowPage({
  facility,
  relatedFacilities = [],
}: FacilityShowPageProps) {
  const fallback = fallbackFacilities[0];
  const currentFacility = facility ?? fallback;
  const points = getExtendedPoints(currentFacility);

  if (!facility) {
    return (
      <PublicLayout>
        <Head title="Facility Not Found" />
<PageHero
  eyebrow={currentFacility.category}
  title={currentFacility.title}
  description={currentFacility.shortDescription}
  backgroundImages={[
    currentFacility.lightImage,
    currentFacility.darkImage || currentFacility.lightImage,
  ]}
  actions={[
    { label: 'Book This Space', href: '/bookings/create' },
    { label: 'Ask About This Space', href: '/contact', variant: 'secondary' },
  ]}
/>

        <section className="mx-auto w-full max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-neutral-950 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:px-8">
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
                Facility Not Found
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
                The requested facility page is not available
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                The link may be incomplete, or the selected facility has not yet
                been configured for the public pages.
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href="/facilities"
                  className="inline-flex items-center rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
                >
                  Back to Facilities
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Head title={currentFacility.title} />

      <section className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-neutral-950 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="h-full min-h-[360px] overflow-hidden">
              <img
                src={currentFacility.lightImage}
                alt={currentFacility.title}
                className="h-full w-full object-cover dark:hidden"
              />
              <img
                src={currentFacility.darkImage}
                alt={currentFacility.title}
                className="hidden h-full w-full object-cover dark:block"
              />
            </div>

            <div className="space-y-5 px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {currentFacility.category}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {currentFacility.capacity}
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                  {currentFacility.title}
                </h1>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  {currentFacility.shortDescription}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Category
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {currentFacility.category}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Capacity / Type
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {currentFacility.capacity}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
                >
                  <Users className="h-4 w-4" />
                  Contact for Inquiry
                </Link>

                <Link
                  href="/calendar"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <CalendarDays className="h-4 w-4" />
                  Check Calendar
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-neutral-950">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">
                Space Overview
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Key points for this venue space
              </h2>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {currentFacility.summary}
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              {points.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-neutral-950">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Venue Notes
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Public information page
                </h2>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  This page is intended to help users understand the space before
                  they proceed to inquiry, availability checking, or formal booking coordination.
                </p>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Final layouts, operating conditions, and exact configuration
                  remain subject to venue approval, event type, and scheduling validation.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-8 shadow-sm dark:border-white/10 dark:bg-neutral-950">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Related Spaces
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Continue exploring other venue areas
                </h2>

                <Link
                  href="/facilities"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Back to all facilities
                </Link>
              </div>

              <div className="mt-6 grid gap-4">
                {relatedFacilities.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/facilities/${item.slug}`}
                    className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
                  >
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                        {item.category}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.shortDescription}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
