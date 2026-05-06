import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Link } from '@inertiajs/react';
import {
    CalendarCheck,
    Mail,
    MapPin,
    Menu,
    Phone,
    Sparkles,
    X,
} from 'lucide-react';
import { type PropsWithChildren, useState } from 'react';

type PublicNavItem = {
    title: string;
    href: string;
};

const publicNav: PublicNavItem[] = [
    { title: 'Home', href: '/' },
    { title: 'Facilities', href: '/facilities' },
    { title: 'Events', href: '/events' },
    { title: 'Calendar', href: '/calendar' },
    { title: 'Tourism Office', href: '/tourism-office' },
    { title: 'Contact', href: '/contact' },
];

export default function PublicBookingLayout({ children }: PropsWithChildren) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="client-booking-public-shell">
            <header className="client-booking-public-header">
                <div className="client-booking-public-header-inner">
                    <Link href="/" className="client-booking-brand">
                        <div className="client-booking-brand-mark">
                            <CalendarCheck className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <p>BCCC EASE</p>
                            <span>Events Access & Scheduling</span>
                        </div>
                    </Link>

                    <nav className="client-booking-public-nav">
                        {publicNav.map((item) => (
                            <Link key={item.href} href={item.href}>
                                {item.title}
                            </Link>
                        ))}
                    </nav>

                    <div className="client-booking-header-actions">
                        <AppearanceToggleDropdown />

                        <Link
                            href="/book"
                            className="client-booking-header-cta"
                        >
                            Book Your Event
                        </Link>

                        <button
                            type="button"
                            className="client-booking-mobile-trigger"
                            onClick={() => setMobileOpen((current) => !current)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {mobileOpen ? (
                    <div className="client-booking-mobile-menu">
                        {publicNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                ) : null}
            </header>

            <main className="client-booking-public-main">
                <section className="client-booking-public-hero">
                    <div>
                        <div className="client-booking-public-eyebrow">
                            <Sparkles className="h-4 w-4" />
                            Baguio Convention & Cultural Center
                        </div>

                        <h1>Reserve your event space with confidence.</h1>

                        <p>
                            Select a venue package, review the official
                            reservation details, and submit your booking request
                            through a clean public-facing form.
                        </p>
                    </div>

                    <div className="client-booking-public-contact">
                        <div>
                            <MapPin className="h-4 w-4" />
                            <span>Baguio Convention and Cultural Center</span>
                        </div>

                        <div>
                            <Phone className="h-4 w-4" />
                            <span>(074) 446-2009</span>
                        </div>

                        <div>
                            <Mail className="h-4 w-4" />
                            <span>City Tourism, Culture and Arts Office</span>
                        </div>
                    </div>
                </section>

                <section className="client-booking-public-content">
                    {children}
                </section>
            </main>
        </div>
    );
}
