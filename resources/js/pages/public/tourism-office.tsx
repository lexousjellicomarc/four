import { Head, usePage } from '@inertiajs/react';
import { CalendarDays, Clock3, Mail, MapPin, Phone, Users2 } from 'lucide-react';
import { useMemo } from 'react';
import PageHero from '@/components/public/page-hero';
import SafeImage from '@/components/ui/safe-image';
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
  officeSection?: string | null;
  teamName?: string | null;
  reportsToId?: number | null;
  treeLevel?: number | null;
};

type Props = {
  officeSpace?: PublicSpaceItem | null;
  events?: PublicEventItem[];
  members?: TourismMember[];
};

function groupBySection(members: TourismMember[]) {
  const grouped = new Map<string, TourismMember[]>();

  members.forEach((member) => {
    const key = member.officeSection || member.teamName || member.unitName || 'Office Team';
    grouped.set(key, [...(grouped.get(key) || []), member]);
  });

  return Array.from(grouped.entries());
}

export default function TourismOfficePage({ officeSpace, events = [], members = [] }: Props) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const settings = page.props.siteSettings;
  const groupedMembers = useMemo(() => groupBySection(members), [members]);

  return (
    <PublicLayout>
      <Head title="Tourism Office" />

      <PageHero
        eyebrow="Tourism Office"
        title="Tourism support, public assistance, and CTCAO team visibility."
        description="A clearer public presentation of the Tourism Office, selected CTCAO team members, and public-facing coordination details."
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

        {groupedMembers.length > 0 ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Users2 className="h-6 w-6 text-[#0f8b6d] dark:text-[#b6c6ff]" />
              <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">Office Team</h3>
            </div>

            <div className="space-y-6">
              {groupedMembers.map(([section, sectionMembers]) => (
                <div key={section} className="rounded-[2rem] border border-black/5 bg-white/86 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5">
                  <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#0f8b6d]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
                    {section}
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {sectionMembers.map((member) => (
                      <article key={member.id} className="overflow-hidden rounded-[1.9rem] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5">
                        <div className="h-72 overflow-hidden bg-[#eaf4f1] dark:bg-slate-900/60">
                          {member.photo ? (
                            <SafeImage src={member.photo} fallbackSrc="/marketing/images/branding/noon.jpg" alt={member.fullName} className="h-full w-full" imgClassName="h-full w-full object-cover" />
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

                          {member.details && member.details.length > 0 ? (
                            <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                              {member.details.slice(0, 4).map((detail, index) => (
                                <li key={`${member.id}-${index}`}>• {detail}</li>
                              ))}
                            </ul>
                          ) : null}

                          <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            {member.email ? <div>Email: {member.email}</div> : null}
                            {member.phone ? <div>Phone: {member.phone}</div> : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {events.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">Public Event Picks</h3>
            <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
              {events.slice(0, 4).map((event) => (
                <article key={String(event.id)} className="min-w-[300px] overflow-hidden rounded-[1.7rem] border border-black/5 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5">
                  <div className="h-44 overflow-hidden">
                    <SafeImage src={event.images?.[0] || event.image} fallbackSrc="/marketing/images/events/1.JPG" alt={event.title} className="h-full w-full" imgClassName="h-full w-full object-cover" />
                  </div>
                  <div className="p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                      {event.scope === 'city' ? 'City Event' : 'BCCC Event'}
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{event.title}</div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {event.date}
                      </div>
                      {event.time ? (
                        <div className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          {event.time}
                        </div>
                      ) : null}
                      <div className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.venue}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{event.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </PublicLayout>
  );
}
