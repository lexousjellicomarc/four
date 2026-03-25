import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenText,
  ClipboardList,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import PageHero from '@/components/public/page-hero';


const guidelineSections = [
  {
    title: 'Booking Preparation',
    icon: ClipboardList,
    points: [
      'Review the suitability of the venue space before filing a formal booking request.',
      'Prepare your preferred schedule, event type, and estimated attendance ahead of submission.',
      'Clarify technical or operational requirements early whenever special setup is needed.',
    ],
  },
  {
    title: 'Venue Conduct',
    icon: ShieldCheck,
    points: [
      'Observe proper use of the facility, furnishings, and operational support areas.',
      'Follow venue rules, staff directions, and approved limitations for the scheduled activity.',
      'Maintain cleanliness, safety, and respect for shared public facilities at all times.',
    ],
  },
  {
    title: 'Operational Notes',
    icon: BookOpenText,
    points: [
      'Availability remains subject to schedule validation and management approval.',
      'Specific documentary, payment, and compliance requirements may apply depending on event type.',
      'Final arrangements are governed by the official booking workflow within BCCC EASE.',
    ],
  },
];

export default function GuidelinesPage() {
  return (
    <PublicLayout>
      <Head title="Guidelines | BCCC EASE" />
<PageHero
  eyebrow="Venue Guidelines"
  title="Public booking reminders, venue-use guidance, and policy-ready information"
  description="This page acts as the public reference for general guidelines, booking preparation, venue conduct, and operational reminders."
  backgroundImages={[
    '/marketing/images/branding/sunrise.jpg',
    '/marketing/images/branding/noon.jpg',
    '/marketing/images/events/4.jpg',
  ]}
  actions={[
    { label: 'Contact for Clarification', href: '/contact' },
    { label: 'Proceed to Booking', href: '/bookings/create', variant: 'secondary' },
  ]}
/>

      <section className="relative overflow-hidden px-4 pb-16 pt-32 md:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[#ece7dc] dark:bg-[#3d3d40]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e7f4ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#12906a] dark:bg-[#26334d] dark:text-[#9bb8ff]">
            <Sparkles className="h-4 w-4" />
            Venue Guidelines
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Public booking reminders, venue-use guidance, and policy-ready information.
          </h1>

          <p className="mt-6 max-w-3xl text-sm leading-8 text-[#5a554d] dark:text-white/75 md:text-base">
            This page acts as the public reference for general guidelines, booking
            preparation, venue conduct, and operational reminders. It can later be
            expanded into a more formal policy page with official conditions and
            documentary requirements.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {guidelineSections.map((section, index) => {
            const Icon = section.icon;

            return (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-[34px] bg-white p-8 shadow-xl dark:bg-[#3a3a3d]"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-3 rounded-full bg-[#eef6f2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#12906a] dark:bg-[#24314f] dark:text-[#9bb8ff]">
                      <Icon className="h-4 w-4" />
                      Policy Section
                    </div>

                    <h2 className="mt-4 text-3xl font-bold">{section.title}</h2>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {section.points.map((point) => (
                    <div
                      key={point}
                      className="rounded-[24px] bg-[#f7f4ee] p-5 dark:bg-[#2f2f33]"
                    >
                      <p className="text-sm leading-7 text-[#4c4843] dark:text-white/75">
                        • {point}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.article>
            );
          })}

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.6 }}
            className="rounded-[34px] bg-white p-8 shadow-xl dark:bg-[#3a3a3d]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#12906a] dark:text-[#7da7ff]">
              Next Step
            </p>
            <h2 className="mt-3 text-3xl font-bold">Proceed with the official workflow</h2>

            <p className="mt-5 max-w-3xl text-sm leading-8 text-[#5a554d] dark:text-white/75 md:text-base">
              Once your final policy content is ready, this page can be expanded to
              include official terms, payment reminders, required documentation, space
              restrictions, and more detailed public booking conditions.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#12906a] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-[#2d47ff]"
              >
                Contact for Clarification
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/bookings/create"
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 text-sm font-semibold transition hover:bg-white/60 dark:border-white/15 dark:hover:bg-white/5"
              >
                Proceed to Booking
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}