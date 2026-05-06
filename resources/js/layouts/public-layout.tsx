import FloatingQuickLinks from '@/components/public/floating-quick-links';
import PublicFooter from '@/components/public/public-footer';
import PublicHeader from '@/components/public/public-header';
import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

export type SiteSettings = {
  mapEmbedUrl?: string | null;
  openMapUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  visitaUrl?: string | null;
  creativeBaguioUrl?: string | null;
  footerDescription?: string | null;
  footerCopyright?: string | null;
};

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  const page = usePage<{ siteSettings?: SiteSettings }>();
  const siteSettings = page.props.siteSettings;

  return (
    <div className="bccc-public-shell relative min-h-screen overflow-x-clip bg-[var(--bccc-bg)] text-[var(--bccc-text)]">
      <PublicHeader />

      <main className="relative z-10 min-h-screen">{children}</main>

      <PublicFooter siteSettings={siteSettings} />
      <FloatingQuickLinks siteSettings={siteSettings} />
    </div>
  );
}
