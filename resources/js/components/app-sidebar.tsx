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
} from '@/components/ui/sidebar';
import { Link } from '@inertiajs/react';
import {
  ClipboardList,
  ShieldCheck,
  Tags,
  CalendarDays,
  Users,
  Calendar,
  MessagesSquare,
  FileSpreadsheet,
  Monitor,
  LayoutPanelTop,
} from 'lucide-react';
import AppLogo from './app-logo';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
  {
    title: 'Calendar',
    href: '/dashboard',
    icon: Calendar,
    permission: 'dashboard.view',
  },
  {
    title: 'Manage Calendar Center',
    href: '/calendar/manage',
    icon: LayoutPanelTop,
    permission: 'dashboard.view',
  },
  {
    title: 'Bookings',
    href: '/bookings',
    icon: CalendarDays,
    permission: 'bookings.view',
  },
  {
    title: 'Services',
    href: '/services',
    icon: ClipboardList,
    permission: 'services.manage',
  },
  {
    title: 'Service Types',
    href: '/service-types',
    icon: Tags,
    permission: 'service_types.manage',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    permission: 'users.manage',
  },
  {
    title: 'Roles',
    href: '/users/roles',
    icon: ShieldCheck,
    permission: 'users.manage',
  },
  {
    title: 'MICE Registry',
    href: '/reports/mice-registry',
    icon: FileSpreadsheet,
    permission: 'bookings.view',
  },
  {
    title: 'Inquiries',
    href: '/admin/inquiries',
    icon: MessagesSquare,
    permission: 'bookings.view',
  },
];

const workspaceItems = [
  { title: 'Frontend Admin', href: '/admin/home?tab=home', icon: Monitor },
  { title: 'Public Website', href: '/', icon: LayoutPanelTop },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />

        <SidebarGroup className="px-2 py-0">
          <SidebarGroupLabel>Frontend / Backend</SidebarGroupLabel>
          <SidebarMenu>
            {workspaceItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={{ children: item.title }}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
