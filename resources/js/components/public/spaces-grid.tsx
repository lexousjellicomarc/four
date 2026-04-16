import { Link } from '@inertiajs/react';
import { ArrowUpRight, Users } from 'lucide-react';
import { useMemo } from 'react';
import type { PublicSpaceItem } from '@/types/public-content';

type Props = {
  items?: PublicSpaceItem[];
};

function chunk<T>(items: T[], size: number) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export default function SpacesGrid({ items = [] }: Props) {
  const visible = useMemo(() => items.filter((item) => item.homepageVisible).slice(0, 8), [items]);
  const rows = useMemo(() => chunk(visible, 4), [visible]);

  return (
    <section className="mt-14 w-full px-4 sm:px-4 lg:px-6">
      <style>{`
        @keyframes spaceRowLeft { from { opacity: 0; transform: translateX(48px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spaceRowRight { from { opacity: 0; transform: translateX(-48px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="public-chip border-[#0f8b6d]/20 bg-[#0f8b6d]/10 text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
              Our Spaces
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Venue spaces with stronger entrance motion and cleaner hover polish.
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
            The first row now enters from the right, the second row from the left, while each card keeps the sheen hover effect for a more premium public look.
          </p>
        </div>

        {visible.length === 0 ? (
          <div className="mt-6 rounded-[1.8rem] border border-dashed border-black/10 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            No homepage spaces are visible yet.
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {rows.map((row, rowIndex) => {
              const leftPointing = rowIndex % 2 === 0;
              const rowAnimation = rowIndex % 2 === 0 ? 'spaceRowLeft 0.8s ease-out both' : 'spaceRowRight 0.8s ease-out both';

              return (
                <div key={`row-${rowIndex}`} className={`flex flex-wrap ${leftPointing ? 'justify-start' : 'justify-end'}`} style={{ animation: rowAnimation }}>
                  {row.map((item) => (
                    <Link
                      key={String(item.id)}
                      href={`/facilities/${item.slug}`}
                      className="public-hover-card public-image-sheen group relative block h-[360px] w-full max-w-[340px] overflow-hidden border border-black/5 bg-black shadow-[0_24px_65px_rgba(15,23,42,0.16)] dark:border-white/10 sm:w-[calc(50%_-_10px)] xl:w-[calc(25%_-_15px)]"
                      style={{
                        clipPath: leftPointing
                          ? 'polygon(0 0, 92% 0, 100% 100%, 8% 100%)'
                          : 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)',
                      }}
                    >
                      <img src={item.lightImage || item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 dark:hidden" />
                      <img src={item.darkImage || item.image} alt={item.title} className="hidden h-full w-full object-cover transition duration-500 group-hover:scale-105 dark:block" />

                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.20)_36%,rgba(15,23,42,0.88)_100%)]" />

                      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">{item.category}</div>
                        <h3 className="mt-3 text-2xl font-semibold tracking-tight">{item.title}</h3>

                        <div className="mt-6 translate-y-6 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <div className="inline-flex items-center gap-2 text-sm text-white/82">
                            <Users className="h-4 w-4" />
                            {item.capacity}
                          </div>
                          <p className="mt-3 line-clamp-4 text-sm leading-7 text-white/82">{item.summary || item.shortDescription}</p>
                          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                            {item.ctaLabel || 'View Space'}
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
