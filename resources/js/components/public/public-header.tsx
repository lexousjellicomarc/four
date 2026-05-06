import { Link, usePage } from '@inertiajs/react';
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Info,
  Menu,
  Moon,
  Palette,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type PublicSiteSettings = {
  logo_url?: string | null;
  city_seal_url?: string | null;
  baguio_logo_url?: string | null;
  breathe_baguio_logo_url?: string | null;
  visita_url?: string | null;
  arts_url?: string | null;
};

type PageProps = {
  siteSettings?: PublicSiteSettings;
};

type NavChild = {
  label: string;
  href: string;
  external?: boolean;
};

type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Government',
    href: '/tourism-office',
    children: [
      { label: 'Tourism Office', href: '/tourism-office' },
      { label: 'City Government Website', href: 'https://main.baguio.gov.ph/', external: true },
    ],
  },
  {
    label: 'Citizens Charter',
    href: '/guidelines',
    children: [
      { label: 'Booking Guidelines', href: '/guidelines' },
      { label: 'Facilities and Rates', href: '/facilities' },
      { label: 'Contact Office', href: '/contact' },
    ],
  },
  {
    label: 'Tourism',
    href: '/tourism-office',
    children: [
      { label: 'Tourism Office', href: '/tourism-office' },
      { label: 'Baguio City Events', href: '/events?type=city' },
      { label: 'Event Calendar', href: '/calendar' },
    ],
  },
  {
    label: 'News & Announcements',
    href: '/events',
    children: [
      { label: 'BCCC Events', href: '/events?type=bccc' },
      { label: 'Baguio City Events', href: '/events?type=city' },
      { label: 'Event Highlights', href: '/events#highlights' },
    ],
  },
  {
    label: 'About',
    href: '/facilities',
    children: [
      { label: 'About BCCC', href: '/facilities' },
      { label: 'Venue Spaces', href: '/facilities#spaces' },
      { label: 'Amenities', href: '/facilities#amenities' },
    ],
  },
  {
    label: 'More',
    href: '/contact',
    children: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Availability Calendar', href: '/calendar' },
      { label: 'Book Your Event', href: '/book' },
    ],
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function isActive(url: string, href: string): boolean {
  if (href === '/') {
    return url === '/' || url.startsWith('/?');
  }

  return url === href || url.startsWith(`${href}/`) || url.startsWith(`${href}?`);
}

function useThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('bccc-theme');
    const shouldDark = stored === 'dark';

    document.documentElement.classList.toggle('dark', shouldDark);
    setDark(shouldDark);
  }, []);

  function toggle() {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('bccc-theme', next ? 'dark' : 'light');

      return next;
    });
  }

  return { dark, toggle };
}

function FloatingInfoLinks({
  visitaUrl,
  artsUrl,
}: {
  visitaUrl: string;
  artsUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={cx('bgo-info-float', open && 'is-open')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <div className="bgo-info-float-menu">
        <a href={visitaUrl} target="_blank" rel="noreferrer">
          <span>VISITA</span>
          <small>Baguio tourist assistance</small>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <a href={artsUrl} target="_blank" rel="noreferrer">
          <span>ARTS</span>
          <small>Creative Baguio portal</small>
          <Palette className="h-3.5 w-3.5" />
        </a>
      </div>

      <button
        type="button"
        aria-label="Open Baguio quick links"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
      </button>
    </aside>
  );
}

export default function PublicHeader() {
  const { props, url } = usePage<PageProps>();
  const { dark, toggle } = useThemeToggle();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const settings = props.siteSettings || {};
  const sealUrl = settings.city_seal_url || settings.logo_url || '/images/baguio-city-seal.png';
  const breatheLogoUrl = settings.breathe_baguio_logo_url || settings.baguio_logo_url || '/images/breathe-baguio.png';
  const visitaUrl = settings.visita_url || 'https://visita.baguio.gov.ph/';
  const artsUrl = settings.arts_url || 'https://creativebaguio.com/';

  useEffect(() => {
    setMobileOpen(false);
    setExpanded(null);
  }, [url]);

  useEffect(() => {
    document.body.classList.toggle('bccc-official-menu-open', mobileOpen);

    return () => document.body.classList.remove('bccc-official-menu-open');
  }, [mobileOpen]);

  return (
    <>
      <header className="bgo-clean-header">
        <div className="bgo-clean-shell bgo-clean-header-inner">
          <Link href="/" className="bgo-clean-brand" aria-label="City Government of Baguio home">
            <span className="bgo-clean-seal">
              <img src={sealUrl} alt="City Government of Baguio seal" />
            </span>

            <span className="bgo-clean-brand-text">
              <strong>Republic of the Philippines</strong>
              <span>City Government of Baguio</span>
            </span>
          </Link>

          <nav className="bgo-clean-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="bgo-clean-nav-item">
                <Link href={item.href} className={cx('bgo-clean-nav-link', isActive(url, item.href) && 'is-active')}>
                  {item.label}
                  {item.children ? <ChevronDown className="h-3.5 w-3.5" /> : null}
                </Link>

                {item.children ? (
                  <div className="bgo-clean-dropdown">
                    {item.children.map((child) =>
                      child.external ? (
                        <a key={child.label} href={child.href} target="_blank" rel="noreferrer">
                          {child.label}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link key={child.label} href={child.href}>
                          {child.label}
                        </Link>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="bgo-clean-actions">
            <button
              type="button"
              className="bgo-clean-theme"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggle}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <a
              href="https://visita.baguio.gov.ph/"
              target="_blank"
              rel="noreferrer"
              className="bgo-clean-breathe"
              aria-label="Breathe Baguio"
            >
              <img src={breatheLogoUrl} alt="Breathe Baguio" />
            </a>

            <Link href="/book" className="bgo-clean-book">
              <CalendarDays className="h-4 w-4" />
              Book
            </Link>

            <button
              type="button"
              className="bgo-clean-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className={cx('bgo-clean-mobile-panel', mobileOpen && 'is-open')} aria-hidden={!mobileOpen}>
        <div className="bgo-clean-mobile-card">
          <div className="bgo-clean-mobile-brand">
            <img src={sealUrl} alt="City Government of Baguio seal" />

            <div>
              <strong>Republic of the Philippines</strong>
              <span>City Government of Baguio</span>
            </div>
          </div>

          <nav className="bgo-clean-mobile-nav" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="bgo-clean-mobile-group">
                <div className="bgo-clean-mobile-row">
                  <Link href={item.href} className={cx(isActive(url, item.href) && 'is-active')}>
                    {item.label}
                  </Link>

                  {item.children ? (
                    <button
                      type="button"
                      aria-label={`Toggle ${item.label}`}
                      onClick={() => setExpanded((current) => (current === item.label ? null : item.label))}
                    >
                      <ChevronDown className={cx('h-4 w-4', expanded === item.label && 'rotate-180')} />
                    </button>
                  ) : null}
                </div>

                {item.children && expanded === item.label ? (
                  <div className="bgo-clean-mobile-submenu">
                    {item.children.map((child) =>
                      child.external ? (
                        <a key={child.label} href={child.href} target="_blank" rel="noreferrer">
                          {child.label}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link key={child.label} href={child.href}>
                          {child.label}
                        </Link>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="bgo-clean-mobile-actions">
            <a href="https://visita.baguio.gov.ph/" target="_blank" rel="noreferrer">
              <img src={breatheLogoUrl} alt="Breathe Baguio" />
            </a>

            <Link href="/book">
              <CalendarDays className="h-4 w-4" />
              Book Your Event
            </Link>
          </div>
        </div>
      </div>

      <FloatingInfoLinks visitaUrl={visitaUrl} artsUrl={artsUrl} />
    </>
  );
}
