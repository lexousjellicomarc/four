import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Clock3, Mail, MapPin, Phone, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EventItem } from '@/data/events';
import type { Facility } from '@/data/facilities';
import PageHero from '@/components/public/page-hero';
import PublicLayout, { type SiteSettings } from '@/layouts/public-layout';

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

type TourismOfficePageProps = {
  officeSpace?: Facility | null;
  events?: EventItem[];
  members?: TourismMember[];
};

const fallbackServices = [
  'Visitor information and basic tourism guidance',
  'Public assistance and venue-related inquiries',
  'Coordination support for tourism-linked activities',
  'Reference point for local destination orientation',
];

const fallbackDivisions = [
  'Customer Service Assistant (CSA)',
  'Benchmarking',
  'Procurements',
  'Marketing & Promotions Division',
  'Creative Baguio City',
  'Tourism Assistance',
];

export default function TourismOfficePage({
  officeSpace,
  events = [],
  members = [],
}: TourismOfficePageProps) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const siteSettings = page.props.siteSettings;
  const [selectedMember, setSelectedMember] = useState<TourismMember | null>(null);

  const services =
    officeSpace?.details && officeSpace.details.length > 0
      ? officeSpace.details
      : fallbackServices;

  const address = siteSettings?.address ?? 'CH3X+RRW, Baguio, Benguet, Philippines';
  const phone = siteSettings?.phone ?? '(074) 446 2009';
  const email = siteSettings?.email ?? 'info@bccc-ease.com';

  const groupedUnits = useMemo(() => {
    const units = members
      .map((member) => member.unitName?.trim())
      .filter(Boolean) as string[];

    return Array.from(new Set(units));
  }, [members]);

  return (
    <PublicLayout>
      <Head title="Tourism Office" />

      <div className="space-y-10 pb-12">
        <PageHero
          eyebrow="City Tourism, Culture and Arts Office"
          title="Tourism Office and CTCAO team"
          description="Tourism support, public assistance, creative-sector connection, and office team presentation in one public-facing page."
          backgroundImages={[
            officeSpace?.lightImage || '/marketing/images/branding/noon.jpg',
            '/marketing/images/events/lightmain.JPG',
            '/marketing/images/events/4.jpg',
          ]}
          actions={[
            { label: 'Contact the Office', href: '/contact' },
            { label: 'View Events', href: '/events', variant: 'secondary' },
          ]}
        />

        <section className="mx-auto w-full max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318] sm:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                About the Office
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Tourism coordination point
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">
                {officeSpace?.summary ??
                  'The Tourism Office complements the center’s identity as both a civic venue and a public destination by supporting visitors, public information, and tourism-linked coordination.'}
              </p>

              <div className="mt-6 grid gap-3">
                {services.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    • {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {siteSettings?.creativeBaguioUrl ? (
                  <a
                    href={siteSettings.creativeBaguioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-[#0f8b6d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Visit Creative Baguio
                  </a>
                ) : null}

                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Office Inquiry
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Public Information
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Office details
                </h2>

                <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-4 w-4 shrink-0" />
                    <span>Monday to Friday, 8:00 AM to 5:00 PM</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  CTCAO Units
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Divisions and support groups
                </h2>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(groupedUnits.length > 0 ? groupedUnits : fallbackDivisions).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-black/10 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <section className="space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f8b6d]">
                Team / Members
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                CTCAO profile cards
              </h2>
            </div>

            {members.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {members.map((member) => (
                  <article
                    key={member.id}
                    className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#121318]"
                  >
                    <div className="relative h-72 overflow-hidden bg-[#e8f2ee] dark:bg-[#1a2330]">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-6xl font-semibold text-[#0f8b6d] dark:text-[#8ea3ff]">
                          {member.fullName.charAt(0)}
                        </div>
                      )}

                      {member.featured ? (
                        <div className="absolute left-4 top-4 rounded-full bg-[#0f8b6d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          Featured
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4 px-5 py-5">
                      <div>
                        {member.unitName ? (
                          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                            {member.unitName}
                          </div>
                        ) : null}
                        <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                          {member.fullName}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-[#0f8b6d] dark:text-[#8ea3ff]">
                          {member.designation}
                        </p>
                      </div>

                      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {member.shortBio || 'Public profile details can be maintained from the frontend admin configuration area.'}
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0f8b6d] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        More Info
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-black/10 bg-white p-8 text-sm text-slate-600 dark:border-white/10 dark:bg-[#121318] dark:text-slate-300">
                Team member cards will appear here once profiles are added from the frontend admin configuration page.
              </div>
            )}
          </section>

          {events.length > 0 && (
            <section className="space-y-5">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                  Related Public Events
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Recent and visible tourism-linked events
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                  <div
                    key={`${event.scope}-${event.title}`}
                    className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#121318]"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#0f8b6d]">
                      {event.category}
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                      {event.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {event.summary}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>

      {selectedMember ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-[#121318] sm:p-8">
            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-6 md:grid-cols-[280px_1fr]">
              <div className="overflow-hidden rounded-[1.8rem] bg-[#e8f2ee] dark:bg-[#1a2330]">
                {selectedMember.photo ? (
                  <img
                    src={selectedMember.photo}
                    alt={selectedMember.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[320px] items-center justify-center text-7xl font-semibold text-[#0f8b6d] dark:text-[#8ea3ff]">
                    {selectedMember.fullName.charAt(0)}
                  </div>
                )}
              </div>

              <div>
                {selectedMember.unitName ? (
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                    {selectedMember.unitName}
                  </div>
                ) : null}

                <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {selectedMember.fullName}
                </h3>
                <p className="mt-2 text-sm font-medium text-[#0f8b6d] dark:text-[#8ea3ff]">
                  {selectedMember.designation}
                </p>

                <p className="mt-5 text-sm leading-8 text-slate-600 dark:text-slate-300">
                  {selectedMember.shortBio || 'No additional profile summary yet.'}
                </p>

                <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {selectedMember.email ? <div><strong>Email:</strong> {selectedMember.email}</div> : null}
                  {selectedMember.phone ? <div><strong>Phone:</strong> {selectedMember.phone}</div> : null}
                </div>

                {selectedMember.details && selectedMember.details.length > 0 ? (
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      More Details
                    </div>
                    <div className="mt-3 grid gap-3">
                      {selectedMember.details.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-black/5 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        >
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PublicLayout>
  );
}
