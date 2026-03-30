import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
