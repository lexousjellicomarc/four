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
      }, 180);
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
        className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1 origin-left bg-[#0f8b6d] shadow transition-transform duration-300 dark:bg-[#8ea3ff] ${
          visible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
        }`}
      />

      <div
        className={`pointer-events-none fixed bottom-5 right-5 z-[9998] transition duration-200 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
        aria-live="polite"
        aria-hidden={!visible}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-[0_16px_45px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-[#17181c]/95 dark:text-slate-100">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading page...
        </div>
      </div>
    </>
  );
}
