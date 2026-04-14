import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, Mail, MapPin, Phone } from 'lucide-react';
import type { SiteSettings } from '@/layouts/public-layout';

export default function LocationAssistance() {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const siteSettings = page.props.siteSettings;

  const address = siteSettings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines';
  const phone = siteSettings?.phone || '(074) 446 2009';
  const email = siteSettings?.email || 'info@bccc-ease.com';
  const openMapUrl =
    siteSettings?.openMapUrl ||
    'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines';
  const mapEmbedUrl =
    siteSettings?.mapEmbedUrl ||
    'https://www.google.com/maps?q=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines&z=16&output=embed';

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-6 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-neutral-950 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6 px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Location &amp; Assistance
            </span>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                View the convention center on the map
              </h2>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                Open the full map for route guidance, or use the contact details below for direct assistance.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <a
              href={openMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{address}</span>
            </a>

            <a
              href={`tel:${phone}`}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span>{phone}</span>
            </a>

            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>{email}</span>
            </a>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={openMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
            >
              Open Map
            </a>

            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Ask for Assistance
            </Link>

            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              <CalendarDays className="h-4 w-4" />
              View Calendar
            </Link>
          </div>
        </div>

        <div className="min-h-[360px] border-t border-black/5 bg-slate-100 dark:border-white/10 dark:bg-slate-900 lg:border-l lg:border-t-0">
          <iframe
            title="Baguio Convention and Cultural Center Map"
            src={mapEmbedUrl}
            className="h-full min-h-[360px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
