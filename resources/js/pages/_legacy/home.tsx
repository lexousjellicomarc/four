import { Head } from '@inertiajs/react';
import AmenitiesRow from '@/components/public/amenities-row';
import AvailabilityStrip from '@/components/public/availability-strip';
import EventsHighlights from '@/components/public/events-highlights';
import HeroBanner from '@/components/public/hero-banner';
import LocationAssistance from '@/components/public/location-assistance';
import SpacesGrid from '@/components/public/spaces-grid';
import SpecialOffers from '@/components/public/special-offers';
import StatsBanner from '@/components/public/stats-banner';
import WelcomeSection from '@/components/public/welcome-section';
import PublicLayout from '@/layouts/public-layout';
import type { VenueOption } from '@/types/public-content';

type HomeProps = {
    venueOptions: VenueOption[];
};

export default function Home({ venueOptions = [] }: HomeProps) {
    return (
        <PublicLayout>
            <Head title="Home" />

            <div className="space-y-8 pb-12 lg:space-y-10">
                <HeroBanner venueOptions={[]} />
                <AvailabilityStrip venueOptions={venueOptions} />
                <WelcomeSection />
                <SpacesGrid spaces={[]} />
                <StatsBanner stats={[]} />
                <EventsHighlights bcccEvents={[]} cityEvents={[]} />
                <LocationAssistance />
                <SpecialOffers packages={[]} />
                <AmenitiesRow />
            </div>
        </PublicLayout>
    );
}
