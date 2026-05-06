import { Head, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
  Users2,
} from 'lucide-react';
import { useMemo } from 'react';
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

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function groupBySection(members: TourismMember[]) {
  const grouped = new Map<string, TourismMember[]>();

  members.forEach((member) => {
    const key = member.officeSection || member.teamName || member.unitName || 'Office Team';
    grouped.set(key, [...(grouped.get(key) || []), member]);
  });

  return Array.from(grouped.entries());
}

function getOfficeImage(officeSpace?: PublicSpaceItem | null, dark = false) {
  if (!officeSpace) {
    return dark ? '/marketing/images/hero/night2.png' : '/marketing/images/hero/noon2.jpg';
  }

  if (dark) {
    return officeSpace.darkImage || officeSpace.image || officeSpace.lightImage || '/marketing/images/hero/night2.png';
  }

  return officeSpace.lightImage || officeSpace.image || officeSpace.darkImage || '/marketing/images/hero/noon2.jpg';
}

export default function TourismOfficePage({ officeSpace, events = [], members = [] }: Props) {
  const reduceMotion = useReducedMotion();
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const settings = page.props.siteSettings;
  const groupedMembers = useMemo(() => groupBySection(members), [members]);

  const officeDetails = officeSpace?.details?.length
    ? officeSpace.details
    : [
        'Visitor information and tourism guidance',
        'Public assistance for general venue and city tourism questions',
        'Basic event-related support and coordination',
      ];

  return (
    <PublicLayout>
      <Head title="Tourism Office" />

      <section className="relative min-h-[78svh] overflow-hidden bg-[#080806] pt-32 text-white lg:pt-36">
        <img
          src={getOfficeImage(officeSpace, false)}
          alt="Baguio Tourism Office"
          className="absolute inset-0 h-full w-full object-cover opacity-70 dark:hidden"
          draggable={false}
        />

        <img
          src={getOfficeImage(officeSpace, true)}
          alt="Baguio Tourism Office"
          className="absolute inset-0 hidden h-full w-full object-cover opacity-70 dark:block"
          draggable={false}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.86)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080806] via-[#080806]/58 to-black/24" />

        <div className="public-container relative z-10 grid min-h-[calc(78svh-9rem)] gap-8 pb-12 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 30, filter: 'blur(12px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury }}
          >
            <div className="inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              <Users2 className="h-3.5 w-3.5" />
              Tourism Office
            </div>

            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.085em] text-white">
              Visitor support, cultural guidance, and city event coordination.
            </h1>
          </motion.div>

          <motion.aside
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury, delay: 0.12 }}
            className="border border-white/12 bg-white/[0.075] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              About the Office
            </p>

            <p className="mt-4 text-sm leading-8 text-white/68">
              {officeSpace?.summary ||
                'The Tourism Office supports visitors, public information, tourism assistance, and event-linked coordination for Baguio City.'}
            </p>

            <div className="mt-5 grid gap-2">
              {officeDetails.slice(0, 4).map((detail, index) => (
                <div
                  key={`office-detail-${index}`}
                  className="flex items-start gap-3 border border-white/10 bg-white/[0.055] p-3 text-sm leading-7 text-white/68"
                >
                  <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-[#f4dfad]" />
                  {detail}
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="public-section-tight relative overflow-hidden">
        <div className="public-container grid gap-4 lg:grid-cols-4">
          <div className="border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl">
            <MapPin className="h-5 w-5 text-[var(--bccc-gold-700)]" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
              Address
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--bccc-text-muted)]">
              {settings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}
            </p>
          </div>

          <div className="border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl">
            <Phone className="h-5 w-5 text-[var(--bccc-gold-700)]" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
              Phone
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--bccc-text-muted)]">
              {settings?.phone || '(074) 446 2009'}
            </p>
          </div>

          <div className="border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl">
            <Mail className="h-5 w-5 text-[var(--bccc-gold-700)]" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
              Email
            </p>
            <p className="mt-2 break-words text-sm leading-7 text-[var(--bccc-text-muted)]">
              {settings?.email || 'info@bccc-ease.com'}
            </p>
          </div>

          <div className="border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl">
            <Clock3 className="h-5 w-5 text-[var(--bccc-gold-700)]" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
              Office Hours
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--bccc-text-muted)]">
              Monday to Friday, 8:00 AM to 5:00 PM
            </p>
          </div>
        </div>
      </section>

      {groupedMembers.length > 0 ? (
        <section className="public-section relative overflow-hidden">
          <div className="public-container">
            <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <div className="bccc-section-kicker">
                  <Users2 className="h-3.5 w-3.5" />
                  Office Team
                </div>

                <h2 className="mt-4 bccc-section-title-sm">
                  Public-facing tourism and coordination profiles.
                </h2>
              </div>

              <p className="bccc-section-copy lg:justify-self-end">
                Members are grouped by office section or team so public visitors can better understand the office structure.
              </p>
            </div>

            <div className="space-y-8">
              {groupedMembers.map(([section, sectionMembers]) => (
                <section key={section}>
                  <h3 className="mb-4 border-b border-[var(--bccc-line)] pb-3 text-[11px] font-black uppercase tracking-[0.26em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
                    {section}
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sectionMembers.map((member, index) => (
                      <motion.article
                        key={member.id}
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
                        whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{ duration: 0.48, ease: easeLuxury, delay: Math.min(index * 0.05, 0.24) }}
                        className="group overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[var(--bccc-line-gold)] hover:shadow-[var(--bccc-shadow-medium)]"
                      >
                        <div className="relative h-72 overflow-hidden bg-[#080806]">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.fullName}
                              className="absolute inset-0 h-full w-full object-cover transition duration-[1100ms] group-hover:scale-[1.055]"
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(169,132,67,0.18),transparent_42%),linear-gradient(135deg,#17382d,#080906)]">
                              <UserRound className="h-20 w-20 text-white/24" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/16 to-transparent" />

                          {member.unitName ? (
                            <div className="absolute left-4 top-4 border border-white/14 bg-black/28 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f4dfad] backdrop-blur-xl">
                              {member.unitName}
                            </div>
                          ) : null}
                        </div>

                        <div className="p-5">
                          <h4 className="text-2xl font-semibold tracking-[-0.045em] text-[var(--bccc-text)]">
                            {member.fullName}
                          </h4>

                          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
                            {member.designation}
                          </p>

                          <p className="mt-4 text-sm leading-7 text-[var(--bccc-text-muted)]">
                            {member.shortBio || 'Public profile details may be maintained from the admin content area.'}
                          </p>

                          {member.details && member.details.length > 0 ? (
                            <ul className="mt-4 space-y-2 border-t border-[var(--bccc-line)] pt-4">
                              {member.details.slice(0, 4).map((detail, detailIndex) => (
                                <li
                                  key={`${member.id}-detail-${detailIndex}`}
                                  className="text-xs leading-6 text-[var(--bccc-text-muted)]"
                                >
                                  • {detail}
                                </li>
                              ))}
                            </ul>
                          ) : null}

                          <div className="mt-5 flex flex-wrap gap-2">
                            {member.email ? (
                              <a
                                href={`mailto:${member.email}`}
                                className="inline-flex items-center gap-2 border border-[var(--bccc-line)] px-3 py-2 text-xs text-[var(--bccc-text-muted)] transition hover:border-[var(--bccc-line-gold)]"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                Email
                              </a>
                            ) : null}

                            {member.phone ? (
                              <a
                                href={`tel:${member.phone}`}
                                className="inline-flex items-center gap-2 border border-[var(--bccc-line)] px-3 py-2 text-xs text-[var(--bccc-text-muted)] transition hover:border-[var(--bccc-line-gold)]"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                Phone
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {events.length > 0 ? (
        <section className="public-section-tight relative overflow-hidden bg-[#080906] text-white">
          <div className="public-container">
            <div className="mb-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Public Event Picks
                </div>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
                  Events connected to public activity.
                </h2>
              </div>

              <p className="max-w-2xl text-sm leading-7 text-white/62 lg:justify-self-end">
                Selected BCCC and Baguio City events may appear here for public awareness.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {events.slice(0, 4).map((event, index) => (
                <motion.article
                  key={event.id}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
                  whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.48, ease: easeLuxury, delay: Math.min(index * 0.055, 0.22) }}
                  className="border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f4dfad]">
                    {event.scope === 'city' ? 'City Event' : 'BCCC Event'}
                  </p>

                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">
                    {event.title}
                  </h3>

                  <p className="mt-4 text-sm text-white/58">{event.date}</p>

                  {event.time ? (
                    <p className="mt-2 text-sm text-white/58">{event.time}</p>
                  ) : null}

                  <p className="mt-2 text-sm text-white/58">
                    {event.venue || 'Baguio Convention and Cultural Center'}
                  </p>

                  <p className="mt-4 text-sm leading-7 text-white/62">
                    {event.summary || event.description}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </PublicLayout>
  );
}
