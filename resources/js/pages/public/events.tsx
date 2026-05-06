import { Head } from '@inertiajs/react';
import EventsHighlights from '@/components/public/events-highlights';
import PublicLayout from '@/layouts/public-layout';
import type { PublicEventItem } from '@/types/public-content';

export default function EventsPage({ events = [] }: { events?: PublicEventItem[] }) {
  return (
    <PublicLayout>
      <Head title="Events" />

      <EventsHighlights items={events} pageMode />
    </PublicLayout>
  );
}
