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
    <section className="relative min-h-screen w-full mt-0 overflow-hidden">
      <img
        src="/marketing/images/hero/noon2.jpg"
        alt="Baguio panoramic view"
        className="absolute inset-0 h-full w-full object-cover dark:hidden"
      />
      <img
        src="/marketing/images/hero/night2.png"
        alt="Baguio panoramic view"
        className="absolute inset-0 hidden h-full w-full object-cover dark:block"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18)_0%,rgba(15,23,42,0.10)_20%,rgba(15,23,42,0.24)_58%,rgba(15,23,42,0.42)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.16)_20%,rgba(2,6,23,0.36)_58%,rgba(2,6,23,0.60)_100%)]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-10 pt-28 text-center sm:px-6 lg:px-10">
        <div className="max-w-5xl">
          <div className="flex justify-center">
            <img
              src="/marketing/images/branding/breathe-dark.png"
              alt="Breathe Baguio"
              className="max-h-44 w-auto object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.18)] dark:hidden sm:max-h-56 lg:max-h-72"
            />
            <img
              src="/marketing/images/branding/breathe-light.png"
              alt="Breathe Baguio"
              className="hidden max-h-44 w-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.32)] dark:block sm:max-h-56 lg:max-h-72"
            />
          </div>

          <div>
            <h1 className='font-extrabold text-5xl'>
              Baguio Convention & Cultural Center
            </h1>
            <h3 className='font-extrabold text-4xl'>
              Events Access & Scheduling Engine
            </h3>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/bookings/create"
              className="inline-flex items-center rounded-full border border-white/30 bg-[#0f8b6d] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 dark:bg-[#294CFF]"
            >
              Book Now
            </Link>

            <Link
              href={siteSettings?.visitaUrl || '/events'}
              className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              Explore Events
            </Link>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/88">
            Public venue information, event highlights, calendar visibility, and booking guidance for the Baguio Convention and Cultural Center.
          </p>
        </div>

        <div className="mt-auto w-full max-w-6xl pt-12">
          <HeroAvailabilityBar venueOptions={venueOptions} />
          <div className="mt-4 text-center text-sm font-medium text-white/75">scroll down</div>
        </div>
      </div>
    </section>
  );
}
