import { Head, usePage } from '@inertiajs/react';
import { Mail, MapPin, Phone } from 'lucide-react';
import PageHero from '@/components/public/page-hero';
import PublicLayout, { type SiteSettings } from '@/layouts/public-layout';

export default function ContactPage() {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const settings = page.props.siteSettings;

  return (
    <PublicLayout>
      <Head title="Contact" />

      <PageHero
        eyebrow="Contact"
        title="Get in touch for venue guidance, inquiries, and public assistance."
        description="Use the contact details below for general questions, booking guidance, and coordination support."
        backgroundImages={['/marketing/images/branding/sunrise.jpg', '/marketing/images/hero/night.png']}
        actions={[
          { label: 'Proceed to Booking', href: '/bookings/create' },
          { label: 'View Guidelines', href: '/guidelines', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 grid gap-6 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Contact Details</h2>

          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-3 rounded-[1.3rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{settings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-[1.3rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{settings?.phone || '(074) 446 2009'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-[1.3rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{settings?.email || 'info@bccc-ease.com'}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
          {settings?.mapEmbedUrl ? (
            <iframe
              src={settings.mapEmbedUrl}
              className="h-[460px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="BCCC location map"
            />
          ) : (
            <div className="flex h-[460px] items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-300">
              Map embed is not available yet.
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
