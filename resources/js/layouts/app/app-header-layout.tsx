import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { GlobalFeedbackLayer } from '@/components/ui/global-feedback-layer';
import { type BreadcrumbItem } from '@/types';
import type { PropsWithChildren } from 'react';

export default function AppHeaderLayout({
  children,
  breadcrumbs,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
  return (
    <AppShell>
      <AppHeader breadcrumbs={breadcrumbs} />

      <AppContent>
        {children}
      </AppContent>

      <GlobalFeedbackLayer />
    </AppShell>
  );
}
