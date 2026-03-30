import { BriefcaseBusiness, Camera, CircleParking, Mic2, ShieldCheck, Wifi } from 'lucide-react';

const amenities = [
  { label: 'Parking Access', icon: CircleParking },
  { label: 'Wi‑Fi Ready', icon: Wifi },
  { label: 'Audio Support', icon: Mic2 },
  { label: 'Event Coverage', icon: Camera },
  { label: 'Security Support', icon: ShieldCheck },
  { label: 'Business Ready', icon: BriefcaseBusiness },
];

export default function AmenitiesRow() {
  return (
    <section className="public-container mt-12">
      <div className="rounded-[2rem] border border-black/5 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5">
        <div className="mb-4 text-center">
          <div className="public-chip border-black/10 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Premium Amenities
          </div>
        </div>

        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
          {amenities.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="min-w-[180px] flex-1 rounded-[1.4rem] border border-black/5 bg-[#f8f4ea] px-4 py-4 text-center dark:border-white/10 dark:bg-slate-900/70"
              >
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
