import { Link } from '@inertiajs/react';
import { ArrowUp, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { SiteSettings } from '@/layouts/public-layout';

type Props = {
  siteSettings?: SiteSettings;
};

const footerNav = [
  { label: 'Home', href: '/' },
  { label: 'Facilities', href: '/facilities' },
  { label: 'Events', href: '/events' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Tourism Office', href: '/tourism-office' },
  { label: 'Contact', href: '/contact' },
  { label: 'Guidelines', href: '/guidelines' },
];

export default function PublicFooter({ siteSettings }: Props) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 520);
    handler();
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const openMapUrl = useMemo(
    () =>
      siteSettings?.openMapUrl ||
      'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines',
    [siteSettings?.openMapUrl],
  );

  const visitaUrl = siteSettings?.visitaUrl || 'https://visita.baguio.gov.ph';
  const artsUrl = siteSettings?.creativeBaguioUrl || 'https://creativecity.baguio.gov.ph';

  return (
    <>
      <footer className="w-full border-t border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
        <div className="mx-auto w-full">
          <div className="grid gap-8 border border-black/5 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.15fr_0.85fr_0.85fr_0.9fr] lg:p-8">
            <div className="space-y-4">
              <img
                src="/marketing/images/logo/lightlogo.png"
                alt="BCCC EASE"
                className="h-16 w-auto dark:hidden"
              />
              <img
                src="/marketing/images/logo/darklogo.png"
                alt="BCCC EASE"
                className="hidden h-16 w-auto dark:block"
              />
              <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                {siteSettings?.footerDescription ||
                  'BCCC EASE is the public information and venue guidance page for the Baguio Convention and Cultural Center.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/bookings/create"
                  className="rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-white dark:bg-[#294CFF]"
                >
                  Book Your Event
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] dark:border-white/10"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            <div>
              <div className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                Quick Links
              </div>
              <div className="grid gap-3 text-sm">
                {footerNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition hover:text-[#0f8b6d] dark:hover:text-[#9cb6ff]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                Baguio Links
              </div>
              <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                <a
                  href={visitaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition hover:text-[#0f8b6d] dark:hover:text-[#9cb6ff]"
                >
                  Visita Baguio
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href={artsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition hover:text-[#0f8b6d] dark:hover:text-[#9cb6ff]"
                >
                  Arts Website
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <div className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                Contact Details
              </div>
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <a href={openMapUrl} target="_blank" rel="noreferrer" className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{siteSettings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}</span>
                </a>
                <a href={`tel:${siteSettings?.phone || ''}`} className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{siteSettings?.phone || '(074) 446 2009'}</span>
                </a>
                <a href={`mailto:${siteSettings?.email || ''}`} className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{siteSettings?.email || 'info@bccc-ease.com'}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            {siteSettings?.footerCopyright || '© 2026 BCCC EASE • City Government of Baguio • All Rights Reserved'}
          </div>
        </div>
      </footer>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-[80] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0f8b6d] text-white shadow-xl transition hover:-translate-y-1 dark:bg-[#294CFF]"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
