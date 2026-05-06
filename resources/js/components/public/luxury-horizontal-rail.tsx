import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type LuxuryHorizontalRailProps = {
  children: ReactNode;
  label?: string;
  className?: string;
  railClassName?: string;
  showControls?: boolean;
};

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function LuxuryHorizontalRail({
  children,
  label = 'Scrollable content',
  className,
  railClassName,
  showControls = true,
}: LuxuryHorizontalRailProps) {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement | null>(null);

  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [dragging, setDragging] = useState(false);

  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;

    if (!rail) {
      setCanScrollPrevious(false);
      setCanScrollNext(false);
      return;
    }

    const maxScroll = rail.scrollWidth - rail.clientWidth;

    setCanScrollPrevious(rail.scrollLeft > 4);
    setCanScrollNext(rail.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    updateScrollState();

    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const handleScroll = () => updateScrollState();
    const handleResize = () => updateScrollState();

    rail.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      rail.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState]);

  const scrollByCard = (direction: 'previous' | 'next') => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const amount = Math.max(rail.clientWidth * 0.78, 280);

    rail.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    setDragging(true);
    dragStartX.current = event.clientX;
    dragStartScroll.current = rail.scrollLeft;
    rail.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;

    if (!rail || !dragging) {
      return;
    }

    const delta = event.clientX - dragStartX.current;
    rail.scrollLeft = dragStartScroll.current - delta;
  };

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;

    setDragging(false);

    if (rail && rail.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={cx('relative', className)}>
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-r from-[var(--bccc-bg)] to-transparent sm:w-20" />
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-l from-[var(--bccc-bg)] to-transparent sm:w-20" />

      {showControls ? (
        <div className="mb-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollByCard('previous')}
            disabled={!canScrollPrevious}
            className="inline-flex h-10 w-10 items-center justify-center border border-[var(--bccc-line)] bg-[var(--bccc-surface)] text-[var(--bccc-text)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[var(--bccc-line-gold)] disabled:pointer-events-none disabled:opacity-35"
            aria-label={`Scroll ${label} previous`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollByCard('next')}
            disabled={!canScrollNext}
            className="inline-flex h-10 w-10 items-center justify-center border border-[var(--bccc-line)] bg-[var(--bccc-surface)] text-[var(--bccc-text)] shadow-[var(--bccc-shadow-soft)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[var(--bccc-line-gold)] disabled:pointer-events-none disabled:opacity-35"
            aria-label={`Scroll ${label} next`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <motion.div
        ref={railRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cx(
          'bccc-hidden-scrollbar flex cursor-grab gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 active:cursor-grabbing sm:gap-4 lg:gap-5',
          dragging && 'select-none',
          railClassName,
        )}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
        whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.16 }}
        transition={{ duration: 0.62, ease: easeLuxury }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onMouseLeave={() => setDragging(false)}
      >
        {children}
      </motion.div>
    </div>
  );
}
