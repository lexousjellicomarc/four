import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    CalendarDays,
    ClipboardList,
    ContactRound,
    CreditCard,
    FileBarChart,
    FileClock,
    Globe2,
    LayoutDashboard,
    LayoutPanelTop,
    MessagesSquare,
    Settings2,
    Tags,
    UsersRound,
} from 'lucide-react';

type RoleLike =
    | string
    | {
          name?: string | null;
          role?: string | null;
          title?: string | null;
      }
    | null
    | undefined;

type AuthLike = {
    permissions?: string[];
    roles?: RoleLike[];
    user?: {
        role?: string | null;
        role_name?: string | null;
        roles?: RoleLike[];
        permissions?: string[];
    } | null;
};

export type BackendRole = 'admin' | 'manager' | 'staff' | 'user';

export type BackendNavItem = {
    title: string;
    href: string;
    icon?: LucideIcon;
    exact?: boolean;
    permission?: string | string[] | null;
};

function normalizeRoleText(value?: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    return String(value).trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function roleName(role: RoleLike): string | null {
    if (!role) return null;

    if (typeof role === 'string') {
        return normalizeRoleText(role);
    }

    return (
        normalizeRoleText(role.name) ??
        normalizeRoleText(role.role) ??
        normalizeRoleText(role.title)
    );
}

function pathRoleFallback(): BackendRole | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const path = window.location.pathname;

    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/manager')) return 'manager';
    if (path.startsWith('/staff')) return 'staff';
    if (
        path.startsWith('/my-dashboard') ||
        path.startsWith('/my-bookings') ||
        path.startsWith('/book')
    ) {
        return 'user';
    }

    return null;
}

export function getBackendRole(auth?: AuthLike | null): BackendRole {
    const roleValues = [
        ...(Array.isArray(auth?.roles) ? (auth?.roles ?? []) : []),
        ...(Array.isArray(auth?.user?.roles) ? (auth?.user?.roles ?? []) : []),
        auth?.user?.role,
        auth?.user?.role_name,
    ]
        .map(roleName)
        .filter(Boolean) as string[];

    if (roleValues.includes('admin') || roleValues.includes('administrator')) {
        return 'admin';
    }

    if (roleValues.includes('manager') || roleValues.includes('management')) {
        return 'manager';
    }

    if (roleValues.includes('staff') || roleValues.includes('employee')) {
        return 'staff';
    }

    return pathRoleFallback() ?? 'user';
}

export function backendRoleLabel(role: BackendRole): string {
    if (role === 'admin') return 'Administrator';
    if (role === 'manager') return 'Manager';
    if (role === 'staff') return 'Staff';

    return 'Client';
}

export function backendRoleEyebrow(role: BackendRole): string {
    if (role === 'admin') return 'Executive Workspace';
    if (role === 'manager') return 'Management Workspace';
    if (role === 'staff') return 'Operations Workspace';

    return 'Client Portal';
}

export function backendHomeHref(role: BackendRole): string {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'manager') return '/manager/dashboard';
    if (role === 'staff') return '/staff/dashboard';

    return '/my-dashboard';
}

export function backendBookingsHref(role: BackendRole): string {
    if (role === 'admin') return '/admin/bookings';
    if (role === 'manager') return '/manager/bookings';
    if (role === 'staff') return '/staff/bookings';

    return '/my-bookings';
}

export function backendBookingCreateHref(role: BackendRole): string {
    if (role === 'admin') return '/admin/bookings/create';
    if (role === 'staff') return '/staff/bookings/create';
    if (role === 'manager') return '/manager/bookings';

    return '/book';
}

export function backendCalendarHref(role: BackendRole): string {
    if (role === 'admin') return '/admin/calendar';
    if (role === 'manager') return '/manager/calendar';
    if (role === 'staff') return '/staff/calendar';

    return '/calendar';
}

export function backendPaymentReviewHref(role: BackendRole): string {
    if (role === 'manager') return '/manager/payments/review';

    return '/admin/payments/review';
}

export function backendMiceRegistryHref(role: BackendRole): string {
    if (role === 'manager') return '/manager/reports/mice-registry';

    return '/admin/reports/mice-registry';
}

export function backendGuidelinesHref(role: BackendRole): string | null {
    if (role === 'admin') return '/admin/guidelines-contacts';

    return null;
}

export function backendMainNav(role: BackendRole): BackendNavItem[] {
    if (role === 'admin') {
        return [
            {
                title: 'Dashboard',
                href: '/admin/dashboard',
                icon: LayoutDashboard,
                exact: true,
                permission: 'dashboard.view',
            },
            {
                title: 'Content',
                href: '/admin/content',
                icon: LayoutPanelTop,
                permission: 'services.manage',
            },
            {
                title: 'Calendar',
                href: '/admin/calendar',
                icon: CalendarDays,
                permission: 'dashboard.view',
            },
            {
                title: 'Bookings',
                href: '/admin/bookings',
                icon: ClipboardList,
                permission: 'bookings.view',
            },
            {
                title: 'Payments',
                href: '/admin/payments/review',
                icon: CreditCard,
                permission: 'payments.manage',
            },
            {
                title: 'Reports',
                href: '/admin/reports/mice-registry',
                icon: FileBarChart,
                permission: 'bookings.view',
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                title: 'Dashboard',
                href: '/manager/dashboard',
                icon: LayoutDashboard,
                exact: true,
                permission: 'dashboard.view',
            },
            {
                title: 'Calendar',
                href: '/manager/calendar',
                icon: CalendarDays,
                permission: 'dashboard.view',
            },
            {
                title: 'Bookings',
                href: '/manager/bookings',
                icon: ClipboardList,
                permission: 'bookings.view',
            },
            {
                title: 'Payments',
                href: '/manager/payments/review',
                icon: CreditCard,
                permission: 'payments.manage',
            },
            {
                title: 'Reports',
                href: '/manager/reports/mice-registry',
                icon: FileBarChart,
                permission: 'bookings.view',
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                title: 'Dashboard',
                href: '/staff/dashboard',
                icon: LayoutDashboard,
                exact: true,
                permission: 'dashboard.view',
            },
            {
                title: 'Calendar',
                href: '/staff/calendar',
                icon: CalendarDays,
                permission: 'dashboard.view',
            },
            {
                title: 'Bookings',
                href: '/staff/bookings',
                icon: ClipboardList,
                permission: 'bookings.view',
            },
            {
                title: 'Assist Booking',
                href: '/staff/bookings/create',
                icon: FileClock,
                permission: 'bookings.create',
            },
        ];
    }

    return [
        {
            title: 'Dashboard',
            href: '/my-dashboard',
            icon: LayoutDashboard,
            exact: true,
        },
        {
            title: 'My Bookings',
            href: '/my-bookings',
            icon: ClipboardList,
        },
        {
            title: 'Book Event',
            href: '/book',
            icon: CalendarDays,
            exact: true,
        },
    ];
}

export function backendAdminConfigNav(role: BackendRole): BackendNavItem[] {
    if (role !== 'admin') {
        return [];
    }

    return [
        {
            title: 'Venue Areas',
            href: '/admin/venue-areas',
            icon: Tags,
            permission: 'service_types.manage',
        },
        {
            title: 'Rental Options',
            href: '/admin/rental-options',
            icon: Settings2,
            permission: 'services.manage',
        },
        {
            title: 'Users',
            href: '/admin/users',
            icon: UsersRound,
            permission: 'users.manage',
        },
        {
            title: 'Inquiries',
            href: '/admin/inquiries',
            icon: MessagesSquare,
            permission: 'bookings.view',
        },
        {
            title: 'Guidelines',
            href: '/admin/guidelines-contacts',
            icon: ContactRound,
            permission: 'services.manage',
        },
    ];
}

export function backendExternalNav(role: BackendRole): BackendNavItem[] {
    if (role === 'admin') {
        return [
            {
                title: 'Public Website',
                href: '/',
                icon: Globe2,
                exact: true,
            },
            {
                title: 'Analytics',
                href: '/admin/bookings/analytics',
                icon: BarChart3,
                permission: 'bookings.view',
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                title: 'Public Website',
                href: '/',
                icon: Globe2,
                exact: true,
            },
            {
                title: 'MICE Registry',
                href: '/manager/reports/mice-registry',
                icon: FileBarChart,
                permission: 'bookings.view',
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                title: 'Public Website',
                href: '/',
                icon: Globe2,
                exact: true,
            },
            {
                title: 'Assist Booking',
                href: '/staff/bookings/create',
                icon: FileClock,
                permission: 'bookings.create',
            },
        ];
    }

    return [
        {
            title: 'Public Website',
            href: '/',
            icon: Globe2,
            exact: true,
        },
        {
            title: 'Book Event',
            href: '/book',
            icon: CalendarDays,
            exact: true,
        },
    ];
}

export function hrefValue(href: string): string {
    return href;
}

export function isBackendActive(
    currentUrl: string,
    href: string,
    exact = false,
): boolean {
    const currentPath = currentUrl.split('?')[0];
    const target = href.split('?')[0];

    if (exact) {
        return currentPath === target;
    }

    if (target === '/') {
        return currentPath === '/';
    }

    return currentPath === target || currentPath.startsWith(`${target}/`);
}

export function userHasPermission(
    permissions: string[] = [],
    required?: string | string[] | null,
): boolean {
    if (!required) return true;

    if (!Array.isArray(permissions) || permissions.length === 0) {
        return true;
    }

    const requiredList = Array.isArray(required) ? required : [required];

    return requiredList.some((permission) => permissions.includes(permission));
}
