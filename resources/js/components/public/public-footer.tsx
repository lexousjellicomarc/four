import { Link } from '@inertiajs/react';
import { ArrowUp, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SiteSettings } from '@/layouts/public-layout';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Facilities', href: '/facilities' },
  { label: 'Events', href: '/events' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Tourism Office', href: '/tourism-office' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Guidelines', href: '/guidelines' },
];

type PublicFooterProps = {
  siteSettings?: SiteSettings;
};

export default function PublicFooter({ siteSettings }: PublicFooterProps) {
  const footerRef = useRef<HTMLElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const address = siteSettings?.address ?? 'CH3X+RRW, Baguio, Benguet, Philippines';
  const phone = siteSettings?.phone ?? '(074) 446 2009';
  const email = siteSettings?.email ?? 'info@bccc-ease.com';
  const openMapUrl =
    siteSettings?.openMapUrl ??
    'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines';
  const footerDescription =
    siteSettings?.footerDescription ??
    'A public-facing venue platform for space discovery, event highlights, schedule visibility, and booking guidance for the Baguio Convention and Cultural Center.';
  const footerCopyright =
    siteSettings?.footerCopyright ??
    '© 2026 BCCC EASE • City Government of Baguio • All Rights Reserved';

  useEffect(() => {
    const node = footerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollTop(entry.isIntersecting),
      { threshold: 0.18 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <footer
        ref={footerRef}
        className="border-t border-black/5 bg-white dark:border-white/10 dark:bg-[#121318]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.9fr] lg:px-8">
          <div className="space-y-4">
            <img
              src="/marketing/images/logo/lightlogo.png"
              alt="BCCC EASE"
              className="h-14 w-auto object-contain dark:hidden"
            />
            <img
              src="/marketing/images/logo/darklogo.png"
              alt="BCCC EASE"
              className="hidden h-14 w-auto object-contain dark:block"
            />

            <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {footerDescription}
            </p>

            <div className="flex flex-wrap gap-3">
              {siteSettings?.visitaUrl ? (
                <a
                  href={siteSettings.visitaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-[#0f8b6d] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Baguio VISITA
                </a>
              ) : null}

              {siteSettings?.creativeBaguioUrl ? (
                <a
                  href={siteSettings.creativeBaguioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
                >
                  Creative Baguio
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
              Quick Links
            </h4>

            <nav className="grid gap-3 text-sm">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[#0f8b6d] dark:hover:text-[#8ea3ff]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
              Contact Details
            </h4>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <a
                href={openMapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 transition hover:text-[#0f8b6d] dark:hover:text-[#8ea3ff]"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{address}</span>
              </a>

              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 transition hover:text-[#0f8b6d] dark:hover:text-[#8ea3ff]"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>{phone}</span>
              </a>

              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 transition hover:text-[#0f8b6d] dark:hover:text-[#8ea3ff]"
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span>{email}</span>
              </a>
            </div>

            <div className="rounded-2xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5">
              <h5 className="text-sm font-semibold">Need Venue Assistance?</h5>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Start your inquiry, review event highlights, or proceed to the public schedule pages for guidance.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center rounded-full bg-[#0f8b6d] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Start Inquiry
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 px-4 py-4 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          {footerCopyright}
        </div>
      </footer>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0f8b6d] text-white shadow-lg transition hover:-translate-y-1"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
