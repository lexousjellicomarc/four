import LuxuryHorizontalRail from '@/components/public/luxury-horizontal-rail';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Building2, Users } from 'lucide-react';
import { useMemo } from 'react';
import type { PublicSpaceItem } from '@/types/public-content';

type Props = {
  items?: PublicSpaceItem[];
};

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function SpaceImage({ item }: { item: PublicSpaceItem }) {
  const lightImage = item.lightImage || item.image || '/marketing/images/hero/noon2.jpg';
  const darkImage = item.darkImage || item.image || lightImage;

  return (
    <div className="relative h-[19rem] overflow-hidden bg-[#080806] sm:h-[22rem] lg:h-[25rem]">
      <img
        src={lightImage}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] group-hover:saturate-[1.05] dark:hidden"
        draggable={false}
      />

      <img
        src={darkImage}
        alt={item.title}
        className="absolute inset-0 hidden h-full w-full object-cover transition duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.055] group-hover:saturate-[1.05] dark:block"
        draggable={false}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.68)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/84 via-black/16 to-black/18" />

      <div className="absolute left-4 top-4 border border-white/16 bg-black/24 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#f4dfad] backdrop-blur-xl">
        {item.category || 'Venue'}
      </div>

      {item.featured ? (
        <div className="absolute right-4 top-4 border border-[#f4dfad]/35 bg-[#f4dfad]/14 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#f4dfad] backdrop-blur-xl">
          Featured
        </div>
      ) : null}

      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/72">
          <Users className="h-3.5 w-3.5 text-[#f4dfad]" />
          {item.capacity || 'Capacity available upon request'}
        </div>

        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
          {item.title}
        </h3>
      </div>
    </div>
  );
}

function SpaceCard({ item, index }: { item: PublicSpaceItem; index: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={cx(
        'group relative min-w-[82vw] overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[var(--bccc-line-gold)] hover:shadow-[var(--bccc-shadow-medium)] sm:min-w-[24rem] lg:min-w-[28rem] xl:min-w-[31rem]',
        index === 0 && 'lg:min-w-[34rem]',
      )}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.985 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.58, ease: easeLuxury, delay: Math.min(index * 0.055, 0.28) }}
    >
      <Link
        href={`/facilities/${item.slug}`}
        className="block h-full"
        aria-label={`View ${item.title}`}
      >
        <SpaceImage item={item} />

        <div className="relative space-y-5 p-5 sm:p-6">
          <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--bccc-line-gold)] to-transparent opacity-60" />

          <p className="min-h-[4.5rem] text-sm leading-7 text-[var(--bccc-text-muted)]">
            {item.summary || item.shortDescription || 'Explore this venue space for your upcoming event.'}
          </p>

          <div className="flex items-center justify-between gap-4 border-t border-[var(--bccc-line)] pt-5">
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--bccc-gold-800)] dark:text-[var(--bccc-gold-300)]">
              <Building2 className="h-4 w-4" />
              {item.ctaLabel || 'View Space'}
            </span>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--bccc-line)] bg-[var(--bccc-surface-muted)] transition duration-500 group-hover:border-[var(--bccc-line-gold)] group-hover:bg-[var(--bccc-gold-700)] group-hover:text-white">
              <ArrowUpRight className="h-4 w-4 transition duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function SpacesGrid({ items = [] }: Props) {
  const visible = useMemo(
    () => items.filter((item) => item.homepageVisible).slice(0, 10),
    [items],
  );

  return (
    <section className="public-section relative overflow-hidden">
      <div className="public-container">
        <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="bccc-section-kicker">
              <Building2 className="h-3.5 w-3.5" />
              Our Spaces
            </div>

            <h2 className="mt-4 bccc-section-title-sm">
              Venue spaces shaped for civic, cultural, and corporate gatherings.
            </h2>
          </div>

          <p className="bccc-section-copy lg:justify-self-end">
            Explore BCCC venue areas through an elegant horizontal gallery. Drag sideways or use the controls to browse available spaces without overwhelming the page.
          </p>
        </div>

        {visible.length === 0 ? (
          <div className="bccc-public-panel p-8 text-center">
            <p className="text-sm text-[var(--bccc-text-muted)]">
              No homepage spaces are visible yet.
            </p>
          </div>
        ) : (
          <LuxuryHorizontalRail label="BCCC venue spaces">
            {visible.map((item, index) => (
              <SpaceCard key={item.id} item={item} index={index} />
            ))}
          </LuxuryHorizontalRail>
        )}
      </div>
    </section>
  );
}
