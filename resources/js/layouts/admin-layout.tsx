import type { PropsWithChildren } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  BellDot,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MonitorCog,
  PanelsTopLeft,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type AuthUser = {
  name?: string;
  email?: string;
};

type PageProps = {
  auth?: {
    user?: AuthUser;
  };
  adminInquiryCounts?: {
    total?: number;
    new?: number;
  };
};

type AdminLayoutProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

const configItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Home Config', href: '/admin/home?tab=home', icon: PanelsTopLeft },
  { label: 'Facilities Config', href: '/admin/home?tab=facilities', icon: PanelsTopLeft },
  { label: 'Events Config', href: '/admin/home?tab=events', icon: PanelsTopLeft },
  { label: 'Calendar Config', href: '/admin/home?tab=calendar', icon: PanelsTopLeft },
  { label: 'Tourism Office Config', href: '/admin/home?tab=tourism-office', icon: PanelsTopLeft },
  { label: 'Contact / Site Config', href: '/admin/home?tab=contact', icon: PanelsTopLeft },
];

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const page = usePage<PageProps>();
  const user = page.props.auth?.user;
  const inquiryCounts = page.props.adminInquiryCounts;
  const currentUrl = page.url;
  const [openProfile, setOpenProfile] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);

  const activePath = useMemo(() => currentUrl.split('?')[0], [currentUrl]);
  const newInquiryCount = Number(inquiryCounts?.new ?? 0);
  const isConfigActive = currentUrl.startsWith('/admin/home') || currentUrl.startsWith('/admin/dashboard');

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-[#22221f] dark:bg-[#0f1014] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#121318]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="min-w-[140px]">
              <div className="text-xs font-semibold uppercase tracking-[0.34em] text-[#174f40] dark:text-[#8ea3ff]">
                BCCC
              </div>
              <div className="mt-1 text-xl font-semibold">Frontend Admin</div>
              <div className="text-sm text-slate-500 dark:text-slate-300">
                Public site control panel
              </div>
            </Link>

            <nav className="hidden items-center gap-3 lg:flex">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenConfig((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isConfigActive
                      ? 'bg-[#174f40] text-white dark:bg-[#2d47ff]'
                      : 'border border-black/10 bg-white text-[#1f1f1c] hover:bg-slate-50 dark:border-white/10 dark:bg-[#17181c] dark:text-white dark:hover:bg-white/10'
                  }`}
                >
                  <MonitorCog className="h-4 w-4" />
                  Config
                  <ChevronDown className="h-4 w-4" />
                </button>

                {openConfig && (
                  <div className="absolute left-0 top-full mt-3 w-72 rounded-[1.5rem] border border-black/10 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#17181c]">
                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                      Open one section at a time
                    </div>
                    <div className="space-y-1">
                      {configItems.map((item) => {
                        const Icon = item.icon;
                        const active = currentUrl === item.href || currentUrl.startsWith(`${item.href}&`) || currentUrl.startsWith(`${item.href}?`);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenConfig(false)}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                              active
                                ? 'bg-[#174f40] text-white dark:bg-[#2d47ff]'
                                : 'hover:bg-slate-50 dark:hover:bg-white/10'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/admin/inquiries"
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activePath === '/admin/inquiries'
                    ? 'bg-[#174f40] text-white dark:bg-[#2d47ff]'
                    : 'border border-black/10 bg-white text-[#1f1f1c] hover:bg-slate-50 dark:border-white/10 dark:bg-[#17181c] dark:text-white dark:hover:bg-white/10'
                }`}
              >
                <BellDot className="h-4 w-4" />
                Inquiries
                {newInquiryCount > 0 ? (
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {newInquiryCount}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#17181c] dark:text-white dark:hover:bg-white/10"
              >
                <SquareArrowOutUpRight className="h-4 w-4" />
                Frontend
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#17181c] dark:text-white dark:hover:bg-white/10"
              >
                <SquareArrowOutUpRight className="h-4 w-4" />
                Backend Booking
              </Link>
            </nav>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenProfile((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#17181c] dark:text-white dark:hover:bg-white/10"
            >
              <span>{user?.name ?? 'Admin User'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {openProfile && (
              <div className="absolute right-0 mt-3 w-64 rounded-[1.5rem] border border-black/10 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#17181c]">
                <div className="rounded-2xl border border-black/5 bg-[#f7f5ef] px-4 py-3 dark:border-white/10 dark:bg-[#121318]">
                  <div className="text-sm font-semibold">{user?.name ?? 'Authenticated User'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-300">{user?.email ?? ''}</div>
                </div>

                <button
                  type="button"
                  onClick={() => router.post('/logout')}
                  className="mt-3 inline-flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {(title || subtitle) && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318] sm:p-8">
            {title ? <h1 className="text-3xl font-semibold tracking-tight">{title}</h1> : null}
            {subtitle ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{subtitle}</p>
            ) : null}
          </div>
        </section>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
