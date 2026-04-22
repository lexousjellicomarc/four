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
    <section className="w-full ">
      <div className="mx-auto w-full">

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
