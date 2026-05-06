import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPin,
  Ruler,
  Sparkles,
  Users,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import type { PublicSpaceItem } from '@/types/public-content';

type Props = {
  facility?: PublicSpaceItem | null;
  relatedFacilities?: PublicSpaceItem[];
};

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function getSpaceImage(space?: PublicSpaceItem | null, dark = false) {
  if (!space) {
    return dark ? '/marketing/images/hero/night2.png' : '/marketing/images/hero/noon2.jpg';
  }

  if (dark) {
    return space.darkImage || space.image || space.lightImage || '/marketing/images/hero/night2.png';
  }

  return space.lightImage || space.image || space.darkImage || '/marketing/images/hero/noon2.jpg';
}

export default function FacilityShowPage({ facility, relatedFacilities = [] }: Props) {
  const reduceMotion = useReducedMotion();

  if (!facility) {
    return (
      <PublicLayout>
        <Head title="Facility Not Found" />

        <section className="flex min-h-screen items-center justify-center bg-[var(--bccc-bg)] px-4 pt-28">
          <div className="max-w-xl border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-8 text-center shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[var(--bccc-line-gold)] bg-[rgba(169,132,67,0.09)] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
              <Building2 className="h-6 w-6" />
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-[var(--bccc-text)]">
              Facility not found.
            </h1>

            <p className="mt-3 text-sm leading-7 text-[var(--bccc-text-muted)]">
              The selected facility could not be loaded or may no longer be visible.
            </p>

            <Link href="/facilities" className="mt-6 bccc-button-primary">
              Back to Facilities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </PublicLayout>
    );
  }

  const details = facility.details?.length
    ? facility.details
    : ['Space details and usage notes may be updated from the admin content area.'];

  return (
    <PublicLayout>
      <Head title={facility.title} />

      <section className="relative min-h-[86svh] overflow-hidden bg-[#080806] pt-32 text-white lg:pt-36">
        <img
          src={getSpaceImage(facility, false)}
          alt={facility.title}
          className="absolute inset-0 h-full w-full object-cover opacity-78 dark:hidden"
          draggable={false}
        />

        <img
          src={getSpaceImage(facility, true)}
          alt={facility.title}
          className="absolute inset-0 hidden h-full w-full object-cover opacity-78 dark:block"
          draggable={false}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.16)_38%,rgba(0,0,0,0.86)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080806] via-[#080806]/58 to-black/20" />

        <div className="public-container relative z-10 grid min-h-[calc(86svh-9rem)] gap-8 pb-12 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 30, filter: 'blur(12px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury }}
          >
            <Link
              href="/facilities"
              className="mb-6 inline-flex items-center gap-2 border border-white/12 bg-white/[0.06] px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/78 backdrop-blur-xl transition hover:border-[#f4dfad]/35 hover:text-[#f4dfad]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Facilities
            </Link>

            <div className="inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              <Building2 className="h-3.5 w-3.5" />
              Space Details
            </div>

            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,8vw,7.8rem)] font-medium leading-[0.88] tracking-[-0.085em] text-white">
              {facility.title}
            </h1>

            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/68 sm:text-base">
              {facility.summary || facility.shortDescription}
            </p>
          </motion.div>

          <motion.aside
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 26, filter: 'blur(10px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury, delay: 0.12 }}
            className="border border-white/12 bg-white/[0.075] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <div className="grid gap-3">
              <div className="flex items-start gap-3 border border-white/10 bg-white/[0.055] p-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#f4dfad]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                    Category
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{facility.category}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border border-white/10 bg-white/[0.055] p-4">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#f4dfad]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                    Capacity
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{facility.capacity}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border border-white/10 bg-white/[0.055] p-4">
                <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-[#f4dfad]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                    Usage
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">Event-ready venue space</p>
                </div>
              </div>
            </div>

            <Link
              href={`/bookings/create?venue=${encodeURIComponent(facility.title)}`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-[#f4dfad]/40 bg-[#f4dfad] px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#17120a] transition hover:bg-white"
            >
              Book This Space
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.aside>
        </div>
      </section>

      <section className="public-section relative overflow-hidden">
        <div className="public-container grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <div className="bccc-section-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Venue Notes
            </div>

            <h2 className="mt-4 bccc-section-title-sm">
              Details for planning and coordination.
            </h2>

            <p className="mt-5 text-sm leading-8 text-[var(--bccc-text-muted)]">
              Review the space information before proceeding to booking. For special arrangements, contact the office for clarification.
            </p>

            <Link
              href="/contact"
              className="mt-6 bccc-button-secondary"
            >
              Ask About This Space
            </Link>
          </div>

          <div className="grid gap-3">
            {details.map((detail, index) => (
              <motion.article
                key={`${facility.id}-detail-${index}`}
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
                whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.48, ease: easeLuxury, delay: Math.min(index * 0.055, 0.24) }}
                className="flex items-start gap-4 border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl"
              >
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[var(--bccc-gold-700)]" />
                <p className="text-sm leading-8 text-[var(--bccc-text-muted)]">{detail}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {relatedFacilities.length > 0 ? (
        <section className="public-section-tight relative overflow-hidden">
          <div className="public-container">
            <div className="mb-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <div className="bccc-section-kicker">
                  <Building2 className="h-3.5 w-3.5" />
                  Related Spaces
                </div>

                <h2 className="mt-4 bccc-section-title-sm">
                  Other venue spaces to consider.
                </h2>
              </div>

              <p className="bccc-section-copy lg:justify-self-end">
                Compare nearby venue options before making your booking request.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedFacilities.map((item, index) => (
                <motion.article
                  key={item.id}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
                  whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.48, ease: easeLuxury, delay: Math.min(index * 0.055, 0.22) }}
                  className="group overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[var(--bccc-line-gold)] hover:shadow-[var(--bccc-shadow-medium)]"
                >
                  <Link href={`/facilities/${item.slug}`} className="block">
                    <div className="relative h-56 overflow-hidden bg-[#080806]">
                      <img
                        src={getSpaceImage(item, false)}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-[1100ms] group-hover:scale-[1.055] dark:hidden"
                        draggable={false}
                      />

                      <img
                        src={getSpaceImage(item, true)}
                        alt={item.title}
                        className="absolute inset-0 hidden h-full w-full object-cover transition duration-[1100ms] group-hover:scale-[1.055] dark:block"
                        draggable={false}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent" />
                    </div>

                    <div className="p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
                        {item.category}
                      </p>

                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-[var(--bccc-text)]">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[var(--bccc-text-muted)]">
                        {item.shortDescription || item.summary}
                      </p>

                      <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
                        {item.ctaLabel || 'View Space'}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </PublicLayout>
  );
}
