import { Breadcrumbs } from '@/components/breadcrumbs';
import { RoleWorkspaceBar } from '@/components/role/role-workspace-bar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  getRoleFromAuth,
  getRoleTone,
} from '@/lib/role-ui';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({
  breadcrumbs = [],
}: {
  breadcrumbs?: BreadcrumbItemType[];
}) {
  const page = usePage<SharedData>();
  const role = getRoleFromAuth(page.props.auth);
  const tone = getRoleTone(role);

  return (
    <header
      className={`sticky top-0 z-30 flex min-h-16 shrink-0 items-center gap-3 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 md:px-5 ${tone.headerClass}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="-ml-1 rounded-xl text-current hover:bg-white/10 hover:text-current" />

        <div className="hidden min-w-0 md:block">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>

        <div className="min-w-0 md:hidden">
          <p className="truncate text-sm font-black">{tone.label}</p>
          <p className={`truncate text-xs ${tone.mutedTextClass}`}>
            {tone.eyebrow}
          </p>
        </div>
      </div>

      <RoleWorkspaceBar />
    </header>
  );
}
