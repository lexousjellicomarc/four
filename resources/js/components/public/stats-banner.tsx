import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Sparkles } from 'lucide-react';
import type { HomepageStatItem } from '@/types/public-content';

type Props = {
  items?: HomepageStatItem[];
};

const fallbackStats: HomepageStatItem[] = [
  {
    id: '1',
    value: '01',
    suffix: '',
    label: 'City Landmark Venue',
  },
  {
    id: '2',
    value: '07',
    suffix: '+',
    label: 'Flexible Venue Areas',
  },
  {
    id: '3',
    value: '03',
    suffix: '',
    label: 'Core Time Blocks',
  },
  {
    id: '4',
    value: '24',
    suffix: '/7',
    label: 'Digital Inquiry Access',
  },
];

const easeLuxury = [0.22, 1, 0.36, 1] as const;

export default function StatsBanner({ items = [] }: Props) {
  const source = items.length > 0 ? items : fallbackStats;
  const looping = [...source, ...source, ...source];
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#080906] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,223,173,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(47,106,85,0.22),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f4dfad]/50 to-transparent" />

      <div className="public-container relative z-10 grid gap-8 py-10 lg:grid-cols-[0.55fr_1.45fr] lg:items-center lg:py-12">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -18, filter: 'blur(8px)' }}
          whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.62, ease: easeLuxury }}
        >
          <div className="inline-flex items-center gap-2 border border-[#f4dfad]/25 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
            <BarChart3 className="h-3.5 w-3.5" />
            Venue at a Glance
          </div>

          <h2 className="mt-4 max-w-lg text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">
            A moving snapshot of BCCC’s public-facing venue value.
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-7 text-white/58">
            Key venue indicators glide across the page with a quiet marquee motion, keeping the section active without feeling noisy.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
          whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.62, ease: easeLuxury, delay: 0.08 }}
          className="relative overflow-hidden border-y border-white/10 py-5"
        >
          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-16 bg-gradient-to-r from-[#080906] to-transparent" />
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-16 bg-gradient-to-l from-[#080906] to-transparent" />

          <div className="bccc-stat-marquee flex w-max gap-3">
            {looping.map((item, index) => (
              <article
                key={`${item.id}-${index}`}
                className="min-w-[15rem] border border-white/10 bg-white/[0.055] px-5 py-5 backdrop-blur-xl sm:min-w-[18rem]"
              >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/46">
                    {item.label}
                  </span>
                  <Sparkles className="h-4 w-4 text-[#f4dfad]/70" />
                </div>

                <p className="text-5xl font-semibold tracking-[-0.08em] text-white sm:text-6xl">
                  {item.value}
                  <span className="text-[#f4dfad]">{item.suffix}</span>
                </p>
              </article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
