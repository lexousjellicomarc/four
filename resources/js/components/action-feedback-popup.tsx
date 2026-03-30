import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

type FlashBag = {
  success?: string | null;
  error?: string | null;
};

type PageErrors = Record<string, string | string[] | undefined>;

type SharedPageProps = {
  flash?: FlashBag;
  errors?: PageErrors;
};

type PopupTone = 'success' | 'error' | 'info';

type PopupState = {
  key: string;
  tone: PopupTone;
  title: string;
  message: string;
};

function firstErrorMessage(errors: PageErrors | undefined): string | null {
  if (!errors) return null;

  for (const value of Object.values(errors)) {
    if (Array.isArray(value) && value.length > 0) {
      const first = value.find((item) => typeof item === 'string' && item.trim() !== '');
      if (first) return first;
      continue;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return null;
}

function popupMeta(tone: PopupTone) {
  switch (tone) {
    case 'success':
      return {
        icon: CheckCircle2,
        ring: 'border-emerald-200 bg-emerald-50/95 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/90 dark:text-emerald-50',
        iconWrap: 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
      };
    case 'error':
      return {
        icon: AlertTriangle,
        ring: 'border-red-200 bg-red-50/95 text-red-950 dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-50',
        iconWrap: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-300',
      };
    default:
      return {
        icon: Info,
        ring: 'border-slate-200 bg-white/95 text-slate-950 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-50',
        iconWrap: 'bg-slate-600/10 text-slate-600 dark:bg-slate-400/10 dark:text-slate-300',
      };
  }
}

export default function ActionFeedbackPopup() {
  const { flash, errors } = usePage<SharedPageProps>().props;
  const [popup, setPopup] = useState<PopupState | null>(null);
  const timerRef = useRef<number | null>(null);

  const candidate = useMemo<PopupState | null>(() => {
    if (flash?.success) {
      return {
        key: `success:${flash.success}`,
        tone: 'success',
        title: 'Success',
        message: flash.success,
      };
    }

    if (flash?.error) {
      return {
        key: `error:${flash.error}`,
        tone: 'error',
        title: 'Action not completed',
        message: flash.error,
      };
    }

    const firstError = firstErrorMessage(errors);
    if (firstError) {
      return {
        key: `validation:${firstError}`,
        tone: 'error',
        title: 'Please check the form',
        message: firstError,
      };
    }

    return null;
  }, [flash?.success, flash?.error, errors]);

  useEffect(() => {
    if (!candidate) return;

    setPopup((current) => {
      if (current?.key === candidate.key) return current;
      return candidate;
    });
  }, [candidate]);

  useEffect(() => {
    if (!popup) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = window.setTimeout(() => {
      setPopup(null);
      timerRef.current = null;
    }, popup.tone === 'error' ? 6000 : 4200);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [popup]);

  if (!popup) return null;

  const meta = popupMeta(popup.tone);
  const Icon = meta.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[10000] flex justify-center px-4" role="status" aria-live="polite">
      <div className={`pointer-events-auto w-full max-w-lg rounded-2xl border shadow-2xl backdrop-blur ${meta.ring}`}>
        <div className="flex items-start gap-3 p-4">
          <div className={`mt-0.5 rounded-full p-2 ${meta.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] opacity-80">{popup.title}</div>
            <div className="mt-1 text-sm leading-6">{popup.message}</div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setPopup(null)}
            aria-label="Close popup"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
