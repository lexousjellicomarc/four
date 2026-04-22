import type { HomepageStatItem } from '@/types/public-content';

type Props = {
  items?: HomepageStatItem[];
};

const fallbackStats: HomepageStatItem[] = [
  { id: '1', value: '01', suffix: '', label: 'City Landmark Venue' },
  { id: '2', value: '07', suffix: '+', label: 'Flexible Venue Areas' },
  { id: '3', value: '03', suffix: '', label: 'Core Time Blocks' },
  { id: '4', value: '24', suffix: '/7', label: 'Digital Inquiry Access' },
];

export default function StatsBanner({ items = [] }: Props) {
  const source = items.length > 0 ? items : fallbackStats;
  const looping = [...source, ...source];

  return (
    <section className="w-full">
      <style>{`
        @keyframes statsMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="relative w-full overflow-hidden ">
        <img src="/marketing/images/events/lightmain.JPG" alt="BCCC exterior" className="absolute inset-0 h-full w-full object-cover dark:hidden" />
        <img src="/marketing/images/events/darkmain.JPG" alt="BCCC exterior" className="absolute inset-0 hidden h-full w-full object-cover dark:block" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,15,27,0.74),rgba(15,139,109,0.34))] dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.84),rgba(41,76,255,0.24))]" />

        <div className="relative px-5 py-7 sm:px-7 sm:py-8 lg:px-9">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/70">Venue at a glance</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                A moving snapshot of BCCC’s public-facing venue value.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/76">
              This strip now moves continuously from right to left so the homepage reads with more motion before the amenities and spaces sections.
            </p>
          </div>

          <div className="overflow-hidden">
            <div className="flex min-w-max gap-4" style={{ animation: 'statsMarquee 22s linear infinite' }}>
              {looping.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="w-[250px] shrink-0 rounded-[1.8rem] border border-white/12 bg-white/10 px-5 py-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/66">{item.label}</div>
                  <div className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                    {item.value}
                    {item.suffix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
