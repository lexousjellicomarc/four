import { Head } from '@inertiajs/react';
import { BookOpenText, ClipboardList, ShieldCheck, WalletCards } from 'lucide-react';
import PageHero from '@/components/public/page-hero';
import PublicLayout from '@/layouts/public-layout';

const sections = [
  {
    title: 'Booking Preparation',
    icon: ClipboardList,
    points: [
      'Check the preferred venue, schedule, and guest count before opening the formal booking form.',
      'Prepare event details, organization details, and the contact person information in advance.',
      'Review whether the request is private or intended for possible public posting before submission.',
      'Use the availability checker and public calendar first so you can avoid blocked or occupied dates.',
    ],
  },
  {
    title: 'Payment and Pencil Booking Reminder',
    icon: WalletCards,
    points: [
      'A booking request may still undergo staff review, validation, and payment compliance before it becomes fully settled.',
      'Clients should keep their reference numbers, proof images, and official payment details accurate and complete.',
      'Down payment and remaining balance requirements follow the configured booking rules and office validation steps.',
      'Pending payment uploads do not automatically mean final confirmation until the office completes review.',
    ],
  },
  {
    title: 'Venue Conduct and Responsibilities',
    icon: ShieldCheck,
    points: [
      'Observe proper use of the venue, follow approved staff directions, and keep shared areas safe and orderly.',
      'Ingress, setup, service coordination, and venue use must follow the approved arrangement and current house rules.',
      'Clients are expected to protect equipment, observe cleanliness, and avoid unauthorized use of restricted areas.',
      'Any activity that affects safety, facility order, or public operations may be subject to additional office review.',
    ],
  },
  {
    title: 'Terms, Conditions, and Public Notes',
    icon: BookOpenText,
    points: [
      'Availability shown on the public side is informative and may still be subject to final operational confirmation.',
      'Public events may be displayed to other users, while private bookings remain hidden from public details.',
      'Cancellation, payment compliance, and operational approval remain governed by the current office workflow and applicable policies.',
      'When in doubt, use the contact and enquiry page so the office can clarify booking, payment, and venue-use requirements.',
    ],
  },
];

export default function GuidelinesPage() {
  return (
    <PublicLayout>
      <Head title="Guidelines" />

      <PageHero
        eyebrow="Guidelines"
        title="Booking reminders, terms, conditions, and venue-use guidance."
        description="A more detailed public page for booking preparation, payment reminders, venue conduct, and public-facing terms and conditions."
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

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
