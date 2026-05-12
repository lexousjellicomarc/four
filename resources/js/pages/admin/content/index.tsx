import {
    ResourceActionLink,
    ResourceEmptyState,
    ResourcePageShell,
    ResourceSection,
    ResourceStatCard,
} from '@/components/admin-resource/resource-page-shell';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarDays,
    Check,
    Eye,
    FileImage,
    FileText,
    Globe2,
    ImagePlus,
    LayoutPanelTop,
    Mail,
    Pencil,
    Plus,
    Save,
    Settings2,
    Sparkles,
    Trash2,
    UsersRound,
    X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';

type ContentType = 'event' | 'space' | 'package' | 'stat' | 'tourism';

type ContentTabKey =
    | 'overview'
    | 'events'
    | 'facilities'
    | 'offers'
    | 'stats'
    | 'tourism'
    | 'settings';

type GenericRecord = {
    id?: number | string;
    title?: string | null;
    name?: string | null;
    label?: string | null;
    value?: string | number | null;
    subtitle?: string | null;
    description?: string | null;
    category?: string | null;
    event_category?: string | null;
    starts_at?: string | null;
    startsAt?: string | null;
    event_date?: string | null;
    date?: string | null;
    capacity?: string | number | null;
    price_label?: string | null;
    priceLabel?: string | null;
    position?: string | null;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    bio?: string | null;
    image?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
    image_path?: string | null;
    imagePath?: string | null;
    external_url?: string | null;
    externalUrl?: string | null;
    homepage_visible?: boolean | number | string | null;
    homepageVisible?: boolean;
    is_active?: boolean | number | string | null;
    sort_order?: number | string | null;
    sortOrder?: number | string | null;
    created_at?: string | null;
    updated_at?: string | null;
    [key: string]: unknown;
};

type SiteSettings = {
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    visita_url?: string | null;
    visitaUrl?: string | null;
    arts_url?: string | null;
    artsUrl?: string | null;
    creative_baguio_url?: string | null;
    creativeBaguioUrl?: string | null;
    footer_description?: string | null;
    footerDescription?: string | null;
    footer_copyright?: string | null;
    footerCopyright?: string | null;
    map_embed_url?: string | null;
    mapEmbedUrl?: string | null;
    open_map_url?: string | null;
    openMapUrl?: string | null;
};

type PageProps = {
    events?: GenericRecord[];
    bcccEvents?: GenericRecord[];
    cityEvents?: GenericRecord[];
    spaces?: GenericRecord[];
    offers?: GenericRecord[];
    packages?: GenericRecord[];
    stats?: GenericRecord[];
    members?: GenericRecord[];
    tourismMembers?: GenericRecord[];
    siteSettings?: SiteSettings;
    flash?: {
        success?: string;
        error?: string;
        message?: string;
    };
    errors?: Record<string, string>;
};

type ContentTab = {
    key: ContentTabKey;
    title: string;
    subtitle: string;
    icon: typeof LayoutPanelTop;
};

type ModalState =
    | {
          mode: 'create';
          type: ContentType;
          record?: undefined;
      }
    | {
          mode: 'edit';
          type: ContentType;
          record: GenericRecord;
      }
    | null;

type FormPayloadValue = string | boolean | File | null;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Public Content', href: '/admin/content' },
];

const tabs: ContentTab[] = [
    {
        key: 'overview',
        title: 'Overview',
        subtitle: 'Publishing summary',
        icon: LayoutPanelTop,
    },
    {
        key: 'events',
        title: 'Events',
        subtitle: 'BCCC and City highlights',
        icon: CalendarDays,
    },
    {
        key: 'facilities',
        title: 'Facilities',
        subtitle: 'Venue spaces',
        icon: Building2,
    },
    {
        key: 'offers',
        title: 'Offers',
        subtitle: 'Promos and packages',
        icon: Sparkles,
    },
    {
        key: 'stats',
        title: 'Stats',
        subtitle: 'Homepage counters',
        icon: BarChart3,
    },
    {
        key: 'tourism',
        title: 'Tourism Office',
        subtitle: 'Profiles and hierarchy',
        icon: UsersRound,
    },
    {
        key: 'settings',
        title: 'Settings',
        subtitle: 'Footer and contact',
        icon: Settings2,
    },
];

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function recordsOf<T>(value?: T[]): T[] {
    return Array.isArray(value) ? value : [];
}

function visibleFlag(item: GenericRecord) {
    return (
        item.homepageVisible === true ||
        item.homepage_visible === true ||
        item.homepage_visible === 1 ||
        item.homepage_visible === '1' ||
        item.is_active === true ||
        item.is_active === 1 ||
        item.is_active === '1'
    );
}

function titleOf(record: GenericRecord, fallback: string) {
    return String(record.title || record.name || record.label || fallback);
}

function imageOf(record: GenericRecord) {
    return (
        record.image_url ||
        record.imageUrl ||
        record.image_path ||
        record.imagePath ||
        record.image ||
        ''
    );
}

function metaOf(type: ContentType, record: GenericRecord) {
    if (type === 'event') {
        return String(record.category || record.event_category || record.starts_at || record.startsAt || record.event_date || 'Event highlight');
    }

    if (type === 'space') {
        return String(record.capacity || record.subtitle || 'Venue space');
    }

    if (type === 'package') {
        return String(record.price_label || record.priceLabel || record.subtitle || 'Special offer');
    }

    if (type === 'stat') {
        return `Value: ${String(record.value ?? '—')}`;
    }

    return String(record.position || record.role || 'Tourism office profile');
}

function endpointFor(type: ContentType, record?: GenericRecord) {
    const id = record?.id;

    if (type === 'event') {
        return id ? `/admin/events/${id}` : '/admin/events';
    }

    if (type === 'space') {
        return id ? `/admin/spaces/${id}` : '/admin/spaces';
    }

    if (type === 'package') {
        return id ? `/admin/packages/${id}` : '/admin/packages';
    }

    if (type === 'stat') {
        return id ? `/admin/stats/${id}` : '/admin/stats';
    }

    return id ? `/admin/tourism-members/${id}` : '/admin/tourism-members';
}

function deleteEndpointFor(type: ContentType, record: GenericRecord) {
    return endpointFor(type, record);
}

function defaultForm(type: ContentType, record?: GenericRecord): Record<string, FormPayloadValue> {
    if (type === 'event') {
        return {
            title: String(record?.title ?? record?.name ?? ''),
            category: String(record?.category ?? record?.event_category ?? 'BCCC Event'),
            event_category: String(record?.event_category ?? record?.category ?? 'BCCC Event'),
            starts_at: String(record?.starts_at ?? record?.startsAt ?? record?.event_date ?? record?.date ?? ''),
            description: String(record?.description ?? ''),
            image_path: String(record?.image_path ?? record?.imagePath ?? imageOf(record ?? {}) ?? ''),
            external_url: String(record?.external_url ?? record?.externalUrl ?? ''),
            homepage_visible: visibleFlag(record ?? {}) || !record,
            sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
            image: null,
        };
    }

    if (type === 'space') {
        return {
            title: String(record?.title ?? record?.name ?? ''),
            name: String(record?.name ?? record?.title ?? ''),
            subtitle: String(record?.subtitle ?? ''),
            capacity: String(record?.capacity ?? ''),
            description: String(record?.description ?? ''),
            image_path: String(record?.image_path ?? record?.imagePath ?? imageOf(record ?? {}) ?? ''),
            homepage_visible: visibleFlag(record ?? {}) || !record,
            sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
            image: null,
        };
    }

    if (type === 'package') {
        return {
            title: String(record?.title ?? record?.name ?? ''),
            subtitle: String(record?.subtitle ?? ''),
            price_label: String(record?.price_label ?? record?.priceLabel ?? ''),
            description: String(record?.description ?? ''),
            image_path: String(record?.image_path ?? record?.imagePath ?? imageOf(record ?? {}) ?? ''),
            external_url: String(record?.external_url ?? record?.externalUrl ?? ''),
            homepage_visible: visibleFlag(record ?? {}) || !record,
            sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
            image: null,
        };
    }

    if (type === 'stat') {
        return {
            label: String(record?.label ?? record?.title ?? ''),
            value: String(record?.value ?? ''),
            description: String(record?.description ?? ''),
            homepage_visible: visibleFlag(record ?? {}) || !record,
            sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
        };
    }

    return {
        name: String(record?.name ?? record?.title ?? ''),
        position: String(record?.position ?? record?.role ?? ''),
        email: String(record?.email ?? ''),
        phone: String(record?.phone ?? ''),
        bio: String(record?.bio ?? record?.description ?? ''),
        image_path: String(record?.image_path ?? record?.imagePath ?? imageOf(record ?? {}) ?? ''),
        homepage_visible: visibleFlag(record ?? {}) || !record,
        sort_order: String(record?.sort_order ?? record?.sortOrder ?? ''),
        image: null,
    };
}

function readableType(type: ContentType) {
    if (type === 'event') {
        return 'Event Highlight';
    }

    if (type === 'space') {
        return 'Venue Space';
    }

    if (type === 'package') {
        return 'Offer / Package';
    }

    if (type === 'stat') {
        return 'Homepage Stat';
    }

    return 'Tourism Member';
}

function panelDescription(tab: ContentTabKey) {
    const descriptions: Record<ContentTabKey, string> = {
        overview: 'Quick publishing workflow and public website content status.',
        events: 'Create and edit BCCC event highlights and Baguio City event cards.',
        facilities: 'Create and edit venue spaces displayed on the public website.',
        offers: 'Create and edit promotional offer cards and public packages.',
        stats: 'Create and edit homepage counters and venue quick facts.',
        tourism: 'Create and edit Tourism Office profiles and official people sections.',
        settings: 'Update footer, contact, map, and external public website links.',
    };

    return descriptions[tab];
}

function settingValue(settings: SiteSettings, camel: keyof SiteSettings, snake: keyof SiteSettings) {
    return String(settings[camel] ?? settings[snake] ?? '');
}

export default function AdminContentIndex() {
    const page = usePage<PageProps>();
    const props = page.props;

    const [activeTab, setActiveTab] = useState<ContentTabKey>('overview');
    const [modal, setModal] = useState<ModalState>(null);

    const events = useMemo(
        () => [
            ...recordsOf(props.events),
            ...recordsOf(props.bcccEvents),
            ...recordsOf(props.cityEvents),
        ],
        [props.events, props.bcccEvents, props.cityEvents],
    );

    const spaces = recordsOf(props.spaces);
    const offers = props.offers?.length ? props.offers : recordsOf(props.packages);
    const stats = recordsOf(props.stats);
    const members = props.members?.length ? props.members : recordsOf(props.tourismMembers);
    const settings = props.siteSettings ?? {};

    const publicEvents = events.filter(visibleFlag);
    const publicSpaces = spaces.filter(visibleFlag);
    const publicOffers = offers.filter(visibleFlag);

    const active = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
    const ActiveIcon = active.icon;

    function createFor(tab: ContentTabKey) {
        if (tab === 'events') {
            setModal({ mode: 'create', type: 'event' });
        }

        if (tab === 'facilities') {
            setModal({ mode: 'create', type: 'space' });
        }

        if (tab === 'offers') {
            setModal({ mode: 'create', type: 'package' });
        }

        if (tab === 'stats') {
            setModal({ mode: 'create', type: 'stat' });
        }

        if (tab === 'tourism') {
            setModal({ mode: 'create', type: 'tourism' });
        }
    }

    return (
        <>
            <Head title="Public Content Manager" />

            <ResourcePageShell
                title="Public Content Manager"
                eyebrow="Frontend Configuration"
                icon={Globe2}
                breadcrumbs={breadcrumbs}
                subtitle="Create and maintain public website sections, event highlights, venue spaces, offers, tourism office profiles, homepage counters, footer details, and public links."
                actions={
                    <>
                        <ResourceActionLink href="/" variant="secondary">
                            Open Public Site
                        </ResourceActionLink>

                        <ResourceActionLink href="/admin/guidelines-contacts">
                            Guidelines & Contacts
                        </ResourceActionLink>
                    </>
                }
            >
                {props.flash?.success || props.flash?.message ? (
                    <div className="mb-5 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                        {props.flash.success || props.flash.message}
                    </div>
                ) : null}

                {props.flash?.error ? (
                    <div className="mb-5 rounded-[1.2rem] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                        {props.flash.error}
                    </div>
                ) : null}

                {props.errors && Object.keys(props.errors).length > 0 ? (
                    <div className="mb-5 rounded-[1.2rem] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                        <p>Please check the form fields below:</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            {Object.entries(props.errors).map(([field, error]) => (
                                <li key={field}>
                                    {field}: {error}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <ResourceStatCard
                        label="Events"
                        value={events.length}
                        description={`${publicEvents.length} marked visible.`}
                        icon={CalendarDays}
                    />

                    <ResourceStatCard
                        label="Facilities"
                        value={spaces.length}
                        description={`${publicSpaces.length} marked visible.`}
                        icon={Building2}
                    />

                    <ResourceStatCard
                        label="Offers"
                        value={offers.length}
                        description={`${publicOffers.length} marked visible.`}
                        icon={Sparkles}
                    />

                    <ResourceStatCard
                        label="Stats"
                        value={stats.length}
                        description="Homepage metric counters."
                        icon={BarChart3}
                    />

                    <ResourceStatCard
                        label="Tourism"
                        value={members.length}
                        description="Tourism office profiles."
                        icon={UsersRound}
                    />

                    <ResourceStatCard
                        label="Contact"
                        value={settings.email ? 'Set' : 'Missing'}
                        description={settings.email || 'No email configured.'}
                        icon={Mail}
                    />
                </div>

                <div className="mt-5">
                    <section className="rounded-[1.65rem] border border-[#d9c7a6]/70 bg-white/82 p-3 shadow-[0_18px_58px_rgba(47,37,23,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]">
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-7">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const selected = activeTab === tab.key;

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={cx(
                                            'group flex min-h-[5rem] items-center gap-3 rounded-[1.15rem] border px-3 py-3 text-left transition duration-200',
                                            selected
                                                ? 'border-[#b08d48]/80 bg-[#2f2517] text-white shadow-[0_18px_44px_rgba(47,37,23,0.20)] dark:border-white/20 dark:bg-white dark:text-[#17120b]'
                                                : 'border-[#eadcc2]/80 bg-[#fffaf0]/70 text-[#4a3b27] hover:border-[#b08d48]/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:text-white/68 dark:hover:bg-white/9',
                                        )}
                                    >
                                        <span
                                            className={cx(
                                                'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                                                selected
                                                    ? 'bg-white/14 text-white dark:bg-[#17120b]/8 dark:text-[#17120b]'
                                                    : 'bg-[#efe3cd] text-[#8b672d] group-hover:bg-[#f7ecd8] dark:bg-white/8 dark:text-[#f1d89b]',
                                            )}
                                        >
                                            <Icon className="h-4.5 w-4.5" />
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-bold">
                                                {tab.title}
                                            </span>
                                            <span
                                                className={cx(
                                                    'mt-0.5 block truncate text-[11px] font-medium',
                                                    selected ? 'text-white/62 dark:text-[#17120b]/58' : 'opacity-62',
                                                )}
                                            >
                                                {tab.subtitle}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="mt-5">
                    <ResourceSection
                        title={active.title}
                        eyebrow={active.subtitle}
                        description={panelDescription(activeTab)}
                        actions={
                            <PanelActions
                                activeTab={activeTab}
                                activeIcon={ActiveIcon}
                                onCreate={() => createFor(activeTab)}
                            />
                        }
                    >
                        {activeTab === 'overview' ? <OverviewPanel /> : null}

                        {activeTab === 'events' ? (
                            <RecordGrid
                                type="event"
                                records={events}
                                emptyIcon={CalendarDays}
                                emptyTitle="No public events found"
                                onCreate={() => setModal({ mode: 'create', type: 'event' })}
                                onEdit={(record) => setModal({ mode: 'edit', type: 'event', record })}
                            />
                        ) : null}

                        {activeTab === 'facilities' ? (
                            <RecordGrid
                                type="space"
                                records={spaces}
                                emptyIcon={Building2}
                                emptyTitle="No venue spaces found"
                                onCreate={() => setModal({ mode: 'create', type: 'space' })}
                                onEdit={(record) => setModal({ mode: 'edit', type: 'space', record })}
                            />
                        ) : null}

                        {activeTab === 'offers' ? (
                            <RecordGrid
                                type="package"
                                records={offers}
                                emptyIcon={Sparkles}
                                emptyTitle="No offers found"
                                onCreate={() => setModal({ mode: 'create', type: 'package' })}
                                onEdit={(record) => setModal({ mode: 'edit', type: 'package', record })}
                            />
                        ) : null}

                        {activeTab === 'stats' ? (
                            <RecordGrid
                                type="stat"
                                records={stats}
                                emptyIcon={BarChart3}
                                emptyTitle="No homepage stats found"
                                onCreate={() => setModal({ mode: 'create', type: 'stat' })}
                                onEdit={(record) => setModal({ mode: 'edit', type: 'stat', record })}
                            />
                        ) : null}

                        {activeTab === 'tourism' ? (
                            <RecordGrid
                                type="tourism"
                                records={members}
                                emptyIcon={UsersRound}
                                emptyTitle="No tourism profiles found"
                                onCreate={() => setModal({ mode: 'create', type: 'tourism' })}
                                onEdit={(record) => setModal({ mode: 'edit', type: 'tourism', record })}
                            />
                        ) : null}

                        {activeTab === 'settings' ? <SettingsPanel settings={settings} /> : null}
                    </ResourceSection>
                </div>
            </ResourcePageShell>

            {modal ? (
                <ContentModal
                    modal={modal}
                    onClose={() => setModal(null)}
                />
            ) : null}
        </>
    );
}

function PanelActions({
    activeTab,
    activeIcon: ActiveIcon,
    onCreate,
}: {
    activeTab: ContentTabKey;
    activeIcon: typeof LayoutPanelTop;
    onCreate: () => void;
}) {
    if (activeTab === 'overview') {
        return (
            <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
            >
                <Eye className="h-4 w-4" />
                Preview Website
            </Link>
        );
    }

    if (activeTab === 'settings') {
        return (
            <button
                type="submit"
                form="site-settings-form"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
            >
                <Save className="h-4 w-4" />
                Save Settings
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
        >
            <Plus className="h-4 w-4" />
            Create {activeTab === 'facilities' ? 'Facility' : activeTab.slice(0, -1)}
            <ActiveIcon className="h-4 w-4 opacity-70" />
        </button>
    );
}

function OverviewPanel() {
    const steps = [
        {
            title: '1. Create',
            description: 'Use the tabs above, then click Create. The form now opens directly inside this page.',
            icon: Plus,
        },
        {
            title: '2. Review',
            description: 'Check titles, descriptions, images, visibility flags, and public wording before publishing.',
            icon: Eye,
        },
        {
            title: '3. Publish',
            description: 'Open the public website and verify each section on desktop, tablet, and mobile.',
            icon: Globe2,
        },
    ];

    return (
        <div className="grid gap-3 md:grid-cols-3">
            {steps.map((item) => {
                const Icon = item.icon;

                return (
                    <article
                        key={item.title}
                        className="rounded-[1.25rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]"
                    >
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                            <Icon className="h-5 w-5" />
                        </span>

                        <h3 className="mt-4 text-sm font-semibold text-[#21180d] dark:text-white">
                            {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/52">
                            {item.description}
                        </p>
                    </article>
                );
            })}
        </div>
    );
}

function RecordGrid({
    type,
    records,
    emptyIcon,
    emptyTitle,
    onCreate,
    onEdit,
}: {
    type: ContentType;
    records: GenericRecord[];
    emptyIcon: typeof CalendarDays;
    emptyTitle: string;
    onCreate: () => void;
    onEdit: (record: GenericRecord) => void;
}) {
    function destroy(record: GenericRecord) {
        if (!record.id) {
            return;
        }

        if (!window.confirm(`Delete "${titleOf(record, readableType(type))}"?`)) {
            return;
        }

        router.delete(deleteEndpointFor(type, record), {
            preserveScroll: true,
        });
    }

    if (records.length === 0) {
        return (
            <div>
                <ResourceEmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description="Create records so this section can appear correctly on the public website."
                />

                <div className="mt-4 flex justify-center">
                    <button
                        type="button"
                        onClick={onCreate}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                    >
                        <Plus className="h-4 w-4" />
                        Create {readableType(type)}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {records.map((record, index) => (
                <article
                    key={`${record.id ?? index}`}
                    className="overflow-hidden rounded-[1.25rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 shadow-[0_14px_40px_rgba(47,37,23,0.06)] dark:border-white/10 dark:bg-white/[0.035]"
                >
                    {imageOf(record) ? (
                        <img
                            src={String(imageOf(record))}
                            alt={titleOf(record, readableType(type))}
                            className="h-40 w-full object-cover"
                        />
                    ) : (
                        <div className="grid h-40 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                            <FileImage className="h-8 w-8" />
                        </div>
                    )}

                    <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                <LayoutPanelTop className="h-4 w-4" />
                            </span>

                            <span
                                className={
                                    visibleFlag(record)
                                        ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'
                                        : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-white/52'
                                }
                            >
                                {visibleFlag(record) ? 'Visible' : 'Hidden'}
                            </span>
                        </div>

                        <h3 className="mt-4 line-clamp-2 text-lg font-semibold tracking-[-0.04em] text-[#21180d] dark:text-white">
                            {titleOf(record, readableType(type))}
                        </h3>

                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                            {metaOf(type, record)}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onEdit(record)}
                                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit
                            </button>

                            <button
                                type="button"
                                onClick={() => destroy(record)}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}

function ContentModal({
    modal,
    onClose,
}: {
    modal: ModalState;
    onClose: () => void;
}) {
    const [form, setForm] = useState<Record<string, FormPayloadValue>>(() =>
        modal ? defaultForm(modal.type, modal.record) : {},
    );
    const [processing, setProcessing] = useState(false);

    if (!modal) {
        return null;
    }

    const title = modal.mode === 'create'
        ? `Create ${readableType(modal.type)}`
        : `Edit ${readableType(modal.type)}`;

    function update(field: string, value: FormPayloadValue) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        setProcessing(true);

        const payload = new FormData();

        Object.entries(form).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                return;
            }

            if (value instanceof File) {
                payload.append(key, value);
                return;
            }

            if (typeof value === 'boolean') {
                payload.append(key, value ? '1' : '0');
                return;
            }

            payload.append(key, String(value));
        });

        if (modal.mode === 'edit') {
            payload.append('_method', 'PUT');
        }

        router.post(endpointFor(modal.type, modal.record), payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-[#17120b]/45 px-3 py-6 backdrop-blur-xl dark:bg-black/60">
            <button
                type="button"
                onClick={onClose}
                className="fixed inset-0 cursor-default"
                aria-label="Close modal"
            />

            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] border border-[#d9c7a6]/70 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.28)] dark:border-white/10 dark:bg-[#101419]">
                <div className="flex items-start justify-between gap-4 border-b border-[#eadcc2]/80 p-5 dark:border-white/10">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                            Content Manager
                        </p>

                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                            {title}
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-[#6e604c] dark:text-white/56">
                            Fill the fields below, then save. The item will be stored and shown in this same content manager page.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9c7a6]/70 bg-white text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="grid gap-4 p-5">
                    <DynamicFields
                        type={modal.type}
                        form={form}
                        onChange={update}
                    />

                    <div className="flex flex-col-reverse gap-2 border-t border-[#eadcc2]/80 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Content'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DynamicFields({
    type,
    form,
    onChange,
}: {
    type: ContentType;
    form: Record<string, FormPayloadValue>;
    onChange: (field: string, value: FormPayloadValue) => void;
}) {
    if (type === 'event') {
        return (
            <>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Title" value={form.title} onChange={(value) => onChange('title', value)} required />
                    <TextField label="Category" value={form.category} onChange={(value) => {
                        onChange('category', value);
                        onChange('event_category', value);
                    }} placeholder="BCCC Event / Baguio City Event" />
                    <TextField label="Event Date" value={form.starts_at} onChange={(value) => onChange('starts_at', value)} type="date" />
                    <TextField label="External URL" value={form.external_url} onChange={(value) => onChange('external_url', value)} />
                </div>
                <TextArea label="Description" value={form.description} onChange={(value) => onChange('description', value)} />
                <ImageFields form={form} onChange={onChange} />
                <VisibilityFields form={form} onChange={onChange} />
            </>
        );
    }

    if (type === 'space') {
        return (
            <>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Title / Name" value={form.title} onChange={(value) => {
                        onChange('title', value);
                        onChange('name', value);
                    }} required />
                    <TextField label="Subtitle" value={form.subtitle} onChange={(value) => onChange('subtitle', value)} />
                    <TextField label="Capacity" value={form.capacity} onChange={(value) => onChange('capacity', value)} />
                    <TextField label="Sort Order" value={form.sort_order} onChange={(value) => onChange('sort_order', value)} type="number" />
                </div>
                <TextArea label="Description" value={form.description} onChange={(value) => onChange('description', value)} />
                <ImageFields form={form} onChange={onChange} />
                <VisibilityFields form={form} onChange={onChange} />
            </>
        );
    }

    if (type === 'package') {
        return (
            <>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Title" value={form.title} onChange={(value) => onChange('title', value)} required />
                    <TextField label="Subtitle" value={form.subtitle} onChange={(value) => onChange('subtitle', value)} />
                    <TextField label="Price Label" value={form.price_label} onChange={(value) => onChange('price_label', value)} placeholder="Starts at ₱..." />
                    <TextField label="External URL" value={form.external_url} onChange={(value) => onChange('external_url', value)} />
                </div>
                <TextArea label="Description" value={form.description} onChange={(value) => onChange('description', value)} />
                <ImageFields form={form} onChange={onChange} />
                <VisibilityFields form={form} onChange={onChange} />
            </>
        );
    }

    if (type === 'stat') {
        return (
            <>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextField label="Label" value={form.label} onChange={(value) => onChange('label', value)} required />
                    <TextField label="Value" value={form.value} onChange={(value) => onChange('value', value)} required />
                    <TextField label="Sort Order" value={form.sort_order} onChange={(value) => onChange('sort_order', value)} type="number" />
                </div>
                <TextArea label="Description" value={form.description} onChange={(value) => onChange('description', value)} />
                <VisibilityFields form={form} onChange={onChange} />
            </>
        );
    }

    return (
        <>
            <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Name" value={form.name} onChange={(value) => onChange('name', value)} required />
                <TextField label="Position" value={form.position} onChange={(value) => onChange('position', value)} />
                <TextField label="Email" value={form.email} onChange={(value) => onChange('email', value)} type="email" />
                <TextField label="Phone" value={form.phone} onChange={(value) => onChange('phone', value)} />
            </div>
            <TextArea label="Bio" value={form.bio} onChange={(value) => onChange('bio', value)} />
            <ImageFields form={form} onChange={onChange} />
            <VisibilityFields form={form} onChange={onChange} />
        </>
    );
}

function TextField({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    required = false,
}: {
    label: string;
    value: FormPayloadValue;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <label className="grid gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
                {required ? ' *' : ''}
            </span>

            <input
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => onChange(event.target.value)}
                type={type}
                placeholder={placeholder}
                required={required}
                className="min-h-11 rounded-full border border-[#d9c7a6]/70 bg-white px-4 text-sm text-[#21180d] outline-none transition placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
            />
        </label>
    );
}

function TextArea({
    label,
    value,
    onChange,
}: {
    label: string;
    value: FormPayloadValue;
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </span>

            <textarea
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => onChange(event.target.value)}
                rows={4}
                className="rounded-[1.1rem] border border-[#d9c7a6]/70 bg-white px-4 py-3 text-sm leading-7 text-[#21180d] outline-none transition placeholder:text-[#8a7a63] focus:border-[#b08d48] dark:border-white/10 dark:bg-white/7 dark:text-white dark:placeholder:text-white/42"
            />
        </label>
    );
}

function ImageFields({
    form,
    onChange,
}: {
    form: Record<string, FormPayloadValue>;
    onChange: (field: string, value: FormPayloadValue) => void;
}) {
    function handleFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        onChange('image', file);
    }

    return (
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <TextField
                label="Image Path / URL"
                value={form.image_path}
                onChange={(value) => onChange('image_path', value)}
                placeholder="/marketing/images/..."
            />

            <label className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                    Upload Image
                </span>

                <span className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12">
                    <ImagePlus className="h-4 w-4" />
                    Choose
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </span>
            </label>
        </div>
    );
}

function VisibilityFields({
    form,
    onChange,
}: {
    form: Record<string, FormPayloadValue>;
    onChange: (field: string, value: FormPayloadValue) => void;
}) {
    return (
        <div className="grid gap-3 rounded-[1.15rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035] md:grid-cols-2">
            <label className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={Boolean(form.homepage_visible)}
                    onChange={(event) => onChange('homepage_visible', event.target.checked)}
                    className="h-4 w-4 rounded border-[#d9c7a6]"
                />

                <span className="text-sm font-semibold text-[#21180d] dark:text-white">
                    Show on homepage / public site
                </span>
            </label>

            <div className="flex items-center gap-2 text-sm text-[#6e604c] dark:text-white/56">
                <Check className="h-4 w-4 text-emerald-600" />
                Saved items return here after submission.
            </div>
        </div>
    );
}

function SettingsPanel({ settings }: { settings: SiteSettings }) {
    const [form, setForm] = useState({
        email: settingValue(settings, 'email', 'email'),
        phone: settingValue(settings, 'phone', 'phone'),
        address: settingValue(settings, 'address', 'address'),
        visita_url: settingValue(settings, 'visitaUrl', 'visita_url'),
        creative_baguio_url: settingValue(settings, 'creativeBaguioUrl', 'creative_baguio_url'),
        footer_description: settingValue(settings, 'footerDescription', 'footer_description'),
        footer_copyright: settingValue(settings, 'footerCopyright', 'footer_copyright'),
        map_embed_url: settingValue(settings, 'mapEmbedUrl', 'map_embed_url'),
        open_map_url: settingValue(settings, 'openMapUrl', 'open_map_url'),
    });

    const [processing, setProcessing] = useState(false);

    function update(field: keyof typeof form, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        setProcessing(true);

        router.put('/admin/site-settings', form, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <form id="site-settings-form" onSubmit={submit} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Email" value={form.email} onChange={(value) => update('email', value)} />
                <TextField label="Phone" value={form.phone} onChange={(value) => update('phone', value)} />
                <TextField label="Address" value={form.address} onChange={(value) => update('address', value)} />
                <TextField label="VISITA Baguio URL" value={form.visita_url} onChange={(value) => update('visita_url', value)} />
                <TextField label="Creative / Arts URL" value={form.creative_baguio_url} onChange={(value) => update('creative_baguio_url', value)} />
                <TextField label="Open Map URL" value={form.open_map_url} onChange={(value) => update('open_map_url', value)} />
            </div>

            <TextArea label="Footer Description" value={form.footer_description} onChange={(value) => update('footer_description', value)} />
            <TextArea label="Map Embed URL" value={form.map_embed_url} onChange={(value) => update('map_embed_url', value)} />

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(47,37,23,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4a3921] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#17120b]"
                >
                    <Save className="h-4 w-4" />
                    {processing ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </form>
    );
}
