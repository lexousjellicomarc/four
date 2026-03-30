import { useMemo } from 'react';

const fallbackImages = [
  '/marketing/images/branding/noon.jpg',
  '/marketing/images/events/2.JPG',
  '/marketing/images/events/3.JPG',
  '/marketing/images/events/4.jpg',
  '/marketing/images/facilities/lightvip.JPG',
];

export default function WelcomeSection() {
  const collage = useMemo(() => fallbackImages, []);

  return (
    <section className="public-container mt-12">
      <div className="grid gap-8 rounded-[2.25rem] border border-black/5 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <div className="space-y-5">
          <div className="public-chip border-[#0f8b6d]/20 bg-[#0f8b6d]/10 text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
            Welcome to Baguio Convention
          </div>

          <div>
            <h2 className="public-section-title">A venue made for meetings, culture, and city events.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 dark:text-slate-300">
              The Baguio Convention and Cultural Center supports conferences, public gatherings, exhibits, official activities, and cultural programs in a setting that is easy to discover and plan around.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 dark:text-slate-300">
              This public page helps you review spaces, see event highlights, check calendar visibility, and proceed to the booking flow with clearer guidance.
            </p>
          </div>
        </div>

        <div className="grid min-h-[320px] grid-cols-6 grid-rows-6 gap-3">
          <div className="col-span-3 row-span-3 overflow-hidden rounded-[1.7rem]">
            <img src={collage[0]} alt="Convention view" className="h-full w-full object-cover" />
          </div>
          <div className="col-span-3 row-span-2 overflow-hidden rounded-[1.4rem]">
            <img src={collage[1]} alt="Interior 1" className="h-full w-full object-cover" />
          </div>
          <div className="col-span-2 row-span-2 overflow-hidden rounded-[1.4rem]">
            <img src={collage[2]} alt="Interior 2" className="h-full w-full object-cover" />
          </div>
          <div className="col-span-2 row-span-2 overflow-hidden rounded-[1.4rem]">
            <img src={collage[3]} alt="Interior 3" className="h-full w-full object-cover" />
          </div>
          <div className="col-span-2 row-span-2 overflow-hidden rounded-[1.4rem]">
            <img src={collage[4]} alt="VIP area" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
