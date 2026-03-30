import { Head, usePage } from '@inertiajs/react';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import PageHero from '@/components/public/page-hero';
import PublicLayout, { type SiteSettings } from '@/layouts/public-layout';
import type { PublicEventItem, PublicSpaceItem } from '@/types/public-content';

type TourismMember = {
  id: number;
  fullName: string;
  designation: string;
  unitName?: string | null;
  email?: string | null;
  phone?: string | null;
  shortBio?: string;
  details?: string[];
  photo?: string | null;
  featured?: boolean;
};

type Props = {
  officeSpace?: PublicSpaceItem | null;
  events?: PublicEventItem[];
  members?: TourismMember[];
};

export default function TourismOfficePage({
  officeSpace,
  events = [],
  members = [],
}: Props) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const settings = page.props.siteSettings;

  return (
    <PublicLayout>
      <Head title="Tourism Office" />

      <PageHero
        eyebrow="Tourism Office"
        title="Tourism support, public assistance, and CTCAO team visibility."
        description="A cleaner public presentation of the Tourism Office, selected CTCAO team members, and public-facing coordination details."
        backgroundImages={[
          officeSpace?.lightImage || '/marketing/images/branding/noon.jpg',
          officeSpace?.darkImage || '/marketing/images/hero/night.png',
        ]}
        actions={[
          { label: 'Contact the Office', href: '/contact' },
          { label: 'View Public Events', href: '/events', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-8 pb-12">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">About the Office</h2>
            <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">
              {officeSpace?.summary ||
                'The Tourism Office supports visitors, public information, tourism assistance, and event-linked coordination for Baguio City.'}
            </p>

            <div className="mt-6 grid gap-3">
              {(officeSpace?.details || [
                'Visitor information and tourism guidance',
                'Public assistance for general venue and city tourism questions',
                'Basic event-related support and coordination',
              ]).map((detail, index) => (
                <div key={`${detail}-${index}`} className="rounded-[1.3rem] bg-[#f8f4ea] px-4 py-3 text-sm leading-7 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                  {detail}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Office Details</h2>
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
              <div className="flex items-center gap-3 rounded-[1.3rem] bg-[#f8f4ea] p-4 dark:bg-slate-900/70">
                <Clock3 className="h-4 w-4 shrink-0" />
                <span>Monday to Friday, 8:00 AM to 5:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {members.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">Office Team</h3>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => (
                <article
                  key={member.id}
                  className="overflow-hidden rounded-[1.9rem] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5"
                >
                  <div className="h-72 overflow-hidden bg-[#eaf4f1] dark:bg-slate-900/60">
                    {member.photo ? (
                      <img src={member.photo} alt={member.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl font-semibold text-[#0f8b6d] dark:text-[#b6c6ff]">
                        {member.fullName?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {member.unitName ? (
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                        {member.unitName}
                      </div>
                    ) : null}
                    <h4 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{member.fullName}</h4>
                    <p className="mt-1 text-sm font-medium text-[#0f8b6d] dark:text-[#b6c6ff]">{member.designation}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {member.shortBio || 'Public profile details may be maintained from the admin content area.'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {events.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">Public Event Picks</h3>
            <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
              {events.slice(0, 4).map((event, index) => (
                <div key={`${event.title}-${index}`} className="min-w-[300px] rounded-[1.7rem] border border-black/5 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">{event.scope === 'city' ? 'City Event' : 'BCCC Event'}</div>
                  <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{event.title}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{event.summary}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </PublicLayout>
  );
}
