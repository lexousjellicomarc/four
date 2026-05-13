import { CalendarClock, CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PencilBookedPopupPayload = {
    requestedAtIso: string;
    dueAtIso: string;
};

const STORAGE_KEY = '__pencil_booked_success_popup__';
const EVENT_NAME = 'pencil-booked-success-popup';

export function triggerPencilBookedSuccessPopup(payload: PencilBookedPopupPayload) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Session storage can fail in strict privacy mode. The event below still handles the current page.
    }

    try {
        window.dispatchEvent(new CustomEvent<PencilBookedPopupPayload>(EVENT_NAME, { detail: payload }));
    } catch {
        // No-op.
    }
}

function safeReadFromSession(): PencilBookedPopupPayload | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return null;
        }

        sessionStorage.removeItem(STORAGE_KEY);

        const parsed = JSON.parse(raw) as Partial<PencilBookedPopupPayload>;

        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        if (typeof parsed.requestedAtIso !== 'string' || typeof parsed.dueAtIso !== 'string') {
            return null;
        }

        return {
            requestedAtIso: parsed.requestedAtIso,
            dueAtIso: parsed.dueAtIso,
        };
    } catch {
        return null;
    }
}

function formatDateTimeLocal(iso: string) {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return iso;
    }

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PencilBookedSuccessPopup() {
    const [mounted, setMounted] = useState(false);
    const [payload, setPayload] = useState<PencilBookedPopupPayload | null>(null);
    const timerRef = useRef<number | null>(null);

    const close = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setPayload(null);
    };

    const show = (nextPayload: PencilBookedPopupPayload) => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setPayload(nextPayload);

        timerRef.current = window.setTimeout(() => {
            setPayload(null);
            timerRef.current = null;
        }, 4200);
    };

    useEffect(() => {
        setMounted(true);

        const fromSession = safeReadFromSession();

        if (fromSession) {
            show(fromSession);
        }

        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<PencilBookedPopupPayload>;

            if (!customEvent?.detail) {
                return;
            }

            try {
                sessionStorage.removeItem(STORAGE_KEY);
            } catch {
                // No-op.
            }

            show(customEvent.detail);
        };

        window.addEventListener(EVENT_NAME, handler);

        return () => {
            window.removeEventListener(EVENT_NAME, handler);

            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    if (!mounted || !payload) {
        return null;
    }

    return createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[999998] flex justify-center px-4">
            <div className="pointer-events-auto relative w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-emerald-200/80 bg-white/92 p-5 text-slate-950 shadow-[0_24px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-emerald-400/20 dark:bg-[#111827]/92 dark:text-white">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400" />

                <button
                    type="button"
                    onClick={close}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white/70 text-slate-500 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    aria-label="Close booking success notice"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex gap-4 pr-8">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-[0.22em] text-emerald-700 uppercase dark:text-emerald-300">
                            Booking submitted
                        </p>

                        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                            Your booking is pencil booked for 24 hours.
                        </h2>

                        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/85 p-3 text-sm leading-relaxed text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                                Kindly settle your payment on or before{' '}
                                <span className="font-semibold">{formatDateTimeLocal(payload.dueAtIso)}</span>.
                                Failure to comply within the required period may result in automatic cancellation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
