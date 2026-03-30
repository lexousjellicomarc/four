import '../css/app.css';

import ActionFeedbackPopup from '@/components/action-feedback-popup';
import PencilBookedSuccessPopup from '@/components/success-popup';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    resolve: async (name) => {
        const page = await resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        );

        const CurrentPage = (page as any).default ?? page;

        const WrappedPage = (props: any) => (
            <Fragment>
                <ActionFeedbackPopup />
                <PencilBookedSuccessPopup />
                <CurrentPage {...props} />
            </Fragment>
        );

        (WrappedPage as any).layout = (CurrentPage as any).layout;
        (WrappedPage as any).displayName =
            (CurrentPage as any).displayName ||
            (CurrentPage as any).name ||
            'WrappedInertiaPage';

        return WrappedPage as any;
    },

    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },

    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
