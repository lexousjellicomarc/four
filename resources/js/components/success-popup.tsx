import { CalendarClock, CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type PencilBookedPopupPayload = {
    requestedAtIso: string;
    dueAtIso: string;
};

const STORAGE_KEY = '__pencil_booked_success_popup__';
const EVENT_NAME = 'pencil-booked-success-popup';

export function triggerPencilBookedSuccessPopup(
    payload: PencilBookedPopupPayload,
) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}

    try {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
    } catch {}
}

function safeReadFromSession(): PencilBookedPopupPayload | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        sessionStorage.removeItem(STORAGE_KEY);

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;

        const { requestedAtIso, dueAtIso } = parsed as any;
        if (typeof requestedAtIso !== 'string' || typeof dueAtIso !== 'string')
            return null;

        return { requestedAtIso, dueAtIso };
    } catch {
        return null;
    }
}

function formatDateTimeLocal(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;

    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PencilBookedSuccessPopup() {
    const [payload, setPayload] = useState<PencilBookedPopupPayload | null>(
        null,
    );
    const timerRef = useRef<number | null>(null);

    const close = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setPayload(null);
    };

    const show = (p: PencilBookedPopupPayload) => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setPayload(p);

        timerRef.current = window.setTimeout(() => {
            setPayload(null);
            timerRef.current = null;
        }, 1500);
    };

    useEffect(() => {
        const fromSession = safeReadFromSession();
        if (fromSession) show(fromSession);

        const handler = (e: Event) => {
            const ce = e as CustomEvent<PencilBookedPopupPayload>;
            if (!ce?.detail) return;

            try {
                sessionStorage.removeItem(STORAGE_KEY);
            } catch {}

            show(ce.detail);
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

    if (!payload) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-[1.9rem] border border-emerald-200/70 bg-white text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.28)] duration-200 animate-in fade-in zoom-in-95 dark:border-emerald-500/20 dark:bg-[#0f172a] dark:text-white">
                <div className="flex items-start gap-4 p-5">
                    <div className="rounded-2xl bg-emerald-500/12 p-3 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold tracking-[0.28em] text-emerald-700 uppercase dark:text-emerald-300">
                            Booking submitted
                        </div>

                        <div className="mt-2 text-base leading-tight font-semibold">
                            Your booking is pencil booked for 24 hours.
                        </div>

                        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                            <CalendarClock className="mt-1 h-4 w-4 shrink-0" />
                            <div>
                                Kindly settle your payment on or before{' '}
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {formatDateTimeLocal(payload.dueAtIso)}
                                </span>
                                .
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={close}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-slate-500 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        aria-label="Close notice"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
