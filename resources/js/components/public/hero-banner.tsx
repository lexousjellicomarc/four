import { Link, usePage } from '@inertiajs/react';
import { Landmark, MapPinned, TentTree } from 'lucide-react';
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

function FloatingPromo({
  href,
  title,
  caption,
  icon: Icon,
  offset,
  delay,
}: {
  href: string;
  title: string;
  caption: string;
  icon: typeof TentTree;
  offset: string;
  delay: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`absolute right-3 ${offset} hidden w-[210px] rounded-[1.8rem] border border-white/28 bg-white/18 p-3 text-left text-white shadow-[0_18px_45px_rgba(15,23,42,0.22)] backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/24 lg:block`}
      style={{ animation: `heroCloudFloat 6.2s ease-in-out ${delay} infinite` }}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white/20 p-2">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">Quick Link</div>
          <div className="mt-1 text-sm font-semibold leading-5">{title}</div>
          <div className="mt-1 text-xs leading-5 text-white/80">{caption}</div>
        </div>
      </div>
    </a>
  );
}

export default function HeroBanner({ venueOptions }: Props) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const siteSettings = page.props.siteSettings;

  const visitaUrl = siteSettings?.visitaUrl || '/events';
  const creativeUrl = siteSettings?.creativeBaguioUrl || '/tourism-office';

  return (
    <section className="relative mt-0 min-h-[100svh] w-full overflow-hidden">
      <style>{`
        @keyframes heroCloudFloat {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(-4px); }
          50% { transform: translateY(-4px) translateX(5px); }
          75% { transform: translateY(-12px) translateX(-2px); }
        }
      `}</style>

      <img src="/marketing/images/hero/noon2.jpg" alt="Baguio panoramic view" className="absolute inset-0 h-full w-full object-cover dark:hidden" />
      <img src="/marketing/images/hero/night2.png" alt="Baguio panoramic view" className="absolute inset-0 hidden h-full w-full object-cover dark:block" />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18)_0%,rgba(15,23,42,0.10)_22%,rgba(15,23,42,0.24)_56%,rgba(15,23,42,0.46)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.18)_22%,rgba(2,6,23,0.36)_56%,rgba(2,6,23,0.68)_100%)]" />

      <FloatingPromo
        href={visitaUrl}
        title="VISITA Baguio"
        caption="Travel, itinerary, stay, and destination planning."
        icon={TentTree}
        offset="top-[150px]"
        delay="0s"
      />

      <FloatingPromo
        href={creativeUrl}
        title="Arts and Culture"
        caption="Creative spaces, programs, and culture updates."
        icon={MapPinned}
        offset="top-[330px]"
        delay="1.2s"
      />

      <div className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-8 pt-[112px] text-center sm:px-6 sm:pt-[118px] lg:px-10 lg:pt-[126px]">
        <div className="max-w-5xl">
          <div className="flex justify-center">
            <img
              src="/marketing/images/branding/breathe-dark.png"
              alt="Breathe Baguio"
              className="max-h-32 w-auto object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.18)] dark:hidden sm:max-h-44 lg:max-h-64"
            />
            <img
              src="/marketing/images/branding/breathe-light.png"
              alt="Breathe Baguio"
              className="hidden max-h-32 w-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.32)] dark:block sm:max-h-44 lg:max-h-64"
            />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold sm:text-5xl lg:text-6xl">Baguio Convention &amp; Cultural Center</h1>
            <h3 className="mt-2 text-lg font-extrabold sm:text-2xl lg:text-4xl">Events Access &amp; Scheduling Engine</h3>
          </div>

          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/88 sm:text-base">
            Public venue information, event highlights, calendar visibility, and booking guidance for the Baguio Convention and Cultural Center.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/bookings/create"
              className="inline-flex items-center rounded-full border border-white/30 bg-[#0f8b6d] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 dark:bg-[#294CFF]"
            >
              Book Now
            </Link>

            <Link
              href="/events"
              className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              Explore Events
            </Link>

            <a
              href={creativeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 lg:hidden"
            >
              <Landmark className="h-4 w-4" />
              Arts Website
            </a>
          </div>
        </div>

        <div className="mt-auto w-full max-w-6xl pt-8 lg:pt-12">
          <HeroAvailabilityBar venueOptions={venueOptions} />
          <div className="mt-4 text-center text-sm font-medium text-white/75">scroll down</div>
        </div>
      </div>
    </section>
  );
}
