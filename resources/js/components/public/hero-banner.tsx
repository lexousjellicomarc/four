import { Link, usePage } from '@inertiajs/react';
import HeroAvailabilityBar from '@/components/public/hero-availability-bar';
import type { SiteSettings } from '@/layouts/public-layout';

type VenueOption = {
  label: string;
  value: string;
  category?: string | null;
  capacity?: string | null;
};

type Props = {
  venueOptions: VenueOption[];
};

export default function HeroBanner({ venueOptions }: Props) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const siteSettings = page.props.siteSettings;

  return (
    <section className="public-container">
      <div className="hero-shadow relative min-h-[calc(100vh-8.5rem)] overflow-hidden rounded-[2.4rem] border border-white/20">
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
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,33,0.25)_0%,rgba(11,19,33,0.22)_28%,rgba(11,19,33,0.56)_72%,rgba(11,19,33,0.62)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.30)_0%,rgba(2,6,23,0.22)_28%,rgba(2,6,23,0.62)_72%,rgba(2,6,23,0.78)_100%)]" />

        <div className="relative flex min-h-[inherit] flex-col items-center justify-center px-6 py-16 text-center sm:px-8 lg:px-12">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-white backdrop-blur-md">
              Breathe Baguio
            </div>

            <div className="mt-6 flex justify-center">
              <img
                src="/marketing/images/branding/breathe-light.png"
                alt="Breathe Baguio"
                className="max-h-40 w-auto object-contain drop-shadow-[0_12px_35px_rgba(0,0,0,0.18)] dark:hidden sm:max-h-48 lg:max-h-56"
              />
              <img
                src="/marketing/images/branding/breathe-dark.png"
                alt="Breathe Baguio"
                className="hidden max-h-40 w-auto object-contain drop-shadow-[0_12px_35px_rgba(0,0,0,0.28)] dark:block sm:max-h-48 lg:max-h-56"
              />
            </div>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/90 sm:text-base">
              Public venue information, event highlights, calendar visibility, and booking guidance for the Baguio Convention and Cultural Center.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/bookings/create"
                className="inline-flex items-center rounded-full bg-[#0f8b6d] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
              >
                Book Now
              </Link>
              <Link
                href={siteSettings?.visitaUrl || '/events'}
                className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                Explore Events
              </Link>
            </div>
          </div>

          <div className="mt-auto w-full max-w-5xl pt-10">
            <HeroAvailabilityBar venueOptions={venueOptions} />
            <div className="mt-5 text-center text-sm text-white/70">scroll down</div>
          </div>
        </div>
      </div>
    </section>
  );
}
