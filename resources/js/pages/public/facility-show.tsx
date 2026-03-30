import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Users } from 'lucide-react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { PublicSpaceItem } from '@/types/public-content';

type Props = {
  facility?: PublicSpaceItem | null;
  relatedFacilities?: PublicSpaceItem[];
};

export default function FacilityShowPage({
  facility,
  relatedFacilities = [],
}: Props) {
  if (!facility) {
    return (
      <PublicLayout>
        <Head title="Facility" />
        <section className="public-container py-20">
          <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/80 p-10 text-center text-sm dark:border-white/10 dark:bg-white/5">
            Facility not found.
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Head title={facility.title} />

      <PageHero
        eyebrow={facility.category}
        title={facility.title}
        description={facility.summary || facility.shortDescription}
        backgroundImages={[facility.lightImage || facility.image, facility.darkImage || facility.image]}
        actions={[
          { label: 'Book This Space', href: '/bookings/create' },
          { label: 'Back to Facilities', href: '/facilities', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-8 pb-12">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <img src={facility.lightImage || facility.image} alt={facility.title} className="h-[420px] w-full object-cover dark:hidden" />
            <img src={facility.darkImage || facility.image} alt={facility.title} className="hidden h-[420px] w-full object-cover dark:block" />
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <div className="public-chip border-[#0f8b6d]/20 bg-[#0f8b6d]/10 text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
              Space Details
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{facility.title}</h2>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Users className="h-4 w-4" />
              {facility.capacity}
            </div>
            <p className="mt-5 text-sm leading-8 text-slate-600 dark:text-slate-300">
              {facility.summary || facility.shortDescription}
            </p>

            <div className="mt-6 space-y-3">
              {(facility.details || []).map((detail, index) => (
                <div
                  key={`${detail}-${index}`}
                  className="rounded-[1.2rem] bg-[#f8f4ea] px-4 py-3 text-sm leading-7 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300"
                >
                  {detail}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/bookings/create"
                className="inline-flex rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white dark:bg-[#294CFF]"
              >
                Book This Space
              </Link>
              <Link
                href="/contact"
                className="inline-flex rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/10"
              >
                Ask About This Space
              </Link>
            </div>
          </div>
        </div>

        {relatedFacilities.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Related Spaces</h3>
            <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
              {relatedFacilities.map((item) => (
                <article
                  key={item.slug}
                  className="min-w-[280px] max-w-[280px] overflow-hidden rounded-[1.7rem] border border-black/5 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5"
                >
                  <div className="h-52 overflow-hidden">
                    <img src={item.lightImage || item.image} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5">
                    <h4 className="text-xl font-semibold text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.shortDescription}</p>
                    <Link
                      href={`/facilities/${item.slug}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-4 py-2 text-sm font-semibold text-white dark:bg-[#294CFF]"
                    >
                      View Space
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </PublicLayout>
  );
}
