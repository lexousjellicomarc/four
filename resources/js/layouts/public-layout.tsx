import FloatingQuickLinks from '@/components/public/floating-quick-links';
import PublicFooter from '@/components/public/public-footer';
import PublicHeader from '@/components/public/public-header';
import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

export type SiteSettings = {
    siteName?: string | null;
    site_name?: string | null;
    tagline?: string | null;
    description?: string | null;

    mapEmbedUrl?: string | null;
    map_embed_url?: string | null;
    openMapUrl?: string | null;
    open_map_url?: string | null;

    address?: string | null;
    phone?: string | null;
    email?: string | null;
    officeHours?: string | null;
    office_hours?: string | null;

    visitaUrl?: string | null;
    creativeBaguioUrl?: string | null;
    visita_url?: string | null;
    arts_url?: string | null;
    creative_baguio_url?: string | null;

    footerDescription?: string | null;
    footer_description?: string | null;
    footerCopyright?: string | null;
    footer_copyright?: string | null;

    logo_url?: string | null;
    logoUrl?: string | null;
    city_seal_url?: string | null;
    citySealUrl?: string | null;
    baguio_logo_url?: string | null;
    baguioLogoUrl?: string | null;
    breathe_baguio_logo_url?: string | null;
    breatheBaguioLogoUrl?: string | null;

    facebookUrl?: string | null;
    facebook_url?: string | null;
    websiteUrl?: string | null;
    website_url?: string | null;

    [key: string]: unknown;
};

type PublicLayoutProps = {
    children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
    const page = usePage<{ siteSettings?: SiteSettings }>();
    const siteSettings = page.props.siteSettings;

    return (
        <div className="bccc-public-shell min-h-screen bg-[#f8f5ef] text-[#201a12] antialiased dark:bg-[#0d0f12] dark:text-white">
            <PublicHeader />

            <main className="bccc-public-main relative overflow-hidden">
                {children}
            </main>

            <PublicFooter />
            <FloatingQuickLinks siteSettings={siteSettings} />
        </div>
    );
}
