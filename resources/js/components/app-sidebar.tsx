import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  getRoleDescription,
  getRoleFromAuth,
  getRoleInitials,
  getRoleMenuGroups,
  getRoleQuickActions,
  getRoleTone,
  hrefToString,
  isHrefActive,
} from '@/lib/role-ui';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

export function AppSidebar() {
  const page = usePage<SharedData>();
  const auth = page.props.auth;
  const role = getRoleFromAuth(auth);
  const tone = getRoleTone(role);
  const initials = getRoleInitials(auth);
  const groups = getRoleMenuGroups(role);
  const quickActions = getRoleQuickActions(role);

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className={tone.sidebarClass}
    >
      <SidebarHeader className="gap-3 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className={`h-auto min-h-14 rounded-2xl border px-3 py-3 ${tone.brandClass}`}
              tooltip={{ children: 'BCCC EASE' }}
            >
              <Link href={tone.homeHref} prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="group-data-[collapsible=icon]:hidden">
          <div className={`relative overflow-hidden rounded-3xl border p-4 ${tone.brandClass}`}>
            <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${tone.glowClass}`} />

            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/15 text-xs font-black tracking-[0.18em]">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-[0.22em]">
                  {tone.eyebrow}
                </p>

                <p className="mt-1 truncate text-sm font-bold">
                  {tone.label}
                </p>

                <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${tone.mutedTextClass}`}>
                  {getRoleDescription(role)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-3 px-2">
        {groups.map((group) => (
          <NavMain
            key={group.title}
            title={group.title}
            items={group.items}
            activeClassName={tone.activeClass}
          />
        ))}

        <SidebarGroup className="px-2 py-0">
          <SidebarGroupLabel>Quick Access</SidebarGroupLabel>
          <SidebarMenu>
            {quickActions.map((item) => {
              const href = hrefToString(item.href);
              const active = isHrefActive(page.url, item.href);
              const Icon = item.icon ?? ShieldCheck;

              return (
                <SidebarMenuItem key={`${item.title}-${href}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={{ children: item.title }}
                    className={active ? tone.activeClass : 'hover:bg-white/10 hover:text-current'}
                  >
                    <Link href={item.href} prefetch>
                      <Icon />
                      <span>{item.title}</span>
                      {href === '/' ? (
                        <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-60 group-data-[collapsible=icon]:hidden" />
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
