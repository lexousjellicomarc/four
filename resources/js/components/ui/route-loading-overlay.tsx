import { router } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function RouteLoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (showTimer.current) {
        window.clearTimeout(showTimer.current);
        showTimer.current = null;
      }

      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };

    const reveal = () => {
      clearTimers();

      showTimer.current = window.setTimeout(() => {
        setVisible(true);
      }, 120);
    };

    const conceal = () => {
      clearTimers();

      hideTimer.current = window.setTimeout(() => {
        setVisible(false);
      }, 220);
    };

    const offStart = router.on('start', reveal);
    const offFinish = router.on('finish', conceal);
    const offError = router.on('error', conceal);
    const offInvalid = router.on('invalid', conceal);
    const offException = router.on('exception', conceal);
    const offNavigate = router.on('navigate', conceal);

    return () => {
      clearTimers();

      offStart();
      offFinish();
      offError();
      offInvalid();
      offException();
      offNavigate();
    };
  }, []);

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] origin-left bg-gradient-to-r from-[#17382d] via-[#a98443] to-[#f4dfad] shadow-[0_0_28px_rgba(169,132,67,0.42)] transition-all duration-500 ease-out dark:from-[#f7e7b3] dark:via-[#a98443] dark:to-[#17382d] ${
          visible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
        }`}
      />

      <div
        className={`pointer-events-none fixed bottom-5 right-5 z-[9998] transition-all duration-300 ease-out ${
          visible ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-2 opacity-0 blur-[2px]'
        }`}
        aria-live="polite"
        aria-hidden={!visible}
      >
        <div className="inline-flex items-center gap-3 border border-[#a98443]/30 bg-[#fbf7ef]/92 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#17382d] shadow-[0_22px_60px_rgba(27,23,18,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[#10110f]/92 dark:text-[#f4dfad]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Opening
        </div>
      </div>
    </>
  );
}
