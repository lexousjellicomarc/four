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
    <div className="min-h-screen bg-[#f7f5ef] text-[#232320] dark:bg-[#0f1014] dark:text-white">
      <PublicHeader />
      <main className="pt-24">{children}</main>
      <PublicFooter siteSettings={siteSettings} />
    </div>
  );
}
