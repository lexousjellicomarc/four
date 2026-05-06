import { Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PublicEventItem } from '@/types/public-content';

type Props = {
  items?: PublicEventItem[];
  pageMode?: boolean;
};

type ScopeKey = 'bccc' | 'city';

const AUTO_ADVANCE_MS = 5600;
const easeLuxury = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function wrapIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

function getOffset(index: number, activeIndex: number, length: number) {
  if (length <= 1) {
    return 0;
  }

  let diff = index - activeIndex;
  const half = Math.floor(length / 2);

  if (diff > half) {
    diff -= length;
  }

  if (diff < -half) {
    diff += length;
  }

  return diff;
}

function formatEventRange(item: PublicEventItem) {
  if (item.dateEnd && item.dateEnd !== item.date) {
    return `${item.date} — ${item.dateEnd}`;
  }

  return item.date;
}

function getEventImage(item: PublicEventItem, dark = false) {
  if (dark) {
    return item.darkImage || item.image || item.images?.[0] || '/marketing/images/hero/night2.png';
  }

  return item.lightImage || item.image || item.images?.[0] || '/marketing/images/hero/noon2.jpg';
}

function FilmStripDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between opacity-55">
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={`film-top-${index}`}
          className="h-3 w-5 border border-white/14 bg-black/20"
        />
      ))}
    </div>
  );
}

function FilmBottomDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-8 items-center justify-between opacity-45">
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={`film-bottom-${index}`}
          className="h-3 w-5 border border-white/14 bg-black/20"
        />
      ))}
    </div>
  );
}

function EventMeta({ item }: { item: PublicEventItem }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">
      <span className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.055] px-3 py-2">
        <CalendarDays className="h-3.5 w-3.5 text-[#f4dfad]" />
        {formatEventRange(item)}
      </span>

      {item.time ? (
        <span className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.055] px-3 py-2">
          <Clock3 className="h-3.5 w-3.5 text-[#f4dfad]" />
          {item.time}
        </span>
      ) : null}

      <span className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.055] px-3 py-2">
        <MapPin className="h-3.5 w-3.5 text-[#f4dfad]" />
        {item.venue || 'Baguio Convention and Cultural Center'}
      </span>
    </div>
  );
}

function ScopeToggle({
  tab,
  setTab,
  bcccCount,
  cityCount,
}: {
  tab: ScopeKey;
  setTab: (value: ScopeKey) => void;
  bcccCount: number;
  cityCount: number;
}) {
  const options: Array<{
    value: ScopeKey;
    label: string;
    count: number;
  }> = [
    {
      value: 'bccc',
      label: 'BCCC Events',
      count: bcccCount,
    },
    {
      value: 'city',
      label: 'Baguio City Events',
      count: cityCount,
    },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-xl border border-white/12 bg-black/24 p-1 text-white shadow-[0_22px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      {options.map((option) => {
        const active = tab === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTab(option.value)}
            disabled={option.count === 0}
            className={cx(
              'relative z-10 flex min-h-11 flex-1 items-center justify-center gap-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] transition duration-500 sm:text-[11px]',
              active ? 'text-[#17120a]' : 'text-white/66 hover:text-white',
              option.count === 0 && 'cursor-not-allowed opacity-35',
            )}
          >
            {active ? (
              <motion.span
                layoutId="event-scope-active"
                className="absolute inset-0 bg-[#f4dfad] shadow-[0_18px_46px_rgba(244,223,173,0.16)]"
                transition={{
                  duration: 0.42,
                  ease: easeLuxury,
                }}
              />
            ) : null}

            <span className="relative">{option.label}</span>
            <span
              className={cx(
                'relative inline-flex min-w-6 items-center justify-center border px-1.5 py-0.5 text-[9px]',
                active
                  ? 'border-[#17120a]/15 bg-[#17120a]/8 text-[#17120a]'
                  : 'border-white/12 bg-white/[0.06] text-white/50',
              )}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FilmCard({
  item,
  index,
  activeIndex,
  total,
  onSelect,
}: {
  item: PublicEventItem;
  index: number;
  activeIndex: number;
  total: number;
  onSelect: (index: number) => void;
}) {
  const offset = getOffset(index, activeIndex, total);
  const abs = Math.abs(offset);

  if (abs > 3) {
    return null;
  }

  const active = offset === 0;
  const x = offset * 260;
  const y = active ? 0 : abs === 1 ? 18 : abs === 2 ? 36 : 54;
  const scale = active ? 1 : abs === 1 ? 0.82 : abs === 2 ? 0.66 : 0.52;
  const opacity = active ? 1 : abs === 1 ? 0.62 : abs === 2 ? 0.32 : 0.12;
  const rotateY = offset * -13;
  const zIndex = 40 - abs;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(index)}
      aria-label={`View ${item.title}`}
      className={cx(
        'absolute left-1/2 top-1/2 block h-[23rem] w-[17rem] origin-center overflow-hidden border bg-black text-left shadow-[0_34px_90px_rgba(0,0,0,0.48)] outline-none transition-colors duration-500 sm:h-[27rem] sm:w-[20rem] lg:h-[31rem] lg:w-[23rem]',
        active ? 'border-[#f4dfad]/38' : 'border-white/10 hover:border-white/24',
      )}
      style={{
        zIndex,
      }}
      initial={{
        opacity: 0,
        x: '-50%',
        y: '-44%',
        scale: 0.84,
        rotateY: 0,
        filter: 'blur(12px)',
      }}
      animate={{
        opacity,
        x: `calc(-50% + ${x}px)`,
        y: `calc(-50% + ${y}px)`,
        scale,
        rotateY,
        filter: active ? 'blur(0px)' : abs === 1 ? 'blur(1px)' : 'blur(4px)',
      }}
      exit={{
        opacity: 0,
        scale: 0.82,
        filter: 'blur(12px)',
      }}
      transition={{
        duration: 0.72,
        ease: easeLuxury,
      }}
    >
      <img
        src={getEventImage(item, false)}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] dark:hidden"
        draggable={false}
      />

      <img
        src={getEventImage(item, true)}
        alt={item.title}
        className="absolute inset-0 hidden h-full w-full object-cover transition duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] dark:block"
        draggable={false}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.08)_38%,rgba(0,0,0,0.76)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-black/10" />

      <FilmStripDecoration />
      <FilmBottomDecoration />

      <div className="absolute left-4 top-11 z-20 border border-white/14 bg-black/32 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-[#f4dfad] backdrop-blur-xl">
        {item.category || (item.scope === 'city' ? 'City Event' : 'BCCC Event')}
      </div>

      <div className="absolute bottom-8 left-4 right-4 z-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/58">
          {formatEventRange(item)}
        </p>

        <h3 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-[-0.05em] text-white">
          {item.title}
        </h3>

        {active ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeLuxury, delay: 0.18 }}
            className="mt-3 h-px w-20 bg-[#f4dfad]/70"
          />
        ) : null}
      </div>
    </motion.button>
  );
}

function CarouselStage({
  items,
  activeIndex,
  onSelect,
  onPrev,
  onNext,
  tab,
  setTab,
  bcccCount,
  cityCount,
  pageMode = false,
}: {
  items: PublicEventItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  tab: ScopeKey;
  setTab: (value: ScopeKey) => void;
  bcccCount: number;
  cityCount: number;
  pageMode?: boolean;
}) {
  const active = items[activeIndex];
  const reduceMotion = useReducedMotion();

  if (!active) {
    return (
      <div className="border border-white/12 bg-white/[0.045] p-8 text-center text-sm text-white/58">
        No events are visible in this section yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative z-30 mb-8">
        <ScopeToggle
          tab={tab}
          setTab={setTab}
          bcccCount={bcccCount}
          cityCount={cityCount}
        />
      </div>

      <div
        className={cx(
          'relative mx-auto overflow-hidden border border-white/10 bg-[#080806] shadow-[0_36px_140px_rgba(0,0,0,0.44)]',
          pageMode
            ? 'min-h-[76svh]'
            : 'min-h-[38rem] sm:min-h-[42rem] lg:min-h-[46rem]',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,223,173,0.09),transparent_36%),radial-gradient(circle_at_bottom,rgba(47,106,85,0.16),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,6,0.94)_0%,rgba(8,8,6,0.18)_28%,rgba(8,8,6,0.18)_72%,rgba(8,8,6,0.94)_100%)]" />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="absolute inset-0"
            initial={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 0,
                    y: 34,
                    filter: 'blur(14px)',
                  }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                  }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    y: -26,
                    filter: 'blur(14px)',
                  }
            }
            transition={{ duration: 0.58, ease: easeLuxury }}
          >
            <div className="absolute inset-x-0 top-5 z-20 text-center">
              <span className="inline-flex items-center gap-2 border border-white/12 bg-white/[0.055] px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad] backdrop-blur-xl">
                <Film className="h-3.5 w-3.5" />
                {tab === 'city' ? 'Baguio City Reel' : 'BCCC Event Reel'}
              </span>
            </div>

            <div className="absolute inset-x-0 top-[46%] h-[1px] bg-gradient-to-r from-transparent via-[#f4dfad]/28 to-transparent" />

            <div className="absolute inset-x-0 top-16 h-[31rem] [perspective:1600px] sm:top-20 lg:top-24">
              {items.map((item, index) => (
                <FilmCard
                  key={`${tab}-${item.id}`}
                  item={item}
                  index={index}
                  activeIndex={activeIndex}
                  total={items.length}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-48 bg-gradient-to-t from-[#080806] via-[#080806]/82 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 z-40 grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${active.id}`}
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
              transition={{ duration: 0.42, ease: easeLuxury }}
              className="max-w-3xl"
            >
              <div className="mb-3 inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#f4dfad]">
                <Sparkles className="h-3.5 w-3.5" />
                {active.category || (tab === 'city' ? 'City Highlight' : 'BCCC Highlight')}
              </div>

              <h3 className="max-w-3xl text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
                {active.title}
              </h3>

              <EventMeta item={active} />

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/66">
                {active.note || active.summary || active.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex h-11 w-11 items-center justify-center border border-white/12 bg-white/[0.06] text-white/78 backdrop-blur-xl transition duration-500 hover:-translate-y-0.5 hover:border-[#f4dfad]/35 hover:text-[#f4dfad]"
              aria-label="Previous event"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onNext}
              className="inline-flex h-11 w-11 items-center justify-center border border-white/12 bg-white/[0.06] text-white/78 backdrop-blur-xl transition duration-500 hover:-translate-y-0.5 hover:border-[#f4dfad]/35 hover:text-[#f4dfad]"
              aria-label="Next event"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <Link
              href="/events"
              className="inline-flex h-11 items-center justify-center gap-2 border border-[#f4dfad]/36 bg-[#f4dfad] px-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#17120a] transition duration-500 hover:-translate-y-0.5 hover:bg-white"
            >
              View Events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-2 lg:flex">
          {items.map((item, index) => (
            <button
              key={`event-dot-${item.id}`}
              type="button"
              onClick={() => onSelect(index)}
              className={cx(
                'h-2 transition duration-500',
                index === activeIndex
                  ? 'w-12 bg-[#f4dfad]'
                  : 'w-2 bg-white/28 hover:bg-white/60',
              )}
              aria-label={`Open ${item.title}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EventsHighlights({ items = [], pageMode = false }: Props) {
  const [tab, setTab] = useState<ScopeKey>('bccc');

  const bcccEvents = useMemo(
    () => items.filter((item) => item.isPublic && item.scope !== 'city'),
    [items],
  );

  const cityEvents = useMemo(
    () => items.filter((item) => item.isPublic && item.scope === 'city'),
    [items],
  );

  const grouped = useMemo(
    () => ({
      bccc: bcccEvents,
      city: cityEvents,
    }),
    [bcccEvents, cityEvents],
  );

  const [activeIndexMap, setActiveIndexMap] = useState<Record<ScopeKey, number>>({
    bccc: 0,
    city: 0,
  });

  const activeItems = grouped[tab];

  useEffect(() => {
    if (tab === 'bccc' && bcccEvents.length === 0 && cityEvents.length > 0) {
      setTab('city');
    }

    if (tab === 'city' && cityEvents.length === 0 && bcccEvents.length > 0) {
      setTab('bccc');
    }
  }, [bcccEvents.length, cityEvents.length, tab]);

  useEffect(() => {
    setActiveIndexMap((current) => ({
      bccc: wrapIndex(current.bccc ?? 0, Math.max(bcccEvents.length, 1)),
      city: wrapIndex(current.city ?? 0, Math.max(cityEvents.length, 1)),
    }));
  }, [bcccEvents.length, cityEvents.length]);

  useEffect(() => {
    if (activeItems.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndexMap((current) => ({
        ...current,
        [tab]: wrapIndex((current[tab] ?? 0) + 1, activeItems.length),
      }));
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [activeItems.length, tab]);

  if (bcccEvents.length === 0 && cityEvents.length === 0) {
    return null;
  }

  const activeIndex = wrapIndex(activeIndexMap[tab] ?? 0, Math.max(activeItems.length, 1));

  const setActiveIndex = (index: number) => {
    setActiveIndexMap((current) => ({
      ...current,
      [tab]: wrapIndex(index, activeItems.length),
    }));
  };

  const goPrev = () => setActiveIndex(activeIndex - 1);
  const goNext = () => setActiveIndex(activeIndex + 1);

  return (
    <section
      className={cx(
        'relative overflow-hidden bg-[#080806] text-white',
        pageMode ? 'min-h-screen pb-10 pt-32' : 'public-section',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,223,173,0.11),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(47,106,85,0.18),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#080806_0%,rgba(8,8,6,0.94)_42%,#080806_100%)]" />

      <div className={cx('relative z-10', pageMode ? 'bccc-container-wide' : 'public-container')}>
        {!pageMode ? (
          <div className="mb-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
                <Film className="h-3.5 w-3.5" />
                Event Highlights
              </div>

              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.065em] text-white sm:text-5xl lg:text-6xl">
                Cinematic reels for BCCC and Baguio City programs.
              </h2>
            </div>

            <div className="lg:justify-self-end">
              <p className="max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                The active event expands at the center like a featured film frame, while nearby events glide behind it with a refined cinematic motion.
              </p>

              <Link
                href="/events"
                className="mt-5 inline-flex items-center gap-2 border border-white/12 bg-white/[0.06] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/82 transition hover:-translate-y-0.5 hover:border-[#f4dfad]/35 hover:text-[#f4dfad]"
              >
                Open Fullscreen Events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}

        <CarouselStage
          items={activeItems}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onPrev={goPrev}
          onNext={goNext}
          tab={tab}
          setTab={setTab}
          bcccCount={bcccEvents.length}
          cityCount={cityEvents.length}
          pageMode={pageMode}
        />
      </div>
    </section>
  );
}
