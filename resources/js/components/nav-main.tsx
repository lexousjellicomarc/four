import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from '@/components/ui/sidebar';
  import {
    hasNavPermission,
    hrefToString,
    isHrefActive,
  } from '@/lib/role-ui';
  import { type NavItem, type SharedData } from '@/types';
  import { Link, usePage } from '@inertiajs/react';

  export function NavMain({
    items = [],
    title = 'Platform',
    activeClassName,
  }: {
    items: NavItem[];
    title?: string;
    activeClassName?: string;
  }) {
    const page = usePage<SharedData>();
    const permissions = page.props.auth?.permissions ?? [];

    const visibleItems = items.filter((item) => hasNavPermission(item, permissions));

    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <SidebarGroup className="px-2 py-0">
        <SidebarGroupLabel>{title}</SidebarGroupLabel>

        <SidebarMenu>
          {visibleItems.map((item) => {
            const href = hrefToString(item.href);
            const active = isHrefActive(page.url, item.href);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={`${item.title}-${href}`}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={{ children: item.title }}
                  className={
                    active
                      ? activeClassName
                      : 'text-current/75 hover:bg-white/10 hover:text-current'
                  }
                >
                  <Link href={item.href} prefetch>
                    {Icon ? <Icon /> : null}
                    <span>{item.title}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-full border border-current/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] opacity-70 group-data-[collapsible=icon]:hidden">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    );
  }
