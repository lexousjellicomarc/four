import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Landmark, Palette } from 'lucide-react';

type SiteSettingsLike = {
  visitaUrl?: string | null;
  creativeBaguioUrl?: string | null;
};

type Props = {
  siteSettings?: SiteSettingsLike;
};

const easeLuxury = [0.22, 1, 0.36, 1] as const;

export default function FloatingQuickLinks({ siteSettings }: Props) {
  const reduceMotion = useReducedMotion();

  const visitaUrl = siteSettings?.visitaUrl || 'https://visita.baguio.gov.ph';
  const artsUrl = siteSettings?.creativeBaguioUrl || 'https://creativecity.baguio.gov.ph';

  const links = [
    {
      label: 'VISITA',
      description: 'Baguio travel portal',
      href: visitaUrl,
      icon: Landmark,
    },
    {
      label: 'ARTS',
      description: 'Creative Baguio',
      href: artsUrl,
      icon: Palette,
    },
  ];

  return (
    <div className="bccc-floating-quick-links pointer-events-none fixed bottom-[5.6rem] left-4 z-[70] hidden flex-col gap-2 sm:flex lg:left-6">
      {links.map((link, index) => {
        const Icon = link.icon;

        return (
          <motion.a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${link.label} in a new tab`}
            className="pointer-events-auto group relative flex min-w-[11rem] items-center gap-3 overflow-hidden border border-white/18 bg-[#090a08]/55 px-3.5 py-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#f4dfad]/45 hover:bg-[#090a08]/72 dark:border-white/14"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -18, filter: 'blur(8px)' }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    x: 0,
                    filter: 'blur(0px)',
                    y: [0, -6, 0],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    opacity: {
                      duration: 0.58,
                      ease: easeLuxury,
                      delay: 0.7 + index * 0.12,
                    },
                    x: {
                      duration: 0.58,
                      ease: easeLuxury,
                      delay: 0.7 + index * 0.12,
                    },
                    filter: {
                      duration: 0.58,
                      ease: easeLuxury,
                      delay: 0.7 + index * 0.12,
                    },
                    y: {
                      duration: 5.2 + index * 0.7,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.4,
                    },
                  }
            }
          >
            <span className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#f4dfad]/70 to-transparent opacity-70" />
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,223,173,0.16),transparent_45%)] opacity-0 transition duration-500 group-hover:opacity-100" />

            <span className="relative flex h-9 w-9 items-center justify-center border border-white/18 bg-white/10 text-[#f4dfad]">
              <Icon className="h-4 w-4" />
            </span>

            <span className="relative min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.28em]">
                {link.label}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-white/62">
                {link.description}
              </span>
            </span>

            <ArrowUpRight className="relative h-4 w-4 text-white/65 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#f4dfad]" />
          </motion.a>
        );
      })}
    </div>
  );
}
