import { RoleWorkspaceShell } from '@/components/role/role-workspace-shell';
import {
    currentWorkspaceRole,
    normalizeAdminResourceRole,
    roleHomeHref,
    type AdminResourceRole,
} from '@/lib/admin-resource-ui';
import { getRoleTheme } from '@/lib/role-theme';
import type { BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Building2,
    ClipboardList,
    CreditCard,
    FileBarChart,
    LayoutDashboard,
    MessageSquareText,
    Settings,
    Tags,
    UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';

type ResourcePageShellProps = {
    role?: string | null;
    title: string;
    eyebrow?: string;
    description: string;
    current: string;
    children: ReactNode;
    actions?: ReactNode;
};

function resourceHref(role: AdminResourceRole, current: string): string {
    if (role === 'admin') {
        if (current === 'Content') return '/admin/content';
        if (current === 'Venue Areas') return '/admin/venue-areas';
        if (current === 'Rental Options') return '/admin/rental-options';
        if (current === 'Users') return '/admin/users';
        if (current === 'Inquiries') return '/admin/inquiries';
        if (current === 'Payment Review') return '/admin/payments/review';
        if (current === 'MICE Registry') return '/admin/reports/mice-registry';

        return '/admin/dashboard';
    }

    if (role === 'manager') {
        if (current === 'Payment Review') return '/manager/payments/review';
        if (current === 'MICE Registry')
            return '/manager/reports/mice-registry';
        if (current === 'Bookings') return '/manager/bookings';

        return '/manager/dashboard';
    }

    if (role === 'staff') {
        if (current === 'Inquiries') return '/staff/inquiries';
        if (current === 'Bookings') return '/staff/bookings';

        return '/staff/dashboard';
    }

    return '/my-dashboard';
}

function quickLinks(role: AdminResourceRole) {
    if (role === 'admin') {
        return [
            {
                label: 'Dashboard',
                href: '/admin/dashboard',
                icon: LayoutDashboard,
            },
            {
                label: 'Bookings',
                href: '/admin/bookings',
                icon: ClipboardList,
            },
            {
                label: 'Payments',
                href: '/admin/payments/review',
                icon: CreditCard,
            },
            {
                label: 'MICE',
                href: '/admin/reports/mice-registry',
                icon: FileBarChart,
            },
            {
                label: 'Content',
                href: '/admin/content',
                icon: Building2,
            },
            {
                label: 'Venue Areas',
                href: '/admin/venue-areas',
                icon: Tags,
            },
            {
                label: 'Rental Options',
                href: '/admin/rental-options',
                icon: Settings,
            },
            {
                label: 'Users',
                href: '/admin/users',
                icon: UsersRound,
            },
            {
                label: 'Inquiries',
                href: '/admin/inquiries',
                icon: MessageSquareText,
            },
        ];
    }

    if (role === 'manager') {
        return [
            {
                label: 'Dashboard',
                href: '/manager/dashboard',
                icon: LayoutDashboard,
            },
            {
                label: 'Bookings',
                href: '/manager/bookings',
                icon: ClipboardList,
            },
            {
                label: 'Payments',
                href: '/manager/payments/review',
                icon: CreditCard,
            },
            {
                label: 'MICE',
                href: '/manager/reports/mice-registry',
                icon: FileBarChart,
            },
        ];
    }

    if (role === 'staff') {
        return [
            {
                label: 'Dashboard',
                href: '/staff/dashboard',
                icon: LayoutDashboard,
            },
            {
                label: 'Bookings',
                href: '/staff/bookings',
                icon: ClipboardList,
            },
            {
                label: 'Inquiries',
                href: '/staff/inquiries',
                icon: MessageSquareText,
            },
        ];
    }

    return [
        {
            label: 'Dashboard',
            href: '/my-dashboard',
            icon: LayoutDashboard,
        },
        {
            label: 'My Bookings',
            href: '/my-bookings',
            icon: ClipboardList,
        },
    ];
}

export function ResourcePageShell({
    role,
    title,
    eyebrow = 'Backend Workspace',
    description,
    current,
    children,
    actions,
}: ResourcePageShellProps) {
    const normalizedRole = normalizeAdminResourceRole(
        role ?? currentWorkspaceRole(),
    );
    const theme = getRoleTheme(normalizedRole);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: theme.label,
            href: roleHomeHref(normalizedRole),
        },
        {
            title: current,
            href: resourceHref(normalizedRole, current),
        },
    ];

    const links = quickLinks(normalizedRole);

    return (
        <RoleWorkspaceShell
            role={normalizedRole}
            title={title}
            eyebrow={eyebrow}
            description={description}
            breadcrumbs={breadcrumbs}
            actions={actions}
            compact
        >
            <div className="backend-admin-page space-y-5">
                <section className="alh-admin-panel p-4">
                    <div className="flex flex-wrap gap-2">
                        {links.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`alh-admin-shortcut ${
                                        current === item.label
                                            ? 'is-active'
                                            : ''
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {children}
            </div>
        </RoleWorkspaceShell>
    );
}
