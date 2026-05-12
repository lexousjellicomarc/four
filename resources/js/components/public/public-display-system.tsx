import type { LucideIcon } from 'lucide-react';
import { LayoutGrid } from 'lucide-react';
import type { ReactNode } from 'react';

export type PublicImageRecord = {
    id?: number | string;
    title?: string | null;
    name?: string | null;
    label?: string | null;
    subtitle?: string | null;
    description?: string | null;
    image?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
    image_path?: string | null;
    imagePath?: string | null;
    category?: string | null;
    event_category?: string | null;
    starts_at?: string | null;
    startsAt?: string | null;
    date?: string | null;
    position?: string | null;
    role?: string | null;
    capacity?: string | number | null;
    external_url?: string | null;
    externalUrl?: string | null;
    homepage_visible?: boolean | number | string | null;
    homepageVisible?: boolean;
    is_active?: boolean | number | string | null;
    [key: string]: unknown;
};

export function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export function titleOf(item?: PublicImageRecord | null, fallback = 'Untitled') {
    return String(item?.title || item?.name || item?.label || fallback);
}

export function descriptionOf(item?: PublicImageRecord | null, fallback = '') {
    return String(item?.description || item?.subtitle || fallback);
}

export function imageOf(item?: PublicImageRecord | null) {
    return String(
        item?.image_url ||
            item?.imageUrl ||
            item?.image_path ||
            item?.imagePath ||
            item?.image ||
            '',
    );
}

export function visibleRecords<T extends PublicImageRecord>(items?: T[]) {
    const records = Array.isArray(items) ? items : [];

    return records.filter((item) => {
        const explicit =
            item.homepageVisible === true ||
            item.homepage_visible === true ||
            item.homepage_visible === 1 ||
            item.homepage_visible === '1';

        const active =
            item.is_active === true ||
            item.is_active === 1 ||
            item.is_active === '1';

        return explicit || active || item.homepage_visible === undefined;
    });
}

export function formatPublicDate(value?: string | null) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

export function SectionIntro({
    kicker,
    title,
    description,
    align = 'left',
}: {
    kicker: string;
    title: string;
    description?: string;
    align?: 'left' | 'center';
}) {
    return (
        <div className={align === 'center' ? 'mx-auto max-w-4xl text-center' : 'max-w-4xl text-left'}>
            <p className="public-display-kicker">{kicker}</p>

            <h2 className="public-display-heading mt-4 text-[#21180d] dark:text-white">
                {title}
            </h2>

            {description ? (
                <p className="public-display-subheading public-readable mt-5">
                    {description}
                </p>
            ) : null}
        </div>
    );
}

export function EditorialFrame({
    left,
    main,
    right,
    footer,
    label = 'main',
}: {
    left?: ReactNode;
    main: ReactNode;
    right?: ReactNode;
    footer?: ReactNode;
    label?: string;
}) {
    return (
        <div className="public-grid-frame">
            <aside className="public-frame-panel">
                <span className="public-frame-label green">Aside</span>
                <div className="mt-4">{left}</div>
            </aside>

            <main className="public-frame-panel">
                <span className="public-frame-label blue">{label}</span>
                <div className="mt-4">{main}</div>
            </main>

            <aside className="public-frame-panel">
                <span className="public-frame-label">Aside</span>
                <div className="mt-4">{right}</div>
            </aside>

            {footer ? (
                <div className="col-span-full public-frame-panel">
                    <span className="public-frame-label gold">Footer</span>
                    <div className="mt-4">{footer}</div>
                </div>
            ) : null}
        </div>
    );
}

export function EmptyPublicPanel({
    icon: Icon = LayoutGrid,
    title,
    description,
}: {
    icon?: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="grid min-h-[18rem] place-items-center rounded-[1.5rem] border border-dashed border-[#d9c7a6]/70 bg-white/55 p-8 text-center dark:border-white/10 dark:bg-white/[0.035]">
            <div>
                <Icon className="mx-auto h-10 w-10 text-[#b08d48] dark:text-[#f1d89b]" />
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                    {title}
                </h3>
                <p className="public-readable mx-auto mt-3 max-w-[62ch] text-sm text-[#6e604c] dark:text-white/56">
                    {description}
                </p>
            </div>
        </div>
    );
}
