import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarDays,
    Edit3,
    Eye,
    Globe2,
    ImageIcon,
    LayoutPanelTop,
    Loader2,
    Plus,
    Save,
    Search,
    Sparkles,
    Trash2,
    UserRound,
    UsersRound,
} from 'lucide-react';
import {
    type ComponentType,
    type FormEvent,
    type ReactNode,
    useMemo,
    useState,
} from 'react';

type CollectionLike<T> = T[] | { data?: T[] } | null | undefined;

type PublicEventRecord = {
    id?: number | string;
    title?: string | null;
    scope?: string | null;
    venue?: string | null;
    event_date?: string | null;
    date?: string | null;
    event_date_to?: string | null;
    dateEnd?: string | null;
    time?: string | null;
    summary?: string | null;
    description?: string | null;
    image?: string | null;
    lightImage?: string | null;
    darkImage?: string | null;
    is_highlighted?: boolean | number | string | null;
    highlighted?: boolean | number | string | null;
    is_public?: boolean | number | string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type PackageRecord = {
    id?: number | string;
    title?: string | null;
    subtitle?: string | null;
    description?: string | null;
    button_label?: string | null;
    buttonLabel?: string | null;
    href?: string | null;
    image?: string | null;
    lightImage?: string | null;
    darkImage?: string | null;
    is_active?: boolean | number | string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type SpaceRecord = {
    id?: number | string;
    slug?: string | null;
    title?: string | null;
    category?: string | null;
    capacity?: string | null;
    short_description?: string | null;
    shortDescription?: string | null;
    summary?: string | null;
    details?: string[] | null;
    image?: string | null;
    lightImage?: string | null;
    darkImage?: string | null;
    homepage_visible?: boolean | number | string | null;
    homepageVisible?: boolean | number | string | null;
    featured?: boolean | number | string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type StatRecord = {
    id?: number | string;
    label?: string | null;
    value?: string | number | null;
    suffix?: string | null;
    description?: string | null;
    sort_order?: string | number | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type TourismMemberRecord = {
    id?: number | string;
    full_name?: string | null;
    fullName?: string | null;
    designation?: string | null;
    unit_name?: string | null;
    unitName?: string | null;
    office_section?: string | null;
    team_label?: string | null;
    reports_to_name?: string | null;
    tree_level?: string | number | null;
    email?: string | null;
    phone?: string | null;
    short_bio?: string | null;
    shortBio?: string | null;
    photo?: string | null;
    featured?: boolean | number | string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type SiteSettingsRecord = {
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    mapEmbedUrl?: string | null;
    map_embed_url?: string | null;
    openMapUrl?: string | null;
    open_map_url?: string | null;
    visitaUrl?: string | null;
    visita_url?: string | null;
    creativeBaguioUrl?: string | null;
    creative_baguio_url?: string | null;
    footerDescription?: string | null;
    footer_description?: string | null;
    footerCopyright?: string | null;
    footer_copyright?: string | null;
};

type VenueOption = {
    label?: string | null;
    value?: string | null;
};

type PageProps = {
    publicEvents?: CollectionLike<PublicEventRecord>;
    events?: CollectionLike<PublicEventRecord>;
    featurePackages?: CollectionLike<PackageRecord>;
    packages?: CollectionLike<PackageRecord>;
    venueSpaces?: CollectionLike<SpaceRecord>;
    spaces?: CollectionLike<SpaceRecord>;
    homepageStats?: CollectionLike<StatRecord>;
    stats?: CollectionLike<StatRecord>;
    tourismMembers?: CollectionLike<TourismMemberRecord>;
    siteSettings?: SiteSettingsRecord | null;
    initialVenueAreas?: VenueOption[];
    venueOptions?: VenueOption[];
};

type TabKey =
    | 'overview'
    | 'events'
    | 'spaces'
    | 'packages'
    | 'stats'
    | 'tourism'
    | 'settings';

type EventForm = {
    type: 'event';
    id?: number | string;
    title: string;
    scope: string;
    venue: string;
    event_date: string;
    event_date_to: string;
    time: string;
    summary: string;
    description: string;
    image: string;
    is_highlighted: boolean;
    is_public: boolean;
};

type SpaceForm = {
    type: 'space';
    id?: number | string;
    title: string;
    slug: string;
    category: string;
    capacity: string;
    short_description: string;
    summary: string;
    details: string;
    image: string;
    homepage_visible: boolean;
    featured: boolean;
};

type PackageForm = {
    type: 'package';
    id?: number | string;
    title: string;
    subtitle: string;
    description: string;
    button_label: string;
    href: string;
    image: string;
    is_active: boolean;
};

type StatForm = {
    type: 'stat';
    id?: number | string;
    label: string;
    value: string;
    suffix: string;
    description: string;
    sort_order: string;
};

type TourismForm = {
    type: 'tourism';
    id?: number | string;
    full_name: string;
    designation: string;
    unit_name: string;
    office_section: string;
    team_label: string;
    reports_to_name: string;
    tree_level: string;
    email: string;
    phone: string;
    short_bio: string;
    photo: string;
    featured: boolean;
};

type SettingsForm = {
    type: 'settings';
    address: string;
    phone: string;
    email: string;
    map_embed_url: string;
    open_map_url: string;
    visita_url: string;
    creative_baguio_url: string;
    footer_description: string;
    footer_copyright: string;
};

type ContentForm =
    | EventForm
    | SpaceForm
    | PackageForm
    | StatForm
    | TourismForm
    | SettingsForm;

const tabs: Array<{
    key: TabKey;
    label: string;
    icon: ComponentType<{ className?: string }>;
    description: string;
}> = [
    {
        key: 'overview',
        label: 'Overview',
        icon: LayoutPanelTop,
        description: 'Content health and publishing summary.',
    },
    {
        key: 'events',
        label: 'Events',
        icon: CalendarDays,
        description: 'BCCC and Baguio City event highlights.',
    },
    {
        key: 'spaces',
        label: 'Facilities',
        icon: Building2,
        description: 'Venue spaces shown on the public website.',
    },
    {
        key: 'packages',
        label: 'Offers',
        icon: Sparkles,
        description: 'Special offers, homepage promotions, and announcements.',
    },
    {
        key: 'stats',
        label: 'Stats',
        icon: BarChart3,
        description: 'Homepage statistics and compact counters.',
    },
    {
        key: 'tourism',
        label: 'Tourism Office',
        icon: UsersRound,
        description: 'Tourism office profiles and hierarchy.',
    },
    {
        key: 'settings',
        label: 'Site Settings',
        icon: Globe2,
        description: 'Footer, contact, map, and external links.',
    },
];

const defaultVenueOptions = [
    'FULL HALL',
    'MAIN HALL',
    'FOYER & LOBBY AREA',
    'VIP LOUNGE',
    'BOARD ROOM',
    'BASEMENT',
    'GALLERY2600',
];

function collection<T>(value: CollectionLike<T>): T[] {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && Array.isArray(value.data)) {
        return value.data;
    }

    return [];
}

function stringValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function boolValue(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function dateValue(value: unknown): string {
    if (!value) {
        return '';
    }

    const raw = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return raw;
    }

    const parsed = new Date(raw);

    if (Number.isNaN(parsed.getTime())) {
        return raw.slice(0, 10);
    }

    return parsed.toISOString().slice(0, 10);
}

function cleanLabel(value: unknown): string {
    const raw = stringValue(value || '—');

    return raw
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function previewImage(record: {
    image?: string | null;
    lightImage?: string | null;
    darkImage?: string | null;
}) {
    return (
        record.image ||
        record.lightImage ||
        record.darkImage ||
        '/marketing/images/hero/noon2.jpg'
    );
}

function eventStart(record: PublicEventRecord): string {
    return dateValue(record.event_date || record.date);
}

function eventEnd(record: PublicEventRecord): string {
    return dateValue(
        record.event_date_to ||
            record.dateEnd ||
            record.event_date ||
            record.date,
    );
}

function eventHighlighted(record: PublicEventRecord): boolean {
    return boolValue(record.is_highlighted ?? record.highlighted);
}

function eventVisible(record: PublicEventRecord): boolean {
    return boolValue(record.is_public ?? true);
}

function spaceVisible(record: SpaceRecord): boolean {
    return boolValue(record.homepage_visible ?? record.homepageVisible);
}

function tourismName(record: TourismMemberRecord): string {
    return stringValue(record.full_name || record.fullName || 'Unnamed Member');
}

function tourismUnit(record: TourismMemberRecord): string {
    return stringValue(
        record.office_section ||
            record.team_label ||
            record.unit_name ||
            record.unitName ||
            'Tourism Office',
    );
}

function packageButton(record: PackageRecord): string {
    return stringValue(
        record.button_label || record.buttonLabel || 'View Details',
    );
}

function settingValue(
    settings: SiteSettingsRecord | null | undefined,
    camel: keyof SiteSettingsRecord,
    snake: keyof SiteSettingsRecord,
): string {
    return stringValue(settings?.[camel] ?? settings?.[snake]);
}

function emptyEventForm(): EventForm {
    return {
        type: 'event',
        title: '',
        scope: 'bccc',
        venue: '',
        event_date: '',
        event_date_to: '',
        time: '',
        summary: '',
        description: '',
        image: '',
        is_highlighted: false,
        is_public: true,
    };
}

function emptySpaceForm(): SpaceForm {
    return {
        type: 'space',
        title: '',
        slug: '',
        category: 'Convention Space',
        capacity: '',
        short_description: '',
        summary: '',
        details: '',
        image: '',
        homepage_visible: true,
        featured: false,
    };
}

function emptyPackageForm(): PackageForm {
    return {
        type: 'package',
        title: '',
        subtitle: '',
        description: '',
        button_label: 'View Details',
        href: '/events',
        image: '',
        is_active: true,
    };
}

function emptyStatForm(): StatForm {
    return {
        type: 'stat',
        label: '',
        value: '',
        suffix: '',
        description: '',
        sort_order: '0',
    };
}

function emptyTourismForm(): TourismForm {
    return {
        type: 'tourism',
        full_name: '',
        designation: '',
        unit_name: '',
        office_section: '',
        team_label: '',
        reports_to_name: '',
        tree_level: '1',
        email: '',
        phone: '',
        short_bio: '',
        photo: '',
        featured: false,
    };
}

function settingsForm(settings?: SiteSettingsRecord | null): SettingsForm {
    return {
        type: 'settings',
        address: stringValue(settings?.address),
        phone: stringValue(settings?.phone),
        email: stringValue(settings?.email),
        map_embed_url: settingValue(settings, 'mapEmbedUrl', 'map_embed_url'),
        open_map_url: settingValue(settings, 'openMapUrl', 'open_map_url'),
        visita_url: settingValue(settings, 'visitaUrl', 'visita_url'),
        creative_baguio_url: settingValue(
            settings,
            'creativeBaguioUrl',
            'creative_baguio_url',
        ),
        footer_description: settingValue(
            settings,
            'footerDescription',
            'footer_description',
        ),
        footer_copyright: settingValue(
            settings,
            'footerCopyright',
            'footer_copyright',
        ),
    };
}

function eventForm(record: PublicEventRecord): EventForm {
    return {
        type: 'event',
        id: record.id,
        title: stringValue(record.title),
        scope: stringValue(record.scope || 'bccc'),
        venue: stringValue(record.venue),
        event_date: eventStart(record),
        event_date_to: eventEnd(record),
        time: stringValue(record.time),
        summary: stringValue(record.summary),
        description: stringValue(record.description),
        image: stringValue(record.image || record.lightImage),
        is_highlighted: eventHighlighted(record),
        is_public: eventVisible(record),
    };
}

function spaceForm(record: SpaceRecord): SpaceForm {
    return {
        type: 'space',
        id: record.id,
        title: stringValue(record.title),
        slug: stringValue(record.slug),
        category: stringValue(record.category || 'Convention Space'),
        capacity: stringValue(record.capacity),
        short_description: stringValue(
            record.short_description || record.shortDescription,
        ),
        summary: stringValue(record.summary),
        details: Array.isArray(record.details) ? record.details.join('\n') : '',
        image: stringValue(record.image || record.lightImage),
        homepage_visible: spaceVisible(record),
        featured: boolValue(record.featured),
    };
}

function packageForm(record: PackageRecord): PackageForm {
    return {
        type: 'package',
        id: record.id,
        title: stringValue(record.title),
        subtitle: stringValue(record.subtitle),
        description: stringValue(record.description),
        button_label: packageButton(record),
        href: stringValue(record.href || '/events'),
        image: stringValue(record.image || record.lightImage),
        is_active: boolValue(record.is_active ?? true),
    };
}

function statForm(record: StatRecord): StatForm {
    return {
        type: 'stat',
        id: record.id,
        label: stringValue(record.label),
        value: stringValue(record.value),
        suffix: stringValue(record.suffix),
        description: stringValue(record.description),
        sort_order: stringValue(record.sort_order || '0'),
    };
}

function tourismForm(record: TourismMemberRecord): TourismForm {
    return {
        type: 'tourism',
        id: record.id,
        full_name: tourismName(record),
        designation: stringValue(record.designation),
        unit_name: stringValue(record.unit_name || record.unitName),
        office_section: stringValue(record.office_section),
        team_label: stringValue(record.team_label),
        reports_to_name: stringValue(record.reports_to_name),
        tree_level: stringValue(record.tree_level || '1'),
        email: stringValue(record.email),
        phone: stringValue(record.phone),
        short_bio: stringValue(record.short_bio || record.shortBio),
        photo: stringValue(record.photo),
        featured: boolValue(record.featured),
    };
}

function endpointFor(form: ContentForm): string {
    if (form.type === 'event') {
        return form.id ? `/admin/events/${form.id}` : '/admin/events';
    }

    if (form.type === 'space') {
        return form.id ? `/admin/spaces/${form.id}` : '/admin/spaces';
    }

    if (form.type === 'package') {
        return form.id ? `/admin/packages/${form.id}` : '/admin/packages';
    }

    if (form.type === 'stat') {
        return form.id ? `/admin/stats/${form.id}` : '/admin/stats';
    }

    if (form.type === 'tourism') {
        return form.id
            ? `/admin/tourism-members/${form.id}`
            : '/admin/tourism-members';
    }

    return '/admin/site-settings';
}

function deleteEndpoint(
    type: ContentForm['type'],
    id: number | string,
): string {
    if (type === 'event') return `/admin/events/${id}`;
    if (type === 'space') return `/admin/spaces/${id}`;
    if (type === 'package') return `/admin/packages/${id}`;
    if (type === 'stat') return `/admin/stats/${id}`;
    if (type === 'tourism') return `/admin/tourism-members/${id}`;

    return '/admin/site-settings';
}

function formPayload(form: ContentForm): Record<string, unknown> {
    if (form.type === 'event') {
        return {
            title: form.title,
            scope: form.scope,
            venue: form.venue,
            event_date: form.event_date,
            event_date_to: form.event_date_to || form.event_date,
            time: form.time,
            summary: form.summary,
            description: form.description,
            image: form.image,
            is_highlighted: form.is_highlighted,
            is_public: form.is_public,
        };
    }

    if (form.type === 'space') {
        return {
            title: form.title,
            slug: form.slug,
            category: form.category,
            capacity: form.capacity,
            short_description: form.short_description,
            summary: form.summary,
            details: form.details
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),
            image: form.image,
            homepage_visible: form.homepage_visible,
            featured: form.featured,
        };
    }

    if (form.type === 'package') {
        return {
            title: form.title,
            subtitle: form.subtitle,
            description: form.description,
            button_label: form.button_label,
            href: form.href,
            image: form.image,
            is_active: form.is_active,
        };
    }

    if (form.type === 'stat') {
        return {
            label: form.label,
            value: form.value,
            suffix: form.suffix,
            description: form.description,
            sort_order: form.sort_order,
        };
    }

    if (form.type === 'tourism') {
        return {
            full_name: form.full_name,
            designation: form.designation,
            unit_name: form.unit_name,
            office_section: form.office_section,
            team_label: form.team_label,
            reports_to_name: form.reports_to_name,
            tree_level: form.tree_level,
            email: form.email,
            phone: form.phone,
            short_bio: form.short_bio,
            photo: form.photo,
            featured: form.featured,
        };
    }

    return {
        address: form.address,
        phone: form.phone,
        email: form.email,
        map_embed_url: form.map_embed_url,
        open_map_url: form.open_map_url,
        visita_url: form.visita_url,
        creative_baguio_url: form.creative_baguio_url,
        footer_description: form.footer_description,
        footer_copyright: form.footer_copyright,
    };
}

function KpiCard({
    label,
    value,
    description,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    description: string;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <article className="alh-admin-kpi-card">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="backend-booking-label">{label}</p>
                    <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                        {value}
                    </p>
                </div>

                <div className="alh-admin-kpi-icon">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {description}
            </p>
        </article>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="grid gap-2">
            <span className="backend-booking-label">{label}</span>
            {children}
        </label>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="backend-booking-input"
        />
    );
}

function TextArea({
    value,
    onChange,
    placeholder,
    rows = 4,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <textarea
            rows={rows}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="backend-booking-input min-h-[120px] py-3"
        />
    );
}

function Toggle({
    checked,
    onChange,
    label,
    help,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    help?: string;
}) {
    return (
        <label className="alh-admin-toggle-row">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span>
                <strong>{label}</strong>
                {help ? <small>{help}</small> : null}
            </span>
        </label>
    );
}

function ImagePreview({ src, title }: { src?: string | null; title: string }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
            {src ? (
                <img
                    src={src}
                    alt={title || 'Preview'}
                    className="h-48 w-full object-cover"
                />
            ) : (
                <div className="grid h-48 place-items-center">
                    <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="truncate text-sm font-black text-white">
                    {title || 'Preview'}
                </p>
            </div>
        </div>
    );
}

function PublishedBadge({ active }: { active: boolean }) {
    return (
        <span
            className={
                active
                    ? 'rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black tracking-[0.12em] text-emerald-700 uppercase dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black tracking-[0.12em] text-amber-700 uppercase dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
            }
        >
            {active ? 'Visible' : 'Hidden'}
        </span>
    );
}

function RecordBadge({ children }: { children: ReactNode }) {
    return (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black tracking-[0.12em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {children}
        </span>
    );
}

function FormHeader({
    title,
    description,
    icon: Icon,
}: {
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <div className="alh-admin-panel-header">
            <div className="flex items-start gap-3">
                <div className="alh-admin-action-icon">
                    <Icon className="h-5 w-5" />
                </div>

                <div>
                    <p className="backend-booking-label">Editor</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ContentRow({
    title,
    subtitle,
    description,
    image,
    badges,
    onEdit,
    onDelete,
    viewHref,
}: {
    title: string;
    subtitle: string;
    description?: string;
    image?: string | null;
    badges?: ReactNode;
    onEdit: () => void;
    onDelete: () => void;
    viewHref?: string;
}) {
    return (
        <article className="alh-content-row">
            <div className="flex min-w-0 gap-4">
                <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                    {image ? (
                        <img
                            src={image}
                            alt={title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="grid h-full place-items-center">
                            <ImageIcon className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">{badges}</div>

                    <h3 className="mt-2 truncate text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                        {title || 'Untitled'}
                    </h3>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {subtitle || 'No subtitle'}
                    </p>

                    {description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
                {viewHref ? (
                    <Link href={viewHref} className="alh-admin-neutral-button">
                        <Eye className="h-4 w-4" />
                        View
                    </Link>
                ) : null}

                <button
                    type="button"
                    onClick={onEdit}
                    className="alh-admin-neutral-button"
                >
                    <Edit3 className="h-4 w-4" />
                    Edit
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    className="alh-admin-danger-button"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </button>
            </div>
        </article>
    );
}

export default function AdminContentIndex() {
    const { props } = usePage<PageProps>();

    const events = collection<PublicEventRecord>(
        props.publicEvents ?? props.events,
    );
    const packages = collection<PackageRecord>(
        props.featurePackages ?? props.packages,
    );
    const spaces = collection<SpaceRecord>(props.venueSpaces ?? props.spaces);
    const stats = collection<StatRecord>(props.homepageStats ?? props.stats);
    const tourismMembers = collection<TourismMemberRecord>(
        props.tourismMembers,
    );
    const siteSettings = props.siteSettings ?? null;

    const venueOptions = useMemo(() => {
        const fromProps = (props.initialVenueAreas ?? props.venueOptions ?? [])
            .map((item) => stringValue(item.label || item.value))
            .filter(Boolean);

        const fromSpaces = spaces
            .map((space) => stringValue(space.title))
            .filter(Boolean);

        return Array.from(
            new Set([...defaultVenueOptions, ...fromProps, ...fromSpaces]),
        );
    }, [props.initialVenueAreas, props.venueOptions, spaces]);

    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const [query, setQuery] = useState('');
    const [form, setForm] = useState<ContentForm>(emptyEventForm());
    const [processing, setProcessing] = useState(false);

    const filteredEvents = useMemo(() => {
        const needle = query.toLowerCase();

        return events.filter((item) =>
            [item.title, item.venue, item.scope, item.summary, item.description]
                .join(' ')
                .toLowerCase()
                .includes(needle),
        );
    }, [events, query]);

    const filteredSpaces = useMemo(() => {
        const needle = query.toLowerCase();

        return spaces.filter((item) =>
            [
                item.title,
                item.category,
                item.capacity,
                item.summary,
                item.short_description,
                item.shortDescription,
            ]
                .join(' ')
                .toLowerCase()
                .includes(needle),
        );
    }, [spaces, query]);

    const filteredPackages = useMemo(() => {
        const needle = query.toLowerCase();

        return packages.filter((item) =>
            [item.title, item.subtitle, item.description]
                .join(' ')
                .toLowerCase()
                .includes(needle),
        );
    }, [packages, query]);

    const filteredStats = useMemo(() => {
        const needle = query.toLowerCase();

        return stats.filter((item) =>
            [item.label, item.value, item.suffix, item.description]
                .join(' ')
                .toLowerCase()
                .includes(needle),
        );
    }, [stats, query]);

    const filteredTourism = useMemo(() => {
        const needle = query.toLowerCase();

        return tourismMembers.filter((item) =>
            [
                tourismName(item),
                item.designation,
                tourismUnit(item),
                item.email,
                item.phone,
            ]
                .join(' ')
                .toLowerCase()
                .includes(needle),
        );
    }, [tourismMembers, query]);

    const contentHealth = [
        {
            label: 'Public Events',
            value: events.length,
            description: `${events.filter(eventHighlighted).length} highlighted records.`,
            icon: CalendarDays,
        },
        {
            label: 'Facilities',
            value: spaces.length,
            description: `${spaces.filter(spaceVisible).length} visible on homepage.`,
            icon: Building2,
        },
        {
            label: 'Offers',
            value: packages.length,
            description: 'Packages and public announcement cards.',
            icon: Sparkles,
        },
        {
            label: 'Tourism Profiles',
            value: tourismMembers.length,
            description: 'Public office members and hierarchy entries.',
            icon: UsersRound,
        },
        {
            label: 'Stats',
            value: stats.length,
            description: 'Homepage metric counters.',
            icon: BarChart3,
        },
    ];

    function switchTab(tab: TabKey) {
        setActiveTab(tab);
        setQuery('');

        if (tab === 'events') setForm(emptyEventForm());
        if (tab === 'spaces') setForm(emptySpaceForm());
        if (tab === 'packages') setForm(emptyPackageForm());
        if (tab === 'stats') setForm(emptyStatForm());
        if (tab === 'tourism') setForm(emptyTourismForm());
        if (tab === 'settings') setForm(settingsForm(siteSettings));
    }

    function patchForm(patch: Partial<ContentForm>) {
        setForm((current) => ({ ...current, ...patch }) as ContentForm);
    }

    function submitForm(event: FormEvent) {
        event.preventDefault();

        setProcessing(true);

        const endpoint = endpointFor(form);
        const payload = formPayload(form);

        const hasId =
            form.type !== 'settings' &&
            'id' in form &&
            form.id !== undefined &&
            form.id !== null &&
            form.id !== '';

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                if (form.type === 'event') setForm(emptyEventForm());
                if (form.type === 'space') setForm(emptySpaceForm());
                if (form.type === 'package') setForm(emptyPackageForm());
                if (form.type === 'stat') setForm(emptyStatForm());
                if (form.type === 'tourism') setForm(emptyTourismForm());
                if (form.type === 'settings')
                    setForm(settingsForm(siteSettings));
            },
        };

        if (form.type === 'settings' || hasId) {
            router.put(endpoint, payload, options);
            return;
        }

        router.post(endpoint, payload, options);
    }

    function destroy(
        type: ContentForm['type'],
        id?: number | string,
        label?: string | null,
    ) {
        if (!id || type === 'settings') {
            return;
        }

        if (
            !window.confirm(`Delete "${label || id}"? This cannot be undone.`)
        ) {
            return;
        }

        router.delete(deleteEndpoint(type, id), {
            preserveScroll: true,
        });
    }

    function renderEditor() {
        if (activeTab === 'overview') {
            return (
                <aside className="alh-admin-panel h-fit overflow-hidden">
                    <FormHeader
                        icon={LayoutPanelTop}
                        title="Content workspace guide"
                        description="Use the section tabs to edit only the information needed for each public page section."
                    />

                    <div className="grid gap-4 p-5">
                        {tabs
                            .filter((tab) => tab.key !== 'overview')
                            .map((tab) => {
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => switchTab(tab.key)}
                                        className="alh-content-tab-card"
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>
                                            <strong>{tab.label}</strong>
                                            <small>{tab.description}</small>
                                        </span>
                                    </button>
                                );
                            })}
                    </div>
                </aside>
            );
        }

        if (form.type === 'event') {
            return (
                <aside className="alh-admin-panel h-fit overflow-hidden">
                    <FormHeader
                        icon={CalendarDays}
                        title={form.id ? 'Edit Event' : 'Create Event'}
                        description="Use short summaries for cards and longer text only for detail pages."
                    />

                    <form onSubmit={submitForm} className="grid gap-4 p-5">
                        <Field label="Title">
                            <TextInput
                                value={form.title}
                                onChange={(value) =>
                                    patchForm({ title: value })
                                }
                            />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Scope">
                                <select
                                    value={form.scope}
                                    onChange={(event) =>
                                        patchForm({ scope: event.target.value })
                                    }
                                    className="backend-booking-input"
                                >
                                    <option value="bccc">BCCC Event</option>
                                    <option value="city">
                                        Baguio City Event
                                    </option>
                                </select>
                            </Field>

                            <Field label="Venue">
                                <select
                                    value={form.venue}
                                    onChange={(event) =>
                                        patchForm({ venue: event.target.value })
                                    }
                                    className="backend-booking-input"
                                >
                                    <option value="">Select venue</option>
                                    {venueOptions.map((venue) => (
                                        <option key={venue} value={venue}>
                                            {venue}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="Start Date">
                                <TextInput
                                    type="date"
                                    value={form.event_date}
                                    onChange={(value) =>
                                        patchForm({ event_date: value })
                                    }
                                />
                            </Field>

                            <Field label="End Date">
                                <TextInput
                                    type="date"
                                    value={form.event_date_to}
                                    onChange={(value) =>
                                        patchForm({ event_date_to: value })
                                    }
                                />
                            </Field>

                            <Field label="Time">
                                <TextInput
                                    value={form.time}
                                    onChange={(value) =>
                                        patchForm({ time: value })
                                    }
                                    placeholder="8:00 AM - 5:00 PM"
                                />
                            </Field>
                        </div>

                        <Field label="Card Summary">
                            <TextArea
                                value={form.summary}
                                onChange={(value) =>
                                    patchForm({ summary: value })
                                }
                                rows={3}
                            />
                        </Field>

                        <Field label="Full Description">
                            <TextArea
                                value={form.description}
                                onChange={(value) =>
                                    patchForm({ description: value })
                                }
                                rows={5}
                            />
                        </Field>

                        <Field label="Image URL / Path">
                            <TextInput
                                value={form.image}
                                onChange={(value) =>
                                    patchForm({ image: value })
                                }
                                placeholder="/marketing/images/events/1.JPG"
                            />
                        </Field>

                        <ImagePreview src={form.image} title={form.title} />

                        <Toggle
                            checked={form.is_highlighted}
                            onChange={(value) =>
                                patchForm({ is_highlighted: value })
                            }
                            label="Highlight on public pages"
                            help="Use this only for important BCCC or city events."
                        />

                        <Toggle
                            checked={form.is_public}
                            onChange={(value) =>
                                patchForm({ is_public: value })
                            }
                            label="Publicly visible"
                            help="Disable when drafting or archiving the event."
                        />

                        <button
                            type="submit"
                            disabled={processing}
                            className="alh-primary-button"
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {form.id ? 'Update Event' : 'Save Event'}
                        </button>
                    </form>
                </aside>
            );
        }

        if (form.type === 'space') {
            return (
                <aside className="alh-admin-panel h-fit overflow-hidden">
                    <FormHeader
                        icon={Building2}
                        title={form.id ? 'Edit Facility' : 'Create Facility'}
                        description="Keep facility cards compact: title, category, capacity, short summary, then details only when opened."
                    />

                    <form onSubmit={submitForm} className="grid gap-4 p-5">
                        <Field label="Title">
                            <TextInput
                                value={form.title}
                                onChange={(value) =>
                                    patchForm({ title: value })
                                }
                            />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Slug">
                                <TextInput
                                    value={form.slug}
                                    onChange={(value) =>
                                        patchForm({ slug: value })
                                    }
                                    placeholder="main-hall"
                                />
                            </Field>

                            <Field label="Category">
                                <TextInput
                                    value={form.category}
                                    onChange={(value) =>
                                        patchForm({ category: value })
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Capacity">
                            <TextInput
                                value={form.capacity}
                                onChange={(value) =>
                                    patchForm({ capacity: value })
                                }
                                placeholder="Up to 1,000 guests"
                            />
                        </Field>

                        <Field label="Short Description">
                            <TextArea
                                value={form.short_description}
                                onChange={(value) =>
                                    patchForm({ short_description: value })
                                }
                                rows={3}
                            />
                        </Field>

                        <Field label="Summary">
                            <TextArea
                                value={form.summary}
                                onChange={(value) =>
                                    patchForm({ summary: value })
                                }
                                rows={4}
                            />
                        </Field>

                        <Field label="Details, one per line">
                            <TextArea
                                value={form.details}
                                onChange={(value) =>
                                    patchForm({ details: value })
                                }
                                rows={5}
                            />
                        </Field>

                        <Field label="Image URL / Path">
                            <TextInput
                                value={form.image}
                                onChange={(value) =>
                                    patchForm({ image: value })
                                }
                                placeholder="/marketing/images/facilities/lightvip.JPG"
                            />
                        </Field>

                        <ImagePreview src={form.image} title={form.title} />

                        <Toggle
                            checked={form.homepage_visible}
                            onChange={(value) =>
                                patchForm({ homepage_visible: value })
                            }
                            label="Show on homepage"
                        />

                        <Toggle
                            checked={form.featured}
                            onChange={(value) => patchForm({ featured: value })}
                            label="Feature this space"
                        />

                        <button
                            type="submit"
                            disabled={processing}
                            className="alh-primary-button"
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {form.id ? 'Update Facility' : 'Save Facility'}
                        </button>
                    </form>
                </aside>
            );
        }

        if (form.type === 'package') {
            return (
                <aside className="alh-admin-panel h-fit overflow-hidden">
                    <FormHeader
                        icon={Sparkles}
                        title={form.id ? 'Edit Offer' : 'Create Offer'}
                        description="Use this for public highlight cards, offers, reminders, or announcement blocks."
                    />

                    <form onSubmit={submitForm} className="grid gap-4 p-5">
                        <Field label="Title">
                            <TextInput
                                value={form.title}
                                onChange={(value) =>
                                    patchForm({ title: value })
                                }
                            />
                        </Field>

                        <Field label="Subtitle">
                            <TextInput
                                value={form.subtitle}
                                onChange={(value) =>
                                    patchForm({ subtitle: value })
                                }
                            />
                        </Field>

                        <Field label="Description">
                            <TextArea
                                value={form.description}
                                onChange={(value) =>
                                    patchForm({ description: value })
                                }
                                rows={5}
                            />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Button Label">
                                <TextInput
                                    value={form.button_label}
                                    onChange={(value) =>
                                        patchForm({ button_label: value })
                                    }
                                />
                            </Field>

                            <Field label="Button Link">
                                <TextInput
                                    value={form.href}
                                    onChange={(value) =>
                                        patchForm({ href: value })
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Image URL / Path">
                            <TextInput
                                value={form.image}
                                onChange={(value) =>
                                    patchForm({ image: value })
                                }
                            />
                        </Field>

                        <ImagePreview src={form.image} title={form.title} />

                        <Toggle
                            checked={form.is_active}
                            onChange={(value) =>
                                patchForm({ is_active: value })
                            }
                            label="Active / visible"
                        />

                        <button
                            type="submit"
                            disabled={processing}
                            className="alh-primary-button"
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {form.id ? 'Update Offer' : 'Save Offer'}
                        </button>
                    </form>
                </aside>
            );
        }

        if (form.type === 'stat') {
            return (
                <aside className="alh-admin-panel h-fit overflow-hidden">
                    <FormHeader
                        icon={BarChart3}
                        title={form.id ? 'Edit Stat' : 'Create Stat'}
                        description="Homepage statistics should be short and easy to scan."
                    />

                    <form onSubmit={submitForm} className="grid gap-4 p-5">
                        <Field label="Label">
                            <TextInput
                                value={form.label}
                                onChange={(value) =>
                                    patchForm({ label: value })
                                }
                            />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="Value">
                                <TextInput
                                    value={form.value}
                                    onChange={(value) => patchForm({ value })}
                                />
                            </Field>

                            <Field label="Suffix">
                                <TextInput
                                    value={form.suffix}
                                    onChange={(value) =>
                                        patchForm({ suffix: value })
                                    }
                                />
                            </Field>

                            <Field label="Sort Order">
                                <TextInput
                                    value={form.sort_order}
                                    onChange={(value) =>
                                        patchForm({ sort_order: value })
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Description">
                            <TextArea
                                value={form.description}
                                onChange={(value) =>
                                    patchForm({ description: value })
                                }
                                rows={4}
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={processing}
                            className="alh-primary-button"
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {form.id ? 'Update Stat' : 'Save Stat'}
                        </button>
                    </form>
                </aside>
            );
        }

        if (form.type === 'tourism') {
            return (
                <aside className="alh-admin-panel h-fit overflow-hidden">
                    <FormHeader
                        icon={UserRound}
                        title={
                            form.id ? 'Edit Team Member' : 'Create Team Member'
                        }
                        description="Group members by section or team so the public Tourism Office page remains clean."
                    />

                    <form onSubmit={submitForm} className="grid gap-4 p-5">
                        <Field label="Full Name">
                            <TextInput
                                value={form.full_name}
                                onChange={(value) =>
                                    patchForm({ full_name: value })
                                }
                            />
                        </Field>

                        <Field label="Designation">
                            <TextInput
                                value={form.designation}
                                onChange={(value) =>
                                    patchForm({ designation: value })
                                }
                            />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Office Section">
                                <TextInput
                                    value={form.office_section}
                                    onChange={(value) =>
                                        patchForm({ office_section: value })
                                    }
                                />
                            </Field>

                            <Field label="Team Label">
                                <TextInput
                                    value={form.team_label}
                                    onChange={(value) =>
                                        patchForm({ team_label: value })
                                    }
                                />
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Unit Name">
                                <TextInput
                                    value={form.unit_name}
                                    onChange={(value) =>
                                        patchForm({ unit_name: value })
                                    }
                                />
                            </Field>

                            <Field label="Reports To">
                                <TextInput
                                    value={form.reports_to_name}
                                    onChange={(value) =>
                                        patchForm({ reports_to_name: value })
                                    }
                                />
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="Tree Level">
                                <TextInput
                                    value={form.tree_level}
                                    onChange={(value) =>
                                        patchForm({ tree_level: value })
                                    }
                                />
                            </Field>

                            <Field label="Email">
                                <TextInput
                                    value={form.email}
                                    onChange={(value) =>
                                        patchForm({ email: value })
                                    }
                                />
                            </Field>

                            <Field label="Phone">
                                <TextInput
                                    value={form.phone}
                                    onChange={(value) =>
                                        patchForm({ phone: value })
                                    }
                                />
                            </Field>
                        </div>

                        <Field label="Short Bio">
                            <TextArea
                                value={form.short_bio}
                                onChange={(value) =>
                                    patchForm({ short_bio: value })
                                }
                                rows={4}
                            />
                        </Field>

                        <Field label="Photo URL / Path">
                            <TextInput
                                value={form.photo}
                                onChange={(value) =>
                                    patchForm({ photo: value })
                                }
                            />
                        </Field>

                        <ImagePreview src={form.photo} title={form.full_name} />

                        <Toggle
                            checked={form.featured}
                            onChange={(value) => patchForm({ featured: value })}
                            label="Feature this person"
                        />

                        <button
                            type="submit"
                            disabled={processing}
                            className="alh-primary-button"
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {form.id ? 'Update Member' : 'Save Member'}
                        </button>
                    </form>
                </aside>
            );
        }

        return (
            <aside className="alh-admin-panel h-fit overflow-hidden">
                <FormHeader
                    icon={Globe2}
                    title="Site Settings"
                    description="Keep contact, map, footer, and tourism links centralized."
                />

                <form onSubmit={submitForm} className="grid gap-4 p-5">
                    <Field label="Address">
                        <TextArea
                            value={form.address}
                            onChange={(value) => patchForm({ address: value })}
                            rows={3}
                        />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Phone">
                            <TextInput
                                value={form.phone}
                                onChange={(value) =>
                                    patchForm({ phone: value })
                                }
                            />
                        </Field>

                        <Field label="Email">
                            <TextInput
                                value={form.email}
                                onChange={(value) =>
                                    patchForm({ email: value })
                                }
                            />
                        </Field>
                    </div>

                    <Field label="Google Map Embed URL">
                        <TextArea
                            value={form.map_embed_url}
                            onChange={(value) =>
                                patchForm({ map_embed_url: value })
                            }
                            rows={3}
                        />
                    </Field>

                    <Field label="Open Map URL">
                        <TextInput
                            value={form.open_map_url}
                            onChange={(value) =>
                                patchForm({ open_map_url: value })
                            }
                        />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="VISITA URL">
                            <TextInput
                                value={form.visita_url}
                                onChange={(value) =>
                                    patchForm({ visita_url: value })
                                }
                            />
                        </Field>

                        <Field label="Creative Baguio URL">
                            <TextInput
                                value={form.creative_baguio_url}
                                onChange={(value) =>
                                    patchForm({ creative_baguio_url: value })
                                }
                            />
                        </Field>
                    </div>

                    <Field label="Footer Description">
                        <TextArea
                            value={form.footer_description}
                            onChange={(value) =>
                                patchForm({ footer_description: value })
                            }
                            rows={4}
                        />
                    </Field>

                    <Field label="Footer Copyright">
                        <TextInput
                            value={form.footer_copyright}
                            onChange={(value) =>
                                patchForm({ footer_copyright: value })
                            }
                        />
                    </Field>

                    <button
                        type="submit"
                        disabled={processing}
                        className="alh-primary-button"
                    >
                        {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Site Settings
                    </button>
                </form>
            </aside>
        );
    }

    function renderList() {
        if (activeTab === 'overview') {
            return (
                <main className="space-y-5">
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {contentHealth.map((item) => (
                            <KpiCard key={item.label} {...item} />
                        ))}
                    </section>

                    <section className="alh-admin-panel overflow-hidden">
                        <div className="alh-admin-panel-header">
                            <div>
                                <p className="backend-booking-label">
                                    Publishing Flow
                                </p>
                                <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                    Minimal content, stronger public pages
                                </h2>
                                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    The public site uses compressed sections.
                                    Keep summaries short, use clear titles, and
                                    place detailed text only where users
                                    intentionally open a full page.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                            {tabs
                                .filter((tab) => tab.key !== 'overview')
                                .map((tab) => {
                                    const Icon = tab.icon;

                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => switchTab(tab.key)}
                                            className="alh-content-dashboard-card"
                                        >
                                            <div className="alh-admin-action-icon">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3>{tab.label}</h3>
                                                <p>{tab.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-2">
                        <div className="alh-admin-panel overflow-hidden">
                            <div className="alh-admin-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Recent Events
                                    </p>
                                    <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                                        Latest event content
                                    </h2>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {events.slice(0, 5).map((item) => (
                                    <ContentRow
                                        key={item.id}
                                        title={stringValue(item.title)}
                                        subtitle={`${cleanLabel(item.scope)} · ${eventStart(item)}`}
                                        description={stringValue(
                                            item.summary || item.description,
                                        )}
                                        image={previewImage(item)}
                                        onEdit={() => {
                                            setActiveTab('events');
                                            setForm(eventForm(item));
                                        }}
                                        onDelete={() =>
                                            destroy(
                                                'event',
                                                item.id,
                                                item.title,
                                            )
                                        }
                                        viewHref="/events"
                                        badges={
                                            <>
                                                <PublishedBadge
                                                    active={eventVisible(item)}
                                                />
                                                {eventHighlighted(item) ? (
                                                    <RecordBadge>
                                                        Highlighted
                                                    </RecordBadge>
                                                ) : null}
                                            </>
                                        }
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="alh-admin-panel overflow-hidden">
                            <div className="alh-admin-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Recent Facilities
                                    </p>
                                    <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">
                                        Latest spaces
                                    </h2>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {spaces.slice(0, 5).map((item) => (
                                    <ContentRow
                                        key={item.id}
                                        title={stringValue(item.title)}
                                        subtitle={`${stringValue(item.category)} · ${stringValue(item.capacity)}`}
                                        description={stringValue(
                                            item.summary ||
                                                item.short_description ||
                                                item.shortDescription,
                                        )}
                                        image={previewImage(item)}
                                        onEdit={() => {
                                            setActiveTab('spaces');
                                            setForm(spaceForm(item));
                                        }}
                                        onDelete={() =>
                                            destroy(
                                                'space',
                                                item.id,
                                                item.title,
                                            )
                                        }
                                        viewHref={
                                            item.slug
                                                ? `/facilities/${item.slug}`
                                                : '/facilities'
                                        }
                                        badges={
                                            <PublishedBadge
                                                active={spaceVisible(item)}
                                            />
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
            );
        }

        if (activeTab === 'events') {
            return (
                <main className="alh-admin-panel overflow-hidden">
                    <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="backend-booking-label">Events</p>
                            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                {filteredEvents.length} event records
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => setForm(emptyEventForm())}
                            className="alh-primary-button"
                        >
                            <Plus className="h-4 w-4" />
                            New Event
                        </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredEvents.map((item) => (
                            <ContentRow
                                key={item.id}
                                title={stringValue(item.title)}
                                subtitle={`${cleanLabel(item.scope)} · ${eventStart(item)} · ${stringValue(item.venue || 'No venue')}`}
                                description={stringValue(
                                    item.summary || item.description,
                                )}
                                image={previewImage(item)}
                                onEdit={() => setForm(eventForm(item))}
                                onDelete={() =>
                                    destroy('event', item.id, item.title)
                                }
                                viewHref="/events"
                                badges={
                                    <>
                                        <PublishedBadge
                                            active={eventVisible(item)}
                                        />
                                        {eventHighlighted(item) ? (
                                            <RecordBadge>
                                                Highlighted
                                            </RecordBadge>
                                        ) : null}
                                    </>
                                }
                            />
                        ))}
                    </div>
                </main>
            );
        }

        if (activeTab === 'spaces') {
            return (
                <main className="alh-admin-panel overflow-hidden">
                    <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="backend-booking-label">Facilities</p>
                            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                {filteredSpaces.length} facility records
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => setForm(emptySpaceForm())}
                            className="alh-primary-button"
                        >
                            <Plus className="h-4 w-4" />
                            New Facility
                        </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredSpaces.map((item) => (
                            <ContentRow
                                key={item.id}
                                title={stringValue(item.title)}
                                subtitle={`${stringValue(item.category)} · ${stringValue(item.capacity)}`}
                                description={stringValue(
                                    item.summary ||
                                        item.short_description ||
                                        item.shortDescription,
                                )}
                                image={previewImage(item)}
                                onEdit={() => setForm(spaceForm(item))}
                                onDelete={() =>
                                    destroy('space', item.id, item.title)
                                }
                                viewHref={
                                    item.slug
                                        ? `/facilities/${item.slug}`
                                        : '/facilities'
                                }
                                badges={
                                    <>
                                        <PublishedBadge
                                            active={spaceVisible(item)}
                                        />
                                        {boolValue(item.featured) ? (
                                            <RecordBadge>Featured</RecordBadge>
                                        ) : null}
                                    </>
                                }
                            />
                        ))}
                    </div>
                </main>
            );
        }

        if (activeTab === 'packages') {
            return (
                <main className="alh-admin-panel overflow-hidden">
                    <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="backend-booking-label">Offers</p>
                            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                {filteredPackages.length} offer records
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => setForm(emptyPackageForm())}
                            className="alh-primary-button"
                        >
                            <Plus className="h-4 w-4" />
                            New Offer
                        </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredPackages.map((item) => (
                            <ContentRow
                                key={item.id}
                                title={stringValue(item.title)}
                                subtitle={`${stringValue(item.subtitle || 'Offer')} · ${packageButton(item)}`}
                                description={stringValue(item.description)}
                                image={previewImage(item)}
                                onEdit={() => setForm(packageForm(item))}
                                onDelete={() =>
                                    destroy('package', item.id, item.title)
                                }
                                viewHref={item.href || '/events'}
                                badges={
                                    <PublishedBadge
                                        active={boolValue(
                                            item.is_active ?? true,
                                        )}
                                    />
                                }
                            />
                        ))}
                    </div>
                </main>
            );
        }

        if (activeTab === 'stats') {
            return (
                <main className="alh-admin-panel overflow-hidden">
                    <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="backend-booking-label">
                                Homepage Stats
                            </p>
                            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                {filteredStats.length} stat records
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => setForm(emptyStatForm())}
                            className="alh-primary-button"
                        >
                            <Plus className="h-4 w-4" />
                            New Stat
                        </button>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredStats.map((item) => (
                            <article
                                key={item.id}
                                className="alh-stat-editor-card"
                            >
                                <p className="backend-booking-label">
                                    {item.label || 'Stat'}
                                </p>
                                <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 dark:text-white">
                                    {item.value}
                                    {item.suffix}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {item.description || 'No description.'}
                                </p>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm(statForm(item))}
                                        className="alh-admin-neutral-button"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            destroy('stat', item.id, item.label)
                                        }
                                        className="alh-admin-danger-button"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </main>
            );
        }

        if (activeTab === 'tourism') {
            return (
                <main className="alh-admin-panel overflow-hidden">
                    <div className="alh-admin-panel-header flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="backend-booking-label">
                                Tourism Office
                            </p>
                            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                {filteredTourism.length} profile records
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => setForm(emptyTourismForm())}
                            className="alh-primary-button"
                        >
                            <Plus className="h-4 w-4" />
                            New Member
                        </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredTourism.map((item) => (
                            <ContentRow
                                key={item.id}
                                title={tourismName(item)}
                                subtitle={`${stringValue(item.designation || 'No designation')} · ${tourismUnit(item)}`}
                                description={stringValue(
                                    item.short_bio || item.shortBio,
                                )}
                                image={stringValue(item.photo)}
                                onEdit={() => setForm(tourismForm(item))}
                                onDelete={() =>
                                    destroy(
                                        'tourism',
                                        item.id,
                                        tourismName(item),
                                    )
                                }
                                viewHref="/tourism-office"
                                badges={
                                    <>
                                        <RecordBadge>
                                            Level{' '}
                                            {stringValue(item.tree_level || 1)}
                                        </RecordBadge>
                                        {boolValue(item.featured) ? (
                                            <RecordBadge>Featured</RecordBadge>
                                        ) : null}
                                    </>
                                }
                            />
                        ))}
                    </div>
                </main>
            );
        }

        return (
            <main className="alh-admin-panel overflow-hidden">
                <div className="alh-admin-panel-header">
                    <div>
                        <p className="backend-booking-label">
                            Public Site Settings
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                            Contact, map, footer, and city links
                        </h2>
                    </div>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2">
                    <div className="alh-admin-mini-box">
                        <span>Address</span>
                        <strong>
                            {siteSettings?.address || 'Not configured'}
                        </strong>
                    </div>
                    <div className="alh-admin-mini-box">
                        <span>Phone</span>
                        <strong>
                            {siteSettings?.phone || 'Not configured'}
                        </strong>
                    </div>
                    <div className="alh-admin-mini-box">
                        <span>Email</span>
                        <strong>
                            {siteSettings?.email || 'Not configured'}
                        </strong>
                    </div>
                    <div className="alh-admin-mini-box">
                        <span>VISITA URL</span>
                        <strong>
                            {settingValue(
                                siteSettings,
                                'visitaUrl',
                                'visita_url',
                            ) || 'Not configured'}
                        </strong>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <AdminLayout
            title="Public Content Manager"
            eyebrow="Frontend Configuration"
            description="Control public pages, homepage content, events, spaces, tourism office profiles, site links, and footer/contact information from one clean workspace."
            actions={
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/"
                        target="_blank"
                        className="alh-secondary-button"
                    >
                        <Eye className="h-4 w-4" />
                        Open Public Site
                    </Link>
                    <Link
                        href="/admin/calendar/manage"
                        className="alh-primary-button"
                    >
                        <CalendarDays className="h-4 w-4" />
                        Manage Calendar
                    </Link>
                </div>
            }
        >
            <Head title="Public Content Manager" />

            <div className="space-y-5">
                <section className="alh-admin-panel overflow-hidden">
                    <div className="alh-admin-panel-header flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="backend-booking-label">
                                Content Sections
                            </p>
                            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                                Edit by section, not all at once
                            </h2>
                            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                This layout prevents the old crowded admin
                                screen by separating content into focused tabs
                                and placing the editor beside the list.
                            </p>
                        </div>

                        {activeTab !== 'overview' ? (
                            <div className="relative w-full max-w-md">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    className="backend-booking-input pl-10"
                                    placeholder="Search current section..."
                                />
                            </div>
                        ) : null}
                    </div>

                    <div className="alh-content-tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => switchTab(tab.key)}
                                    className={
                                        activeTab === tab.key ? 'is-active' : ''
                                    }
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                    {renderEditor()}
                    {renderList()}
                </section>
            </div>
        </AdminLayout>
    );
}
