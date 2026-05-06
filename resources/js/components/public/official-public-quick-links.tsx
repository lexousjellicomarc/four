import { Link } from '@inertiajs/react';
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  Landmark,
  MapPinned,
  Phone,
  Sparkles,
} from 'lucide-react';

const QUICK_LINKS = [
  {
    label: 'Book an Event',
    description: 'Start a venue reservation request for BCCC.',
    href: '/book',
    icon: CalendarDays,
  },
  {
    label: 'Check Calendar',
    description: 'View public event and availability dates.',
    href: '/calendar',
    icon: FileText,
  },
  {
    label: 'Explore Facilities',
    description: 'Review halls, packages, and venue amenities.',
    href: '/facilities',
    icon: Landmark,
  },
  {
    label: 'Tourism Office',
    description: 'Learn more about Baguio tourism support.',
    href: '/tourism-office',
    icon: MapPinned,
  },
  {
    label: 'Contact BCCC',
    description: 'Send an official inquiry to the office.',
    href: '/contact',
    icon: Phone,
  },
];

export default function OfficialPublicQuickLinks() {
  return (
    <section className="official-public-quick-section">
      <div className="official-public-shell">
        <div className="official-public-quick-heading">
          <p>
            <Sparkles className="h-4 w-4" />
            Official Online Services
          </p>

          <h2>Access BCCC services through one government-aligned portal.</h2>

          <span>
            Fast links for booking, calendar viewing, facility information, tourism assistance, and official inquiries.
          </span>
        </div>

        <div className="official-public-quick-grid">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.label} href={item.href} className="official-public-quick-card">
                <span>
                  <Icon className="h-5 w-5" />
                </span>

                <div>
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>

                <ArrowUpRight className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
