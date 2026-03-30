import { Head } from '@inertiajs/react';
import { BookOpenText, ClipboardList, ShieldCheck } from 'lucide-react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';

const sections = [
  {
    title: 'Booking Preparation',
    icon: ClipboardList,
    points: [
      'Review the preferred space and target schedule first.',
      'Prepare your event type and estimated attendance.',
      'Clarify special setup requirements early.',
    ],
  },
  {
    title: 'Venue Conduct',
    icon: ShieldCheck,
    points: [
      'Observe proper use of the venue and shared areas.',
      'Follow approved operational limits and staff directions.',
      'Keep the facility clean, safe, and orderly.',
    ],
  },
  {
    title: 'Operational Notes',
    icon: BookOpenText,
    points: [
      'Availability is subject to schedule validation and approval.',
      'Documentary and payment requirements may apply.',
      'Final arrangements follow the official booking workflow.',
    ],
  },
];

export default function GuidelinesPage() {
  return (
    <PublicLayout>
      <Head title="Guidelines" />

      <PageHero
        eyebrow="Guidelines"
        title="Booking reminders, venue-use guidance, and public-facing notes."
        description="A cleaner policy-ready page for booking preparation, venue conduct, and basic operational reminders."
        backgroundImages={['/marketing/images/branding/sunrise.jpg', '/marketing/images/hero/night.png']}
        actions={[
          { label: 'Proceed to Booking', href: '/bookings/create' },
          { label: 'Contact for Clarification', href: '/contact', variant: 'secondary' },
        ]}
      />

      <section className="public-container mt-10 space-y-6 pb-12">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <article
              key={section.title}
              className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-start gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0f8b6d]/10 text-[#0f8b6d] dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                    Policy Section
                  </div>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{section.title}</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {section.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-[1.5rem] bg-[#f8f4ea] p-5 text-sm leading-7 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </PublicLayout>
  );
}
