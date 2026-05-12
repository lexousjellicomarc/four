import { AppContent } from '@/components/app-content';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import BackendRouteLoader from '@/components/ui/backend-route-loader';
import type { BreadcrumbItem } from '@/types';
import type { PropsWithChildren } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <div className="min-h-screen bg-[#f6f0e4] text-[#21180d] antialiased dark:bg-[#0c0f14] dark:text-white">
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute left-[-14rem] top-[-14rem] h-[34rem] w-[34rem] rounded-full bg-[#d8b56d]/16 blur-3xl dark:bg-[#d8b56d]/7" />
                <div className="absolute bottom-[-18rem] right-[-12rem] h-[38rem] w-[38rem] rounded-full bg-[#7a5a24]/10 blur-3xl dark:bg-white/4" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.70),rgba(246,240,228,0.82))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(12,15,20,0.96))]" />
            </div>

            <div className="backend-shell relative z-10 flex min-h-screen">
                <AppSidebar />

                <div className="backend-main flex min-w-0 flex-1 flex-col lg:pl-[17.25rem]">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />

                    <AppContent>
                        {children}
                    </AppContent>
                </div>
            </div>

            <BackendRouteLoader />
        </div>
    );
}
