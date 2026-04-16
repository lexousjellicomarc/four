import { Landmark, Sparkles } from 'lucide-react';

export default function WelcomeSection() {
  return (
    <section className="mt-12 w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 rounded-[2.4rem] border border-black/5 bg-white/86 px-5 py-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:px-7 sm:py-8 lg:grid-cols-[0.96fr_1.04fr] lg:px-10">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#0f8b6d]/20 bg-[#0f8b6d]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
            <Sparkles className="h-4 w-4" />
            Welcome to BCCC
          </div>

          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            A historic city venue for conventions, culture, exhibitions, and public gatherings in Baguio.
          </h2>

          <div className="mt-6 space-y-4 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-[15px]">
            <p>
              The Baguio Convention and Cultural Center has long served as one of the city’s recognizable venues for conferences, government programs, civic assemblies, performances, exhibitions, and large public events.
            </p>
            <p>
              Positioned within Baguio’s tourism and cultural activity zone, the venue helps connect formal events with the city’s creative identity, highland character, and public-facing visitor services.
            </p>
            <p>
              Through BCCC EASE, the venue now presents clearer public information on spaces, schedules, and event highlights while giving visitors and organizers a more guided digital starting point for planning.
            </p>
          </div>

          <div className="mt-7 rounded-[1.5rem] border border-black/5 bg-[#f8f4ea] px-5 py-4 dark:border-white/10 dark:bg-slate-900/70">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              <Landmark className="h-4 w-4" />
              Quick facts
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <li>• Central city venue for both government and public-facing programs.</li>
              <li>• Supports flexible use across meetings, shows, exhibits, and multi-space events.</li>
              <li>• Links venue visibility with tourism, culture, and event coordination.</li>
            </ul>
          </div>
        </div>

        <div className="public-image-sheen relative min-h-[360px] overflow-hidden rounded-[2rem]">
          <img src="/marketing/images/hero/welcome.png" alt="Baguio Convention and Cultural Center" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.28))]" />
        </div>
      </div>
    </section>
  );
}
