import {
    ResourceActionLink,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    Clock3,
    Construction,
    LockKeyhole,
    PackageCheck,
    ShieldCheck,
} from 'lucide-react';

type RentalOption = {
    id?: number | string;
    name?: string | null;
    title?: string | null;
    service_type_id?: number | string | null;
    venue_area_id?: number | string | null;
    is_active?: boolean | number | string | null;
};

type PageProps = {
    rentalOptions?: RentalOption[] | { data?: RentalOption[] };
    services?: RentalOption[] | { data?: RentalOption[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Rental Options', href: '/admin/rental-options' },
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

export default function AdminRentalOptionsComingSoon() {
    const { props } = usePage<PageProps>();
    const rows = collection<RentalOption>(props.rentalOptions ?? props.services);

    return (
        <ResourcePageShell
            title="Rental Options"
            eyebrow="System Setup"
            icon={Construction}
            breadcrumbs={breadcrumbs}
            subtitle="This module will manage Whole Day, Half Day, and Additional Hours per venue area. It is temporarily locked while the booking and availability rules are being finalized."
            actions={
                <>
                    <ResourceActionLink href="/admin/venue-areas" variant="secondary">
                        Venue Areas
                    </ResourceActionLink>

                    <ResourceActionLink href="/admin/calendar" variant="primary">
                        Calendar
                    </ResourceActionLink>
                </>
            }
        >
            <div className="grid gap-3 md:grid-cols-3">
                <ResourceStatCard
                    label="Existing Options"
                    value={rows.length}
                    description="Current rental option records detected."
                    icon={PackageCheck}
                />

                <ResourceStatCard
                    label="Module Status"
                    value="Coming Soon"
                    description="Editing is intentionally disabled."
                    icon={LockKeyhole}
                />

                <ResourceStatCard
                    label="Time Blocks"
                    value="AM · PM · EVE"
                    description="Availability rules remain active."
                    icon={Clock3}
                />
            </div>

            <div className="mt-5">
                <ResourceSection
                    title="Coming soon"
                    eyebrow="Rental Options"
                    description="This page is intentionally locked so admins do not accidentally change rates or availability mappings before final booking rules are confirmed."
                >
                    <div className="relative overflow-hidden rounded-[1.65rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/80 p-8 text-center shadow-[0_18px_58px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.035]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(216,181,109,0.18),transparent_50%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_50%)]" />

                        <div className="relative mx-auto max-w-3xl">
                            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#2f2517] text-white shadow-[0_20px_60px_rgba(47,37,23,0.22)] dark:bg-white dark:text-[#17120b]">
                                <Construction className="h-9 w-9" />
                            </span>

                            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                Locked for final configuration
                            </p>

                            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#21180d] dark:text-white">
                                Rental Options module is coming soon.
                            </h2>

                            <p className="mt-4 text-sm leading-7 text-[#6e604c] dark:text-white/58">
                                The intended structure is three rental options per venue area:
                                Whole Day, Half Day, and Additional Hours. This module should
                                stay locked until pricing, conflict checking, and public availability
                                mapping are fully finalized.
                            </p>

                            <div className="mt-6 grid gap-3 md:grid-cols-3">
                                {[
                                    {
                                        title: 'Whole Day',
                                        description: 'Full-day venue usage rate.',
                                    },
                                    {
                                        title: 'Half Day',
                                        description: 'AM, PM, or EVE schedule blocks.',
                                    },
                                    {
                                        title: 'Additional Hours',
                                        description: 'Extension or add-on usage.',
                                    },
                                ].map((item) => (
                                    <article
                                        key={item.title}
                                        className="rounded-[1.2rem] border border-[#eadcc2]/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.035]"
                                    >
                                        <ShieldCheck className="mx-auto h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />

                                        <p className="mt-3 text-sm font-semibold text-[#21180d] dark:text-white">
                                            {item.title}
                                        </p>

                                        <p className="mt-2 text-xs leading-5 text-[#6e604c] dark:text-white/52">
                                            {item.description}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </ResourceSection>
            </div>
        </ResourcePageShell>
    );
}
