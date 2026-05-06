import '../css/app.css';
import '../css/bccc-final-unified.css';

import ActionFeedbackPopup from '@/components/action-feedback-popup';
import AppErrorBoundary from '@/components/system/app-error-boundary';
import PencilBookedSuccessPopup from '@/components/success-popup';
import RouteLoadingOverlay from '@/components/ui/route-loading-overlay';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

import '../css/backend-shadcn.css';
import '../css/backend-dashboard.css';
import '../css/backend-bookings.css';
import '../css/backend-admin-pages.css';
import '../css/backend-final-polish.css';
import '../css/backend-responsive-motion.css';
import '../css/backend-booking-wizard.css';
import '../css/backend-booking-preview-print.css';
import '../css/backend-sidebar-theme-fix.css';
import '../css/backend-booking-laptop-polish.css';
import '../css/backend-booking-hotel-flow.css';
import '../css/backend-booking-universal-responsive.css';
import '../css/backend-booking-motion-responsive-final.css';

const appName = import.meta.env.VITE_APP_NAME || 'BCCC EASE';

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
        <RouteLoadingOverlay />

        <ActionFeedbackPopup />
        <PencilBookedSuccessPopup />

        <AppErrorBoundary pageName={String(name)}>
          <CurrentPage {...props} />
        </AppErrorBoundary>
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
    color: '#a98443',
  },
});

initializeTheme();
