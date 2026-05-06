import { AppContent } from '@/components/app-content';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { BackendRouteLoader } from '@/components/ui/backend-route-loader';
import { GlobalFeedbackLayer } from '@/components/ui/global-feedback-layer';
import type { BreadcrumbItem } from '@/types';
import type { PropsWithChildren } from 'react';

export default function AppSidebarLayout({
  children,
  breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
  return (
    <div className="bccc-backend-shell min-h-screen bg-[var(--bccc-backend-bg)] text-[var(--bccc-backend-text)]">
      <BackendRouteLoader />
      <GlobalFeedbackLayer />

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_8%_0%,rgba(169,132,67,0.13),transparent_32%),radial-gradient(circle_at_94%_10%,rgba(23,56,45,0.12),transparent_36%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(90deg,rgba(27,23,18,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(27,23,18,0.026)_1px,transparent_1px)] bg-[length:78px_78px] opacity-70 dark:opacity-25" />

      <div className="relative z-10 flex min-h-screen">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppSidebarHeader breadcrumbs={breadcrumbs} />

          <AppContent>
            {children}
          </AppContent>
        </div>
      </div>
    </div>
  );
}
