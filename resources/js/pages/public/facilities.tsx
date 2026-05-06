import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import type { PublicSpaceItem } from '@/types/public-content';

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getSpaceImage(space?: PublicSpaceItem | null, dark = false) {
  if (!space) {
    return dark ? '/marketing/images/hero/night2.png' : '/marketing/images/hero/noon2.jpg';
  }

  if (dark) {
    return space.darkImage || space.image || space.lightImage || '/marketing/images/hero/night2.png';
  }

  return space.lightImage || space.image || space.darkImage || '/marketing/images/hero/noon2.jpg';
}

function FacilityCard({ space, index }: { space: PublicSpaceItem; index: number }) {
  const reduceMotion = useReducedMotion();
  const reversed = index % 2 === 1;
  const details = space.details?.length
    ? space.details.slice(0, 3)
    : [space.shortDescription || space.summary || 'Space details may be updated from the admin content area.'];

  return (
    <motion.article
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, filter: 'blur(10px)' }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.68, ease: easeLuxury, delay: Math.min(index * 0.055, 0.28) }}
      className="group relative grid overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[var(--bccc-line-gold)] hover:shadow-[var(--bccc-shadow-medium)] lg:grid-cols-2"
    >
      <div className={cx('relative min-h-[23rem] overflow-hidden bg-[#080806]', reversed && 'lg:order-2')}>
        <img
          src={getSpaceImage(space, false)}
          alt={space.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] dark:hidden"
          draggable={false}
        />

        <img
          src={getSpaceImage(space, true)}
          alt={space.title}
          className="absolute inset-0 hidden h-full w-full object-cover transition duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] dark:block"
          draggable={false}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.10)_40%,rgba(0,0,0,0.72)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/16 to-black/12" />

        <div className="absolute left-5 top-5 border border-white/16 bg-black/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#f4dfad] backdrop-blur-xl">
          {space.category || 'Venue Space'}
        </div>

        {space.featured ? (
          <div className="absolute right-5 top-5 border border-[#f4dfad]/35 bg-[#f4dfad]/14 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f4dfad] backdrop-blur-xl">
            Featured
          </div>
        ) : null}

        <div className="absolute bottom-5 left-5 right-5">
          <div className="inline-flex items-center gap-2 border border-white/12 bg-white/[0.08] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78 backdrop-blur-xl">
            <Users className="h-3.5 w-3.5 text-[#f4dfad]" />
            {space.capacity || 'Flexible capacity'}
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[23rem] flex-col justify-between p-6 sm:p-8 lg:p-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
            Signature Space
          </p>

          <h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.065em] text-[var(--bccc-text)] sm:text-5xl">
            {space.title}
          </h2>

          <p className="mt-5 text-sm leading-8 text-[var(--bccc-text-muted)]">
            {space.summary || space.shortDescription || 'Explore this facility for event planning, scheduling, and coordination.'}
          </p>

          <div className="mt-6 grid gap-3">
            {details.map((detail, detailIndex) => (
              <div
                key={`${space.id}-detail-${detailIndex}`}
                className="flex items-start gap-3 border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] p-4"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bccc-gold-700)]" />
                <span className="text-sm leading-7 text-[var(--bccc-text-muted)]">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/facilities/${space.slug}`}
            className="bccc-button-primary"
          >
            {space.ctaLabel || 'View Space'}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/bookings/create?venue=${encodeURIComponent(space.title)}`}
            className="bccc-button-secondary"
          >
            Reserve this venue
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default function FacilitiesPage({ spaces = [] }: { spaces?: PublicSpaceItem[] }) {
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return spaces;
    }

    return spaces.filter((item) =>
      [
        item.title,
        item.category,
        item.capacity,
        item.summary,
        item.shortDescription,
        ...(item.details ?? []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [search, spaces]);

  const featured = filtered[0] ?? spaces[0] ?? null;

  return (
    <PublicLayout>
      <Head title="Facilities" />

      <section className="relative min-h-[76svh] overflow-hidden bg-[#080806] pt-32 text-white lg:pt-36">
        <img
          src={getSpaceImage(featured, false)}
          alt={featured?.title || 'BCCC Facilities'}
          className="absolute inset-0 h-full w-full object-cover opacity-72 dark:hidden"
          draggable={false}
        />

        <img
          src={getSpaceImage(featured, true)}
          alt={featured?.title || 'BCCC Facilities'}
          className="absolute inset-0 hidden h-full w-full object-cover opacity-72 dark:block"
          draggable={false}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.84)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080806] via-[#080806]/52 to-black/28" />

        <div className="public-container relative z-10 grid min-h-[calc(76svh-9rem)] gap-8 pb-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, filter: 'blur(12px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury }}
          >
            <div className="inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              <Building2 className="h-3.5 w-3.5" />
              Facilities
            </div>

            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.085em] text-white">
              Spaces designed for polished city events.
            </h1>
          </motion.div>

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.78, ease: easeLuxury, delay: 0.12 }}
            className="border border-white/12 bg-white/[0.07] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
              Featured Space
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
              {featured?.title || 'BCCC Facility'}
            </h2>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">
              <span className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.06] px-3 py-2">
                <MapPin className="h-3.5 w-3.5 text-[#f4dfad]" />
                {featured?.category || 'Venue Space'}
              </span>

              <span className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.06] px-3 py-2">
                <Users className="h-3.5 w-3.5 text-[#f4dfad]" />
                {featured?.capacity || 'Flexible capacity'}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/66">
              {featured?.summary ||
                featured?.shortDescription ||
                'Discover BCCC venue spaces through a more immersive public presentation.'}
            </p>

            {featured ? (
              <Link
                href={`/facilities/${featured.slug}`}
                className="mt-5 inline-flex items-center gap-2 border border-[#f4dfad]/36 bg-[#f4dfad] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#17120a] transition duration-500 hover:-translate-y-0.5 hover:bg-white"
              >
                View Featured Space
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--bccc-bg)] py-10">
        <div className="public-container">
          <div className="flex flex-col gap-4 border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-4 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
                Search Facilities
              </p>
              <p className="mt-2 text-sm text-[var(--bccc-text-muted)]">
                Filter by space name, category, capacity, or details.
              </p>
            </div>

            <label className="flex min-h-12 w-full items-center gap-3 border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] px-4 lg:max-w-xl">
              <Search className="h-4 w-4 shrink-0 text-[var(--bccc-gold-700)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search facilities"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--bccc-text)] outline-none placeholder:text-[var(--bccc-text-muted)]/55"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="public-section relative overflow-hidden">
        <div className="public-container">
          <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <div className="bccc-section-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Venue Collection
              </div>

              <h2 className="mt-4 bccc-section-title-sm">
                Browse each facility with clear venue information.
              </h2>
            </div>

            <p className="bccc-section-copy lg:justify-self-end">
              The facility list is intentionally image-led and editorial, making each space easier to understand before proceeding to booking.
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="bccc-public-panel p-8 text-center">
              <p className="text-sm text-[var(--bccc-text-muted)]">
                No facilities matched your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:gap-7">
              {filtered.map((space, index) => (
                <FacilityCard key={space.id} space={space} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
