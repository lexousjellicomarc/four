export type VenueOption = {
    label: string;
    value: string;
    category?: string | null;
    capacity?: string | null;
};

export type PublicEventItem = {
    id: number | string;
    title: string;
    venue: string;
    date: string;
    dateKey?: string | null;
    dateEnd?: string | null;
    durationDays?: number | null;
    time?: string | null;
    description: string;
    summary: string;
    note?: string | null;
    highlighted: boolean;
    featured?: boolean;
    images: string[];
    image?: string;
    lightImage?: string;
    darkImage?: string;
    category?: string;
    scope: 'bccc' | 'city' | string;
    isPublic: boolean;
};

export type PublicSpaceItem = {
    id: number | string;
    slug: string;
    title: string;
    category: string;
    capacity: string;
    shortDescription: string;
    summary: string;
    details: string[];
    lightImage: string;
    darkImage: string;
    image: string;
    homepageVisible: boolean;
    featured?: boolean;
    ctaLabel?: string;
};

export type FeaturePackageItem = {
    id: number | string;
    title: string;
    description: string;
    images: string[];
    image: string;
    lightImage?: string;
    darkImage?: string;
    subtitle: string;
    buttonLabel: string;
    href?: string;
};

export type HomepageStatItem = {
    id: number | string;
    label: string;
    value: string;
    suffix: string;
};

export type SiteConfig = {
    mapEmbedUrl: string;
    openMapUrl: string;
    address: string;
    phone: string;
    email: string;
    visitaUrl?: string;
    creativeBaguioUrl?: string;
    footerDescription: string;
    footerCopyright: string;
};
