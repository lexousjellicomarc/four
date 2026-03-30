import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import PublicFooter from '@/components/public/public-footer';
import PublicHeader from '@/components/public/public-header';

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
    <div className="public-shell min-h-screen overflow-x-clip text-slate-900 dark:text-white">
      <PublicHeader />
      <main className="relative z-10 pt-24 md:pt-28">{children}</main>
      <PublicFooter siteSettings={siteSettings} />
    </div>
  );
}
