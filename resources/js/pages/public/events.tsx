import { Head } from '@inertiajs/react';
import EventsHighlights from '@/components/public/events-highlights';
import PublicLayout from '@/layouts/public-layout';
import type { PublicEventItem } from '@/types/public-content';

export default function EventsPage({ events = [] }: { events?: PublicEventItem[] }) {
  return (
    <PublicLayout>
      <Head title="Events" />

      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(41,76,255,0.12),transparent_30%),linear-gradient(180deg,#f7f4ec_0%,#eef2f7_48%,#f7f4ec_100%)] pb-12 dark:bg-[radial-gradient(circle_at_top,rgba(91,126,255,0.2),transparent_28%),linear-gradient(180deg,#08101d_0%,#0d1420_50%,#08101d_100%)]">
        <div className="mx-auto max-w-[1600px] px-4 pt-[7.4rem] sm:px-6 lg:px-8">
          <div className="rounded-[2.3rem] border border-black/5 bg-white/72 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#0f8b6d]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
              Fullscreen Event Showcase
            </div>
            <h1 className="mt-4 max-w-5xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Explore BCCC and Baguio City events through one continuous cinematic carousel.
            </h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              This page now uses the same film-style interaction as the homepage highlights, but expanded into a stronger fullscreen presentation with larger featured imagery and clearer event details.
            </p>
          </div>
        </div>

        <EventsHighlights items={events} pageMode />
      </div>
    </PublicLayout>
  );
}
