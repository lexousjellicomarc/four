import {
    ResourceActionLink,
    ResourceEmptyState,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
    ResourceToolbar,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Mail,
    Pencil,
    ShieldCheck,
    UserCog,
    UsersRound,
} from 'lucide-react';

type UserRow = {
    id?: number | string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    role_name?: string | null;
    roles?: Array<string | { name?: string | null }> | null;
    created_at?: string | null;
};

type PageProps = {
    users?: UserRow[] | { data?: UserRow[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Users & Roles', href: '/admin/users' },
];

function collection<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
        return (value as { data: T[] }).data;
    }

    return [];
}

function roleLabel(user: UserRow) {
    if (user.role_name || user.role) {
        return user.role_name || user.role || 'User';
    }

    const firstRole = user.roles?.[0];

    if (typeof firstRole === 'string') {
        return firstRole;
    }

    return firstRole?.name || 'User';
}

function normalizedRole(user: UserRow) {
    return roleLabel(user).toLowerCase();
}

export default function AdminUsersIndex() {
    const { props } = usePage<PageProps>();
    const users = collection<UserRow>(props.users);

    const adminCount = users.filter((user) => normalizedRole(user).includes('admin')).length;
    const managerCount = users.filter((user) => normalizedRole(user).includes('manager')).length;
    const staffCount = users.filter((user) => normalizedRole(user).includes('staff')).length;
    const clientCount = users.filter((user) => {
        const role = normalizedRole(user);

        return role.includes('user') || role.includes('client');
    }).length;

    return (
        <ResourcePageShell
            title="Users & Roles"
            eyebrow="System Setup"
            icon={UsersRound}
            breadcrumbs={breadcrumbs}
            subtitle="Manage administrator, manager, staff, and client accounts in one consistent workspace."
            actions={
                <ResourceActionLink href="/admin/users/create">
                    Add User
                </ResourceActionLink>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <ResourceStatCard
                    label="Total Users"
                    value={users.length}
                    description="All accounts loaded."
                    icon={UsersRound}
                />

                <ResourceStatCard
                    label="Admins"
                    value={adminCount}
                    description="System control accounts."
                    icon={ShieldCheck}
                />

                <ResourceStatCard
                    label="Managers"
                    value={managerCount}
                    description="Review and approval accounts."
                    icon={UserCog}
                />

                <ResourceStatCard
                    label="Staff"
                    value={staffCount}
                    description="Operations workspace accounts."
                    icon={UserCog}
                />

                <ResourceStatCard
                    label="Clients"
                    value={clientCount}
                    description="Public booking accounts."
                    icon={Mail}
                />
            </div>

            <div className="mt-5">
                <ResourceSection
                    title="Account directory"
                    eyebrow="Users"
                    description="Review user accounts and assigned role labels."
                    actions={
                        <ResourceActionLink href="/admin/users/create" variant="secondary">
                            Add User
                        </ResourceActionLink>
                    }
                >
                    <ResourceToolbar searchPlaceholder="Search users by name, email, or role..." />

                    {users.length === 0 ? (
                        <ResourceEmptyState
                            icon={UsersRound}
                            title="No users found"
                            description="Create user accounts for administrators, managers, staff, and clients."
                        />
                    ) : (
                        <div className="overflow-hidden rounded-[1.25rem] border border-[#d9c7a6]/70 dark:border-white/10">
                            <div className="hidden grid-cols-[1.1fr_1.3fr_0.7fr_0.4fr] gap-3 bg-[#f7f0e3] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:bg-white/7 dark:text-[#f1d89b] lg:grid">
                                <span>Name</span>
                                <span>Email</span>
                                <span>Role</span>
                                <span className="text-right">Action</span>
                            </div>

                            <div className="divide-y divide-[#eadcc2]/80 dark:divide-white/10">
                                {users.map((user, index) => (
                                    <article
                                        key={user.id ?? index}
                                        className="grid gap-3 bg-white/62 px-4 py-4 text-sm dark:bg-white/[0.035] lg:grid-cols-[1.1fr_1.3fr_0.7fr_0.4fr] lg:items-center"
                                    >
                                        <div>
                                            <p className="font-semibold text-[#21180d] dark:text-white">
                                                {user.name || 'Unnamed user'}
                                            </p>

                                            <p className="mt-1 text-xs text-[#7a6b55] dark:text-white/42 lg:hidden">
                                                {user.email || 'No email'}
                                            </p>
                                        </div>

                                        <p className="hidden truncate text-[#6e604c] dark:text-white/56 lg:block">
                                            {user.email || 'No email'}
                                        </p>

                                        <div>
                                            <span className="rounded-full bg-[#f4ead8] px-3 py-1 text-xs font-bold text-[#7a5a24] dark:bg-white/10 dark:text-[#f1d89b]">
                                                {roleLabel(user)}
                                            </span>
                                        </div>

                                        <div className="flex justify-start lg:justify-end">
                                            {user.id ? (
                                                <Link
                                                    href={`/admin/users/${user.id}/edit`}
                                                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-3 text-xs font-bold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Edit
                                                </Link>
                                            ) : null}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}
