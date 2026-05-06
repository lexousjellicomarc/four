import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import { useState } from 'react';

export default function OfficialHomeHero() {
  const [query, setQuery] = useState('');

  const searchHref = query.trim()
    ? `/events?q=${encodeURIComponent(query.trim())}`
    : '/events';

  return (
    <section className="bgo-clean-hero">
      <img
        src="/marketing/images/facilities/darkvip.jpg"
        alt="Baguio Convention and Cultural Center VIP facility"
        className="bgo-clean-hero-image"
      />

      <div className="bgo-clean-hero-overlay" />

      <div className="bgo-clean-shell bgo-clean-hero-inner">
        <div className="bgo-clean-hero-content">
          <p className="bgo-clean-hero-kicker">Official Booking Portal</p>

          <h1>Baguio Convention and Cultural Center</h1>

          <p className="bgo-clean-hero-copy">
            View facilities, check public calendar schedules, and submit official event booking requests through BCCC EASE.
          </p>

          <div className="bgo-clean-hero-search">
            <Search className="h-5 w-5" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              data-public-search-input
              placeholder="Search events, facilities, calendar..."
            />

            <Link href={searchHref}>
              Search
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bgo-clean-hero-actions">
            <Link href="/book" className="bgo-clean-hero-primary">
              <CalendarDays className="h-4 w-4" />
              Book Your Event
            </Link>

            <Link href="/calendar" className="bgo-clean-hero-secondary">
              View Calendar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
