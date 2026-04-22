import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PublicEventItem } from '@/types/public-content';
import { cn } from '@/lib/utils';

type Props = {
  items?: PublicEventItem[];
  pageMode?: boolean;
};

type ScopeKey = 'bccc' | 'city';

const AUTO_ADVANCE_MS = 5200;

function wrapIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

function getOffset(index: number, activeIndex: number, length: number) {
  if (length <= 1) return 0;

  let diff = index - activeIndex;
  const half = Math.floor(length / 2);

  if (diff > half) diff -= length;
  if (diff < -half) diff += length;

  return diff;
}

function formatEventRange(item: PublicEventItem) {
  return item.dateEnd ? `${item.date} • until ${item.dateEnd}` : item.date;
}

function FilmStripDecoration() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10 border-b border-white/10 bg-black/55"
        style={{
          backgroundImage:
            'radial-gradient(circle at 14px 50%, rgba(255,255,255,0.92) 3px, transparent 3.6px)',
          backgroundSize: '28px 100%',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 border-t border-white/10 bg-black/55"
        style={{
          backgroundImage:
            'radial-gradient(circle at 14px 50%, rgba(255,255,255,0.92) 3px, transparent 3.6px)',
          backgroundSize: '28px 100%',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
    </>
  );
}

function CarouselStage({
  items,
  activeIndex,
  badge,
  onSelect,
  onPrev,
  onNext,
  tab,
  setTab,
}: {
  items: PublicEventItem[];
  activeIndex: number;
  badge: string;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  tab: ScopeKey;
  setTab: (value: ScopeKey) => void;
}) {
  const active = items[activeIndex];

  if (!active) {
    return (
      <div className="rounded-[2.25rem] border border-dashed border-black/10 bg-white/70 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        No events are visible in this section yet.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full border border-black/5 bg-[linear-gradient(180deg,#121826,#05070d)] shadow-[0_28px_100px_rgba(15,23,42,0.28)] dark:border-white/10">
      <FilmStripDecoration />

      <div className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center rounded-full border border-white/10 bg-black/45 p-1.5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setTab('bccc')}
          className={cn(
            'rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] transition sm:px-6',
            tab === 'bccc'
              ? 'bg-white text-slate-900 shadow-[0_10px_25px_rgba(255,255,255,0.24)]'
              : 'text-white/76 hover:text-white',
          )}
        >
          BCCC Events
        </button>
        <button
          type="button"
          onClick={() => setTab('city')}
          className={cn(
            'rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] transition sm:px-6',
            tab === 'city'
              ? 'bg-[#8b5cf6] text-white shadow-[0_10px_25px_rgba(139,92,246,0.34)]'
              : 'text-white/76 hover:text-white',
          )}
        >
          Baguio City
        </button>
      </div>

      <div className="relative min-h-[660px] px-4 pb-8 pt-24 sm:min-h-[700px] sm:px-6 lg:min-h-[760px] lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,174,255,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

        <div className="absolute inset-x-0 bottom-[7.25rem] top-[7.25rem] hidden lg:block">
          {items.map((item, index) => {
            const offset = getOffset(index, activeIndex, items.length);
            const abs = Math.abs(offset);

            if (abs > 3) return null;

            const isActive = offset === 0;
            const x = offset * 270;
            const scale = isActive ? 1.08 : abs === 1 ? 0.84 : abs === 2 ? 0.7 : 0.58;
            const opacity = isActive ? 1 : abs === 1 ? 0.72 : abs === 2 ? 0.38 : 0.16;
            const rotate = offset * -8;
            const blur = isActive ? '0px' : abs === 1 ? '1px' : '3px';

            return (
              <motion.button
                key={`${tab}-${String(item.id)}`}
                type="button"
                initial={false}
                animate={{
                  x,
                  scale,
                  opacity,
                  rotate,
                  filter: `blur(${blur})`,
                  zIndex: 20 - abs,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.9 }}
                onClick={() => onSelect(index)}
                className="absolute left-1/2 top-1/2 h-[380px] w-[240px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_28px_70px_rgba(0,0,0,0.45)]"
              >
                <img
                  src={item.images?.[0] || item.image || '/marketing/images/events/1.JPG'}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.12),rgba(7,10,18,0.84))]" />
                <div className="absolute inset-x-3 bottom-3 rounded-[1.35rem] bg-black/35 px-3 py-3 text-left backdrop-blur-md">
                  <div className="line-clamp-2 text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/70">{badge}</div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="relative mx-auto max-w-[1150px] lg:pt-6">
          <AnimatePresence mode="wait">
            <motion.article
              key={`${tab}-${String(active.id)}`}
              initial={{ opacity: 0, y: 32, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -26, scale: 0.9 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto overflow-hidden rounded-[2.35rem] border border-white/10 bg-white/5 shadow-[0_40px_110px_rgba(0,0,0,0.4)] backdrop-blur-sm lg:max-w-[760px]"
            >
              <div className="relative h-[460px] sm:h-[520px] lg:h-[560px]">
                <img
                  src={active.images?.[0] || active.image || '/marketing/images/events/1.JPG'}
                  alt={active.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,12,18,0.08),rgba(9,12,18,0.82))]" />

                <div className="absolute inset-x-0 top-0 flex justify-between gap-3 p-5 pt-14 sm:p-6 sm:pt-16">
                  <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-md">
                    {badge}
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={onPrev}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white transition hover:scale-105 hover:bg-black/55"
                      aria-label="Previous event"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={onNext}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white transition hover:scale-105 hover:bg-black/55"
                      aria-label="Next event"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-8">
                  <div className="rounded-[2rem] border border-white/10 bg-black/42 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6">
                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">
                      {formatEventRange(active)}
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl lg:text-[2.35rem]">
                      {active.title}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/86">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                        <CalendarDays className="h-4 w-4" />
                        {active.date}
                      </span>
                      {active.time ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                          <Clock3 className="h-4 w-4" />
                          {active.time}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                        <MapPin className="h-4 w-4" />
                        {active.venue}
                      </span>
                    </div>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/84 sm:text-[15px]">
                      {active.note || active.summary || active.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-between gap-3 sm:hidden">
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/45 text-sm font-semibold text-white backdrop-blur"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/45 text-sm font-semibold text-white backdrop-blur"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {items.map((item, index) => (
              <button
                key={`dot-${tab}-${String(item.id)}`}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  'h-2.5 rounded-full transition-all',
                  index === activeIndex ? 'w-12 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60',
                )}
                aria-label={`Open ${item.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsHighlights({ items = [], pageMode = false }: Props) {
  const [tab, setTab] = useState<ScopeKey>('bccc');
  const bcccEvents = useMemo(() => items.filter((item) => item.isPublic && item.scope !== 'city'), [items]);
  const cityEvents = useMemo(() => items.filter((item) => item.isPublic && item.scope === 'city'), [items]);
  const grouped = useMemo(() => ({ bccc: bcccEvents, city: cityEvents }), [bcccEvents, cityEvents]);

  const [activeIndexMap, setActiveIndexMap] = useState<Record<ScopeKey, number>>({
    bccc: 0,
    city: 0,
  });

  const activeItems = grouped[tab];

  useEffect(() => {
    if (activeItems.length === 0) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndexMap((current) => ({
        ...current,
        [tab]: wrapIndex((current[tab] ?? 0) + 1, activeItems.length),
      }));
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [activeItems.length, tab]);

  useEffect(() => {
    if (tab === 'bccc' && bcccEvents.length === 0 && cityEvents.length > 0) {
      setTab('city');
    }
  }, [bcccEvents.length, cityEvents.length, tab]);

  useEffect(() => {
    setActiveIndexMap((current) => ({
      bccc: wrapIndex(current.bccc ?? 0, Math.max(bcccEvents.length, 1)),
      city: wrapIndex(current.city ?? 0, Math.max(cityEvents.length, 1)),
    }));
  }, [bcccEvents.length, cityEvents.length]);

  if (bcccEvents.length === 0 && cityEvents.length === 0) return null;

  const activeIndex = wrapIndex(activeIndexMap[tab] ?? 0, Math.max(activeItems.length, 1));

  const setActiveIndex = (index: number) =>
    setActiveIndexMap((current) => ({
      ...current,
      [tab]: wrapIndex(index, activeItems.length),
    }));

  const goPrev = () => setActiveIndex(activeIndex - 1);
  const goNext = () => setActiveIndex(activeIndex + 1);

  return (
    <section className={cn(pageMode ? 'min-h-screen pt-[7.25rem]' : 'mt-14 px-4 sm:px-6 lg:px-8')}>
      <div className={cn('mx-auto w-full', pageMode ? 'max-w-none' : 'max-w-[1680px]')}>
        {!pageMode ? (
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="public-chip border-[#0f8b6d]/20 bg-[#0f8b6d]/10 text-[#0f8b6d] dark:border-[#8ea3ff]/20 dark:bg-[#8ea3ff]/10 dark:text-[#b6c6ff]">
                Event Highlights
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Cinematic event reels for BCCC and Baguio City programs.
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                The active event now expands in the center like a featured film frame, while nearby cards slide around it with smoother looped motion.
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex items-center rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#294CFF]"
            >
              Open Fullscreen Events
            </Link>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -34 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <CarouselStage
              items={activeItems}
              activeIndex={activeIndex}
              badge={tab === 'bccc' ? 'BCCC Event' : 'Baguio City Event'}
              onSelect={setActiveIndex}
              onPrev={goPrev}
              onNext={goNext}
              tab={tab}
              setTab={setTab}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
