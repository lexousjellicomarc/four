import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Landmark,
  MapPin,
  Sparkles,
} from 'lucide-react';

const easeLuxury = [0.22, 1, 0.36, 1] as const;

const venueNotes = [
  {
    label: 'Civic Landmark',
    description: 'A recognizable public venue for conventions, assemblies, exhibitions, and cultural programs.',
    icon: Landmark,
  },
  {
    label: 'Central Event Access',
    description: 'Positioned within Baguio’s tourism and cultural activity zone for guests, organizers, and city programs.',
    icon: MapPin,
  },
  {
    label: 'Digital Scheduling',
    description: 'BCCC EASE connects public event information, venue spaces, and booking workflows in one guided platform.',
    icon: CalendarDays,
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function WelcomeSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[var(--bccc-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(169,132,67,0.13),transparent_32%),radial-gradient(circle_at_92%_22%,rgba(23,56,45,0.12),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--bccc-line-gold)] to-transparent opacity-70" />

      <div className="public-container relative z-10 grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:py-20 xl:gap-16">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22, filter: 'blur(10px)' }}
          whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.22 }}
          transition={{ duration: 0.7, ease: easeLuxury }}
          className="relative"
        >
          <div className="bccc-section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome to BCCC
          </div>

          <h2 className="mt-5 max-w-3xl text-[clamp(2.6rem,6vw,6.4rem)] font-medium leading-[0.9] tracking-[-0.075em] text-[var(--bccc-text)]">
            A historic city venue for conventions, culture, and public gatherings.
          </h2>

          <p className="mt-6 max-w-2xl text-sm leading-8 text-[var(--bccc-text-muted)] sm:text-base">
            The Baguio Convention and Cultural Center has long served as one of the city’s recognizable venues for conferences, government programs, civic assemblies, performances, exhibitions, and major public events.
          </p>

          <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--bccc-text-muted)] sm:text-base">
            Through BCCC EASE, the venue now presents clearer public information on spaces, schedules, and event highlights while giving visitors and organizers a more guided digital starting point for planning.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/facilities"
              className="bccc-button-primary"
            >
              Explore Facilities
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/guidelines"
              className="bccc-button-secondary"
            >
              View Guidelines
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 26, scale: 0.985, filter: 'blur(12px)' }}
          whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.78, ease: easeLuxury, delay: 0.08 }}
          className="relative min-h-[34rem] overflow-hidden border border-[var(--bccc-line)] bg-[#080806] shadow-[var(--bccc-shadow-strong)] lg:min-h-[42rem]"
        >
          <img
            src="/marketing/images/hero/noon2.jpg"
            alt="Baguio Convention and Cultural Center exterior"
            className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.035] dark:hidden"
            draggable={false}
          />

          <img
            src="/marketing/images/hero/night2.png"
            alt="Baguio Convention and Cultural Center exterior at night"
            className="absolute inset-0 hidden h-full w-full object-cover transition duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.035] dark:block"
            draggable={false}
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.08)_38%,rgba(0,0,0,0.72)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/24 to-black/12" />

          <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
            <span className="border border-white/16 bg-black/28 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#f4dfad] backdrop-blur-xl">
              Baguio City
            </span>

            <span className="border border-white/16 bg-black/28 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-white/72 backdrop-blur-xl">
              Convention Center
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <div className="grid gap-2 sm:grid-cols-3">
              {venueNotes.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.label}
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
                    whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.44, ease: easeLuxury, delay: 0.18 + index * 0.08 }}
                    className={cx(
                      'border border-white/12 bg-black/28 p-4 text-white shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl',
                      index === 0 && 'sm:col-span-3 lg:col-span-1',
                    )}
                  >
                    <Icon className="h-4 w-4 text-[#f4dfad]" />
                    <p className="mt-3 text-[11px] font-black uppercase tracking-[0.22em] text-white">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-white/58">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-4 border border-white/10" />
          <Building2 className="pointer-events-none absolute right-6 top-1/2 h-20 w-20 -translate-y-1/2 text-white/[0.035]" />
        </motion.div>
      </div>
    </section>
  );
}
