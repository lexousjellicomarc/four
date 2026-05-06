import { motion, useReducedMotion } from 'framer-motion';
import {
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  CircleParking,
  Mic2,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';

const amenities = [
  {
    label: 'Parking Access',
    description: 'Guest arrival support for event organizers and attendees.',
    icon: CircleParking,
  },
  {
    label: 'Wi-Fi Ready',
    description: 'Connectivity-ready environment for programs and coordination.',
    icon: Wifi,
  },
  {
    label: 'Audio Support',
    description: 'Event-ready support for announcements and formal programs.',
    icon: Mic2,
  },
  {
    label: 'Event Coverage',
    description: 'Flexible setup for civic, corporate, cultural, and public activities.',
    icon: Camera,
  },
  {
    label: 'Security Support',
    description: 'Operational coordination for safer venue use and crowd flow.',
    icon: ShieldCheck,
  },
  {
    label: 'Business Ready',
    description: 'Suitable for conferences, meetings, exhibits, and assemblies.',
    icon: BriefcaseBusiness,
  },
];

const easeLuxury = [0.22, 1, 0.36, 1] as const;

export default function AmenitiesRow() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[var(--bccc-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(169,132,67,0.11),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--bccc-line-gold)] to-transparent opacity-60" />

      <div className="public-container relative z-10 py-10 lg:py-12">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
          whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.62, ease: easeLuxury }}
          className="mb-7 grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-end"
        >
          <div>
            <div className="bccc-section-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Amenities
            </div>

            <h2 className="mt-4 bccc-section-title-sm">
              Essential support for polished, organized events.
            </h2>
          </div>

          <p className="bccc-section-copy lg:justify-self-end">
            BCCC amenities are presented as a clean editorial strip so the page keeps moving smoothly from venue value into spaces and booking actions.
          </p>
        </motion.div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {amenities.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.label}
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.985, filter: 'blur(8px)' }}
                whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.52, ease: easeLuxury, delay: Math.min(index * 0.055, 0.28) }}
                className="group relative overflow-hidden border border-[var(--bccc-line)] bg-[var(--bccc-surface)] p-5 shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[var(--bccc-line-gold)] hover:shadow-[var(--bccc-shadow-medium)]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(169,132,67,0.09),transparent_40%)] opacity-0 transition duration-500 group-hover:opacity-100" />

                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--bccc-line-gold)] bg-[rgba(169,132,67,0.09)] text-[var(--bccc-gold-800)] transition duration-500 group-hover:bg-[var(--bccc-gold-700)] group-hover:text-white dark:text-[var(--bccc-gold-300)]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold tracking-[-0.025em] text-[var(--bccc-text)]">
                        {item.label}
                      </h3>
                      <CheckCircle2 className="h-4 w-4 text-[var(--bccc-gold-700)] opacity-70" />
                    </div>

                    <p className="mt-2 text-sm leading-7 text-[var(--bccc-text-muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
