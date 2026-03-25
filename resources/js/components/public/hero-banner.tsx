import { Link, usePage } from '@inertiajs/react';
import HeroAvailabilityBar from '@/components/public/hero-availability-bar';
import type { SiteSettings } from '@/layouts/public-layout';

type VenueOption = {
  label: string;
  value: string;
  category?: string | null;
  capacity?: string | null;
};

interface HeroBannerProps {
  venueOptions: VenueOption[];
}

export default function HeroBanner({ venueOptions }: HeroBannerProps) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const siteSettings = page.props.siteSettings;

  return (
    <section className="px-4 pt-4 lg:px-6">
      <div className="relative mx-auto min-h-[calc(100vh-7.5rem)] max-w-7xl overflow-hidden rounded-[2.2rem] border border-white/20 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <img
          src="/marketing/images/branding/noon.jpg"
          alt="Baguio panoramic view"
          className="absolute inset-0 h-full w-full object-cover dark:hidden"
        />
        <img
          src="/marketing/images/hero/night.png"
          alt="Baguio panoramic view"
          className="absolute inset-0 hidden h-full w-full object-cover dark:block"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,18,0.18)_0%,rgba(8,12,18,0.28)_28%,rgba(8,12,18,0.62)_100%)]" />

        <div className="relative flex min-h-[inherit] flex-col justify-center px-6 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.34em] text-white backdrop-blur">
              Breathe Baguio
            </div>

            <div className="mt-6 flex justify-center">
              <img
                src="/marketing/images/branding/breathe-light.png"
                alt="Breathe Baguio"
                className="max-h-44 w-auto object-contain dark:hidden sm:max-h-52"
              />
              <img
                src="/marketing/images/branding/breathe-dark.png"
                alt="Breathe Baguio"
                className="hidden max-h-44 w-auto object-contain dark:block sm:max-h-52"
              />
            </div>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/85 sm:text-base">
              Public information, event visibility, venue discovery, and availability checking for the Baguio Convention and Cultural Center.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/bookings/create"
                className="inline-flex items-center rounded-full bg-[#0f8b6d] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Book Now
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                Inquire
              </Link>
            </div>

            {(siteSettings?.visitaUrl || siteSettings?.creativeBaguioUrl) && (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {siteSettings?.visitaUrl ? (
                  <a
                    href={siteSettings.visitaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/30"
                  >
                    Accommodations & Itinerary
                  </a>
                ) : null}

                {siteSettings?.creativeBaguioUrl ? (
                  <a
                    href={siteSettings.creativeBaguioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/30"
                  >
                    Creative Baguio
                  </a>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-10">
            <HeroAvailabilityBar venueOptions={venueOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}
