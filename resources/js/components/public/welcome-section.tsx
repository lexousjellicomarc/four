import { ArrowUpRight, Landmark, MapPinned, Sparkles } from 'lucide-react';

export default function WelcomeSection() {
  return (
    <section className="mt-16 w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 rounded-[2.4rem] border border-black/5 bg-white/86 px-5 py-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5 sm:px-7 sm:py-8 lg:grid-cols-[0.96fr_1.04fr] lg:px-10">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#0f8b6d]/20 bg-[#0f8b6d]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
            <Sparkles className="h-4 w-4" />
            Welcome to BCCC
          </div>

          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            A landmark venue for conventions, cultural programs, public gatherings, and city-scale events.
          </h2>

          <div className="mt-6 space-y-4 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-[15px]">
            <p>
              The Baguio Convention and Cultural Center serves as one of the city’s most recognizable event venues, supporting formal assemblies, exhibitions, performances, meetings, and public programs in one central location.
            </p>
            <p>
              This homepage section is now cleaner, wider, and easier to present. It works well for your future Canva hero composition while still looking polished even before you replace the image.
            </p>
            <p>
              The goal is to present BCCC not only as a booking venue, but as a tourism-facing, culturally relevant, and city-centered destination for professional and public events.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="https://visita.baguio.gov.ph"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-800 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <MapPinned className="h-4 w-4" />
              Visita Baguio
              <ArrowUpRight className="h-4 w-4" />
            </a>

            <a
              href="https://creativecity.baguio.gov.ph"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-800 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <Landmark className="h-4 w-4" />
              Arts Website
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="public-image-sheen relative min-h-[360px] overflow-hidden">
          <img
            src="/marketing/images/hero/welcome.png"
            alt="Baguio Convention and Cultural Center"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0" />
        </div>
      </div>
    </section>
  );
}
