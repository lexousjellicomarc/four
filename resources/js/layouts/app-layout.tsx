import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import type { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Info } from 'lucide-react';
import NotificationBell from '@/components/layout/NotificationBell';
import { getWorkspaceBadgeText, getWorkspaceSummary, hasBackendWorkspaceAccess, type WorkspaceAuthLike } from '@/lib/workspace';

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
  const { auth } = usePage<{ auth?: WorkspaceAuthLike }>().props;
  const isLoggedIn = !!auth?.user;
  const backendCapable = hasBackendWorkspaceAccess(auth);
  const badgeText = getWorkspaceBadgeText(auth?.user?.name, auth);
  const workspaceSummary = getWorkspaceSummary(auth);

  return (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
      {isLoggedIn && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-2">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-[#161a22]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-black tracking-[0.16em] text-white dark:bg-blue-600">
              {badgeText}
            </span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                {backendCapable ? 'Frontend + Backend session' : 'Booking session'}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">{workspaceSummary}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NotificationBell />

            {backendCapable ? (
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                <Link href="/admin/home?tab=home">
                  <ArrowRightLeft className="mr-1 h-4 w-4" />
                  Frontend Workspace
                </Link>
              </Button>
            ) : null}

            {backendCapable ? (
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                <Link href="/admin/guidelines-contacts">
                  <Info className="mr-1 h-4 w-4" />
                  Backend Guidelines &amp; Contacts
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {children}
    </AppLayoutTemplate>
  );
}
