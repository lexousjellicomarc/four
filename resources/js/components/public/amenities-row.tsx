import { BriefcaseBusiness, Camera, CircleParking, Mic2, ShieldCheck, Wifi } from 'lucide-react';

const amenities = [
  { label: 'Parking Access', icon: CircleParking },
  { label: 'Wi-Fi Ready', icon: Wifi },
  { label: 'Audio Support', icon: Mic2 },
  { label: 'Event Coverage', icon: Camera },
  { label: 'Security Support', icon: ShieldCheck },
  { label: 'Business Ready', icon: BriefcaseBusiness },
];

export default function AmenitiesRow() {
  return (
    <section className="mt-4 w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] rounded-[2.2rem] border border-black/5 bg-white/86 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5 sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="public-chip border-black/10 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Premium Amenities
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Essential support features for cleaner venue planning.
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
            The amenities section now sits tighter under the moving stats strip so the homepage reads as one continuous public presentation.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {amenities.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-[1.5rem] border border-black/5 bg-[#f8f4ea] px-4 py-5 text-center dark:border-white/10 dark:bg-slate-900/70">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0f8b6d]/10 text-[#0f8b6d] dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-800 dark:text-white">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
