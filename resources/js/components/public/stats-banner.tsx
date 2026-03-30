import type { HomepageStatItem } from '@/types/public-content';

type Props = {
  items?: HomepageStatItem[];
};

const fallbackStats: HomepageStatItem[] = [
  { id: '1', value: '2000', suffix: '+', label: 'Seating Capacity' },
  { id: '2', value: '50', suffix: '+', label: 'Parking Spaces' },
  { id: '3', value: '1000', suffix: '+', label: 'Events Hosted' },
  { id: '4', value: '48', suffix: '', label: 'Years of Experience' },
];

export default function StatsBanner({ items = [] }: Props) {
  const source = items.length > 0 ? items : fallbackStats;

  return (
    <section className="public-container mt-12">
      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10">
        <img
          src="/marketing/images/events/lightmain.JPG"
          alt="BCCC exterior"
          className="absolute inset-0 h-full w-full object-cover dark:hidden"
        />
        <img
          src="/marketing/images/events/darkmain.JPG"
          alt="BCCC exterior"
          className="absolute inset-0 hidden h-full w-full object-cover dark:block"
        />
        <div className="absolute inset-0 bg-slate-950/48 dark:bg-slate-950/62" />

        <div className="relative grid gap-4 px-5 py-8 text-center text-white md:grid-cols-4 md:px-8 md:py-12">
          {source.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-[1.5rem] bg-white/10 px-4 py-5 backdrop-blur-md">
              <div className="text-4xl font-semibold tracking-tight">
                {item.value}
                {item.suffix}
              </div>
              <div className="mt-2 text-sm uppercase tracking-[0.24em] text-white/80">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
