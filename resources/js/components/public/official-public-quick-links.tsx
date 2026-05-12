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
    description: 'Start a venue reservation request.',
    href: '/book',
    icon: CalendarDays,
  },
  {
    label: 'Check Calendar',
    description: 'Review public dates and events.',
    href: '/calendar',
    icon: FileText,
  },
  {
    label: 'Facilities',
    description: 'View spaces and venue details.',
    href: '/facilities',
    icon: Landmark,
  },
  {
    label: 'Tourism Office',
    description: 'Open CTCAO public information.',
    href: '/tourism-office',
    icon: MapPinned,
  },
  {
    label: 'Contact BCCC',
    description: 'Send official inquiries.',
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

          <h2>Fast access to BCCC public services.</h2>

          <span>
            Compact links for booking, calendar viewing, facilities, tourism assistance, and office inquiries.
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
