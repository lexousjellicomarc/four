import { RoleWorkspaceShell } from '@/components/role/role-workspace-shell';
import { normalizeWorkspaceRole } from '@/lib/booking-role-ui';
import type { RoleThemeKey } from '@/lib/role-theme';
import type { BreadcrumbItem } from '@/types';
import type { ReactNode } from 'react';

type BookingRolePageShellProps = {
  role?: string | null;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

function bookingBreadcrumbs(role: RoleThemeKey): BreadcrumbItem[] {
  if (role === 'admin') {
    return [
      { title: 'Admin', href: '/admin/dashboard' },
      { title: 'Bookings', href: '/admin/bookings' },
    ];
  }

  if (role === 'manager') {
    return [
      { title: 'Manager', href: '/manager/dashboard' },
      { title: 'Bookings', href: '/manager/bookings' },
    ];
  }

  if (role === 'staff') {
    return [
      { title: 'Staff', href: '/staff/dashboard' },
      { title: 'Bookings', href: '/staff/bookings' },
    ];
  }

  return [
    { title: 'My Dashboard', href: '/my-dashboard' },
    { title: 'My Bookings', href: '/my-bookings' },
  ];
}

function eyebrowFor(role: RoleThemeKey): string {
  if (role === 'admin') return 'Executive Reservation Control';
  if (role === 'manager') return 'Management Reservation Review';
  if (role === 'staff') return 'Operations Booking Desk';
  return 'Client Reservation Portal';
}

export function BookingRolePageShell({
  role,
  title,
  description,
  actions,
  children,
}: BookingRolePageShellProps) {
  const normalizedRole = normalizeWorkspaceRole(role) as RoleThemeKey;

  return (
    <RoleWorkspaceShell
      role={normalizedRole}
      title={title}
      eyebrow={eyebrowFor(normalizedRole)}
      description={description}
      breadcrumbs={bookingBreadcrumbs(normalizedRole)}
      actions={actions}
    >
      {children}
    </RoleWorkspaceShell>
  );
}
