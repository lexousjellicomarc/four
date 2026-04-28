import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
  import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
  } from '@/components/ui/sidebar';
  import { UserInfo } from '@/components/user-info';
  import { UserMenuContent } from '@/components/user-menu-content';
  import { useIsMobile } from '@/hooks/use-mobile';
  import {
    getRoleFromAuth,
    getRoleInitials,
    getRoleTone,
  } from '@/lib/role-ui';
  import { type SharedData } from '@/types';
  import { usePage } from '@inertiajs/react';
  import { ChevronsUpDown } from 'lucide-react';

  export function NavUser() {
    const { auth } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const role = getRoleFromAuth(auth);
    const tone = getRoleTone(role);
    const initials = getRoleInitials(auth);

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={`group h-auto rounded-2xl border px-3 py-3 data-[state=open]:bg-white/10 ${tone.brandClass}`}
                data-test="sidebar-menu-button"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/15 text-xs font-black tracking-[0.18em]">
                  {initials}
                </span>

                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <UserInfo user={auth.user} />
                  <p className={`mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.16em] ${tone.mutedTextClass}`}>
                    {tone.label}
                  </p>
                </div>

                <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-2xl p-2"
              align="end"
              side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
            >
              <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
