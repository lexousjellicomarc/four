import { Head } from '@inertiajs/react';
import type { EventItem } from '@/data/events';
import type { Facility } from '@/data/facilities';
import type { OfferItem } from '@/data/offers';
import type { StatItem } from '@/data/stats';
import AmenitiesRow from '@/components/public/amenities-row';
import EventsHighlights from '@/components/public/events-highlights';
import HeroBanner from '@/components/public/hero-banner';
import LocationAssistance from '@/components/public/location-assistance';
import SpacesGrid from '@/components/public/spaces-grid';
import SpecialOffers from '@/components/public/special-offers';
import StatsBanner from '@/components/public/stats-banner';
import WelcomeSection from '@/components/public/welcome-section';
import PublicLayout from '@/layouts/public-layout';

type VenueOption = {
  label: string;
  value: string;
  category?: string | null;
  capacity?: string | null;
};

type HomeProps = {
  venueOptions?: VenueOption[];
  events?: EventItem[];
  spaces?: Facility[];
  stats?: StatItem[];
  offers?: OfferItem[];
};

export default function Home({
  venueOptions = [],
  events = [],
  spaces = [],
  stats = [],
  offers = [],
}: HomeProps) {
  return (
    <PublicLayout>
      <Head title="Home" />

      <div className="space-y-8 pb-12 lg:space-y-10">
        <HeroBanner venueOptions={venueOptions} />
        <WelcomeSection />
        <SpacesGrid items={spaces} />
        <StatsBanner items={stats} />
        <EventsHighlights items={events} />
        <LocationAssistance />
        <SpecialOffers items={offers} />
        <AmenitiesRow />
      </div>
    </PublicLayout>
  );
}
