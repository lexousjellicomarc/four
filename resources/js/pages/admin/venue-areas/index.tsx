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
    Building2,
    CheckCircle2,
    Eye,
    Layers3,
    Pencil,
    Plus,
    UsersRound,
} from 'lucide-react';

type VenueArea = {
    id?: number | string;
    name?: string | null;
    title?: string | null;
    description?: string | null;
    capacity?: number | string | null;
    min_capacity?: number | null;
    max_capacity?: number | null;
    is_active?: boolean | number | string | null;
    services_count?: number | null;
    rental_options_count?: number | null;
    created_at?: string | null;
};

type PageProps = {
    venueAreas?: VenueArea[] | { data?: VenueArea[] };
    serviceTypes?: VenueArea[] | { data?: VenueArea[] };
    areas?: VenueArea[] | { data?: VenueArea[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Venue Areas', href: '/admin/venue-areas' },
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

function activeFlag(item: VenueArea) {
    return item.is_active === true || item.is_active === 1 || item.is_active === '1' || item.is_active === undefined;
}

function areaName(item: VenueArea) {
    return item.name || item.title || 'Untitled venue area';
}

function capacityLabel(item: VenueArea) {
    if (item.capacity) {
        return String(item.capacity);
    }

    if (item.min_capacity || item.max_capacity) {
        return `${item.min_capacity ?? 0} - ${item.max_capacity ?? '∞'}`;
    }

    return 'Not set';
}

function optionCount(item: VenueArea) {
    return Number(item.services_count ?? item.rental_options_count ?? 0);
}

export default function AdminVenueAreasIndex() {
    const { props } = usePage<PageProps>();

    const rows = collection<VenueArea>(props.venueAreas ?? props.serviceTypes ?? props.areas);
    const activeRows = rows.filter(activeFlag);
    const inactiveRows = rows.length - activeRows.length;
    const linkedOptions = rows.reduce((sum, item) => sum + optionCount(item), 0);

    return (
        <ResourcePageShell
            title="Venue Areas"
            eyebrow="System Setup"
            icon={Building2}
            breadcrumbs={breadcrumbs}
            subtitle="Manage BCCC venue areas used by the booking form, availability checker, public facility display, and rental option mapping."
            actions={
                <>
                    <ResourceActionLink href="/admin/rental-options" variant="secondary">
                        Rental Options
                    </ResourceActionLink>

                    <ResourceActionLink href="/admin/venue-areas/create">
                        New Venue Area
                    </ResourceActionLink>
                </>
            }
        >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ResourceStatCard
                    label="Total Areas"
                    value={rows.length}
                    description="All configured venue spaces."
                    icon={Building2}
                />

                <ResourceStatCard
                    label="Active"
                    value={activeRows.length}
                    description="Available for workflow usage."
                    icon={CheckCircle2}
                />

                <ResourceStatCard
                    label="Inactive"
                    value={inactiveRows}
                    description="Hidden or disabled area records."
                    icon={Eye}
                />

                <ResourceStatCard
                    label="Linked Options"
                    value={linkedOptions}
                    description="Rental options connected to areas."
                    icon={Layers3}
                />
            </div>

            <div className="mt-5">
                <ResourceSection
                    title="Configured venue spaces"
                    eyebrow="Service Types"
                    description="Keep venue names clean and consistent. These records should match public facility labels and booking availability choices."
                    actions={
                        <Link
                            href="/admin/venue-areas/create"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                        >
                            <Plus className="h-4 w-4" />
                            Add Area
                        </Link>
                    }
                >
                    <ResourceToolbar searchPlaceholder="Search venue areas..." />

                    {rows.length === 0 ? (
                        <ResourceEmptyState
                            icon={Building2}
                            title="No venue areas configured"
                            description="Create venue areas first. Rental options should be connected to these areas so booking, availability, and public facility displays stay synchronized."
                        />
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {rows.map((item, index) => (
                                <article
                                    key={item.id ?? index}
                                    className="group rounded-[1.35rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/70 p-4 shadow-[0_14px_40px_rgba(47,37,23,0.06)] transition hover:-translate-y-0.5 hover:border-[#b08d48]/80 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.06]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                            <Building2 className="h-5 w-5" />
                                        </span>

                                        <span
                                            className={
                                                activeFlag(item)
                                                    ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'
                                                    : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-white/52'
                                            }
                                        >
                                            {activeFlag(item) ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                                        {areaName(item)}
                                    </h3>

                                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        {item.description || 'No description provided.'}
                                    </p>

                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <MiniStat
                                            icon={UsersRound}
                                            label="Capacity"
                                            value={capacityLabel(item)}
                                        />

                                        <MiniStat
                                            icon={Layers3}
                                            label="Options"
                                            value={String(optionCount(item))}
                                        />
                                    </div>

                                    {item.id ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Link
                                                href={`/admin/venue-areas/${item.id}/edit`}
                                                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-4 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </Link>
                                        </div>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}

function MiniStat({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UsersRound;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[1rem] border border-[#eadcc2]/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="h-4 w-4 text-[#9d7b3d] dark:text-[#f1d89b]" />

            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#21180d] dark:text-white">
                {value}
            </p>
        </div>
    );
}
