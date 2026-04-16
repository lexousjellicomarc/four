import { Head } from '@inertiajs/react';
import EventsHighlights from '@/components/public/events-highlights';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';
import type { PublicEventItem } from '@/types/public-content';

export default function EventsPage({ events = [] }: { events?: PublicEventItem[] }) {
  const featured = events.find((item) => item.highlighted) ?? events[0] ?? null;
  const heroImage = featured?.images?.[0] || featured?.image || '/marketing/images/events/lightmain.JPG';

  return (
    <PublicLayout>
      <Head title="Events" />

      <PageHero
        eyebrow="Events"
        title="BCCC and Baguio City events in one animated but clearer public page."
        description="This page now keeps both event groups inside the same interaction pattern so non-technical users can switch between them faster without getting lost."
        backgroundImages={[heroImage, heroImage]}
        actions={[
          { label: 'View Calendar', href: '/calendar' },
          { label: 'Book Now', href: '/bookings/create', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-8 pb-12">
        <EventsHighlights items={events} pageMode />
      </section>
    </PublicLayout>
  );
}
