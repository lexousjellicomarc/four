import '../css/app.css';
import '../css/bccc-system.css';
import AppNoticeCenter from '@/components/shared/app-notice-center';

import ActionFeedbackPopup from '@/components/action-feedback-popup';
import AppErrorBoundary from '@/components/system/app-error-boundary';
import RuntimeErrorOverlay from '@/components/system/runtime-error-overlay';
import PencilBookedSuccessPopup from '@/components/success-popup';
import GlobalConfirmDialog from '@/components/ui/bccc-confirm-dialog';
import PageTransition from '@/components/ui/page-transition';
import RouteLoadingOverlay from '@/components/ui/route-loading-overlay';
import StartupLoadingOverlay from '@/components/ui/startup-loading-overlay';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

type PageLayout = (page: ReactNode) => ReactNode;

type InertiaPageComponent = ComponentType<Record<string, unknown>> & {
    layout?: PageLayout;
    displayName?: string;
};

const appName = import.meta.env.VITE_APP_NAME || 'BCCC EASE';

initializeTheme();

function BcccRuntimeUiStack() {
    return (
        <>
            <RouteLoadingOverlay
                logoSrc="/marketing/images/logo/bccc-seal.png"
                label="Loading..."
                sublabel="Preparing your experience"
                minimumVisibleMs={1500}
            />

            <ActionFeedbackPopup />
            <PencilBookedSuccessPopup />
            <GlobalConfirmDialog />
            <RuntimeErrorOverlay />
        </>
    );
}

function MissingPageFallback({ pageName }: { pageName: string }) {
    return (
        <main className="grid min-h-screen place-items-center bg-[#f7f3ea] px-4 text-[#21180d] dark:bg-[#0c0f14] dark:text-white">
            <section className="w-full max-w-2xl rounded-[1.75rem] border border-amber-200 bg-white/90 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.15)] backdrop-blur-2xl dark:border-amber-400/20 dark:bg-[#111827]/90">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                    BCCC EASE Runtime Notice
                </p>

                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                    Page component could not be loaded
                </h1>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Inertia tried to render this page, but the matching React file was not found or could not be imported.
                </p>

                <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    Requested page: {pageName}
                </div>
            </section>
        </main>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    resolve: async (name) => {
        try {
            const pageModule = (await resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            )) as { default?: InertiaPageComponent };

            const CurrentPage = (pageModule.default ?? pageModule) as InertiaPageComponent;
            const originalLayout = CurrentPage.layout;

            function ResolvedPageContent(pageProps: Record<string, unknown>) {
                const page = <CurrentPage {...pageProps} />;
                const pageWithLayout = typeof originalLayout === 'function' ? originalLayout(page) : page;

                return (
                    <>
                        <PageTransition pageKey={name}>
                            {pageWithLayout}
                        </PageTransition>

                        <StartupLoadingOverlay
                            logoSrc="/marketing/images/logo/bccc-seal.png"
                            minimumMs={1500}
                        />

                        <BcccRuntimeUiStack />
                    </>
                );
            }

            function SafeResolvedPage(pageProps: Record<string, unknown>) {
                return (
                    <AppErrorBoundary pageName={name}>
                        <ResolvedPageContent {...pageProps} />
                    </AppErrorBoundary>
                );
            }

            SafeResolvedPage.displayName = CurrentPage.displayName || CurrentPage.name || 'BcccResolvedPage';

            return SafeResolvedPage as InertiaPageComponent;
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error(`[BCCC EASE] Failed to resolve Inertia page: ${name}`, error);
            }

            function SafeMissingPage() {
                return (
                    <AppErrorBoundary pageName={name}>
                        <MissingPageFallback pageName={name} />

                        <StartupLoadingOverlay
                            logoSrc="/marketing/images/logo/bccc-seal.png"
                            minimumMs={1500}
                        />

                        <BcccRuntimeUiStack />
                    </AppErrorBoundary>
                );
            }

            return SafeMissingPage as InertiaPageComponent;
        }
    },

    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <App {...props} />
                <AppNoticeCenter />
            </>,
        );
    },

    progress: {
        color: '#a98443',
        showSpinner: false,
    },
});
