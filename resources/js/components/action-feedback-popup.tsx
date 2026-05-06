import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ImageUp, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type FlashBag = {
    success?: string | null;
    error?: string | null;
};

type PageErrors = Record<string, string | string[] | undefined>;

type SharedPageProps = {
    flash?: FlashBag;
    errors?: PageErrors;
};

type PopupTone = 'success' | 'upload' | 'deleted' | 'error';

type PopupState = {
    key: string;
    tone: PopupTone;
    title: string;
    message: string;
};

type PopupEventDetail = {
    key?: string;
    tone?: PopupTone;
    title?: string;
    message: string;
};

const ACTION_FEEDBACK_EVENT = 'bccc:action-feedback';

function firstErrorMessage(errors: PageErrors | undefined): string | null {
    if (!errors) return null;

    for (const value of Object.values(errors)) {
        if (Array.isArray(value) && value.length > 0) {
            const first = value.find(
                (item) => typeof item === 'string' && item.trim() !== '',
            );
            if (first) return first;
            continue;
        }

        if (typeof value === 'string' && value.trim() !== '') {
            return value;
        }
    }

    return null;
}

function inferSuccessMeta(message: string): { tone: PopupTone; title: string } {
    const text = message.toLowerCase();

    if (
        /(delete|deleted|remove|removed|archive|archived|trash|trashed)/i.test(
            text,
        )
    ) {
        return { tone: 'deleted', title: 'Deleted' };
    }

    if (/(upload|uploaded|image|images|photo|file|files|proof)/i.test(text)) {
        return { tone: 'upload', title: 'Uploaded' };
    }

    if (
        /(save|saved|update|updated|create|created|added|changed|reorder|sorted)/i.test(
            text,
        )
    ) {
        return { tone: 'success', title: 'Saved' };
    }

    return { tone: 'success', title: 'Success' };
}

function popupMeta(tone: PopupTone) {
    switch (tone) {
        case 'success':
            return {
                icon: CheckCircle2,
                shell: 'border-emerald-200/70 bg-white text-slate-950 dark:border-emerald-500/20 dark:bg-[#0f172a] dark:text-white',
                iconWrap:
                    'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300',
                title: 'text-emerald-700 dark:text-emerald-300',
            };
        case 'upload':
            return {
                icon: ImageUp,
                shell: 'border-sky-200/70 bg-white text-slate-950 dark:border-sky-500/20 dark:bg-[#0f172a] dark:text-white',
                iconWrap:
                    'bg-sky-500/12 text-sky-600 dark:bg-sky-400/12 dark:text-sky-300',
                title: 'text-sky-700 dark:text-sky-300',
            };
        case 'deleted':
            return {
                icon: Trash2,
                shell: 'border-rose-200/70 bg-white text-slate-950 dark:border-rose-500/20 dark:bg-[#0f172a] dark:text-white',
                iconWrap:
                    'bg-rose-500/12 text-rose-600 dark:bg-rose-400/12 dark:text-rose-300',
                title: 'text-rose-700 dark:text-rose-300',
            };
        default:
            return {
                icon: AlertTriangle,
                shell: 'border-amber-200/70 bg-white text-slate-950 dark:border-amber-500/20 dark:bg-[#0f172a] dark:text-white',
                iconWrap:
                    'bg-amber-500/12 text-amber-600 dark:bg-amber-400/12 dark:text-amber-300',
                title: 'text-amber-700 dark:text-amber-300',
            };
    }
}

function buildPopupFromEvent(detail: PopupEventDetail): PopupState {
    const tone = detail.tone ?? inferSuccessMeta(detail.message).tone;
    const title =
        detail.title ??
        (tone === 'error'
            ? 'Action not completed'
            : inferSuccessMeta(detail.message).title);

    return {
        key: detail.key ?? `${tone}:${title}:${detail.message}`,
        tone,
        title,
        message: detail.message,
    };
}

export default function ActionFeedbackPopup() {
    const { flash, errors } = usePage<SharedPageProps>().props;
    const [popup, setPopup] = useState<PopupState | null>(null);
    const timerRef = useRef<number | null>(null);

    const candidate = useMemo<PopupState | null>(() => {
        if (flash?.success) {
            const meta = inferSuccessMeta(flash.success);

            return {
                key: `success:${flash.success}`,
                tone: meta.tone,
                title: meta.title,
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
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<PopupEventDetail>).detail;
            if (!detail?.message) return;

            const next = buildPopupFromEvent(detail);

            setPopup((current) => {
                if (current?.key === next.key) return current;
                return next;
            });
        };

        window.addEventListener(
            ACTION_FEEDBACK_EVENT,
            handler as EventListener,
        );

        return () => {
            window.removeEventListener(
                ACTION_FEEDBACK_EVENT,
                handler as EventListener,
            );
        };
    }, []);

    useEffect(() => {
        if (!popup) return;

        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        timerRef.current = window.setTimeout(() => {
            setPopup(null);
            timerRef.current = null;
        }, 1500);

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
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-md"
            aria-live="polite"
        >
            <button
                type="button"
                className="absolute inset-0"
                onClick={() => setPopup(null)}
                aria-label="Close popup"
            />

            <div
                role="alert"
                className={`relative w-full max-w-md rounded-[1.8rem] border shadow-[0_30px_90px_rgba(15,23,42,0.28)] duration-200 animate-in fade-in zoom-in-95 ${meta.shell}`}
            >
                <div className="flex items-start gap-4 p-5">
                    <div className={`rounded-2xl p-3 ${meta.iconWrap}`}>
                        <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div
                            className={`text-xs font-bold tracking-[0.28em] uppercase ${meta.title}`}
                        >
                            {popup.title}
                        </div>
                        <div className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {popup.message}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setPopup(null)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-slate-500 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        aria-label="Close popup"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
