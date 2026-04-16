import type { PropsWithChildren } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useMemo, useState } from 'react';
import NotificationBell from '@/components/layout/NotificationBell';

type AuthUser = {
  name?: string;
  email?: string;
};

type PageProps = {
  auth?: {
    user?: AuthUser;
  };
  adminInquiryCounts?: {
    new?: number;
  };
};

type AdminLayoutProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

const sectionTabs = [
  { label: 'Home', href: '/admin/home?tab=home' },
  { label: 'Events', href: '/admin/home?tab=events' },
  { label: 'Calendar', href: '/admin/home?tab=calendar' },
  { label: 'Facilities', href: '/admin/home?tab=facilities' },
  { label: 'Tourism', href: '/admin/home?tab=tourism-office' },
  { label: 'Contact', href: '/admin/home?tab=contact' },
];

const mainLinks = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Configure', href: '/admin/home?tab=home' },
  { label: 'MICE Survey & Registry', href: '/reports/mice-registry' },
  { label: 'Inquiries', href: '/admin/inquiries' },
  { label: 'Frontend', href: '/' },
  { label: 'Booking', href: '/dashboard' },
];

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const page = usePage<PageProps>();
  const user = page.props.auth?.user;
  const url = page.url;
  const [openProfile, setOpenProfile] = useState(false);

  const activePath = useMemo(() => url.split('?')[0], [url]);
  const isContent = url.startsWith('/admin/home');
  const newInquiryCount = Number(page.props.adminInquiryCounts?.new ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f1117] dark:text-white">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#12161f]/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/admin/home?tab=home" className="text-xl font-bold tracking-tight">
                BCCC Admin
              </Link>
              {title ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{title}</div> : null}
              {subtitle ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {mainLinks.map((link) => {
                const active =
                  url === link.href ||
                  (link.href === '/admin/home?tab=home' && isContent) ||
                  activePath === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-emerald-700 text-white dark:bg-blue-600'
                        : 'border bg-white hover:bg-slate-100 dark:border-white/10 dark:bg-[#171b25] dark:hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                    {link.href === '/admin/inquiries' && newInquiryCount > 0 ? ` (${newInquiryCount})` : ''}
                  </Link>
                );
              })}

              <NotificationBell />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenProfile((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-[#171b25] dark:hover:bg-white/10"
                >
                  <span>{user?.name ?? 'User'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {openProfile ? (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#171b25]">
                    <div className="rounded-xl border bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-[#11151d]">
                      <div className="text-sm font-semibold">{user?.name ?? 'User'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300">{user?.email ?? ''}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.post('/logout')}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {isContent ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {sectionTabs.map((tab) => {
                const active = url === tab.href;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'border bg-white hover:bg-slate-100 dark:border-white/10 dark:bg-[#171b25] dark:hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
