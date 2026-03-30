import { Head } from '@inertiajs/react';
import AmenitiesRow from '@/components/public/amenities-row';
import EventsHighlights from '@/components/public/events-highlights';
import HeroBanner from '@/components/public/hero-banner';
import SpacesGrid from '@/components/public/spaces-grid';
import StatsBanner from '@/components/public/stats-banner';
import WelcomeSection from '@/components/public/welcome-section';
import PublicLayout from '@/layouts/public-layout';
import type {
  HomepageStatItem,
  PublicEventItem,
  PublicSpaceItem,
  VenueOption,
} from '@/types/public-content';

type Props = {
  venueOptions?: VenueOption[];
  events?: PublicEventItem[];
  spaces?: PublicSpaceItem[];
  stats?: HomepageStatItem[];
};

export default function Home({
  venueOptions = [],
  events = [],
  spaces = [],
  stats = [],
}: Props) {
  return (
    <PublicLayout>
      <Head title="Home" />

      <div className="space-y-0 pb-12">
        <HeroBanner venueOptions={venueOptions} />
        <WelcomeSection />
        <SpacesGrid items={spaces} />
        <StatsBanner items={stats} />
        <EventsHighlights items={events} />
        <AmenitiesRow />
      </div>
    </PublicLayout>
  );
}
