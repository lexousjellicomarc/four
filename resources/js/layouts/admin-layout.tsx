import type { PropsWithChildren } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRightLeft, ChevronDown, LogOut, PanelsTopLeft, ServerCog } from 'lucide-react';
import { useMemo, useState } from 'react';
import NotificationBell from '@/components/layout/NotificationBell';
import {
  backendWorkspaceLinks,
  frontendWorkspaceLinks,
  getWorkspaceBadgeText,
  getWorkspaceSummary,
  type WorkspaceAuthLike,
} from '@/lib/workspace';

type AuthUser = {
  name?: string;
  email?: string;
};

type PageProps = {
  auth?: WorkspaceAuthLike & {
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

function groupLinkClass(active: boolean) {
  return active
    ? 'bg-emerald-700 text-white dark:bg-blue-600'
    : 'border bg-white hover:bg-slate-100 dark:border-white/10 dark:bg-[#171b25] dark:hover:bg-white/10';
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const page = usePage<PageProps>();
  const user = page.props.auth?.user;
  const url = page.url;
  const [openProfile, setOpenProfile] = useState(false);

  const activePath = useMemo(() => url.split('?')[0], [url]);
  const isContent = url.startsWith('/admin/home');
  const newInquiryCount = Number(page.props.adminInquiryCounts?.new ?? 0);
  const badgeText = getWorkspaceBadgeText(user?.name, page.props.auth);
  const workspaceSummary = getWorkspaceSummary(page.props.auth);

  const isActiveLink = (href: string) =>
    url === href || activePath === href || (href === '/admin/home?tab=home' && isContent);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f1117] dark:text-white">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#12161f]/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Unified admin session
                </div>
                <Link href="/admin/home?tab=home" className="mt-3 block text-2xl font-black tracking-tight">
                  BCCC Admin Workspace
                </Link>
                <div className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                  Frontend configuration and backend booking tools now live in one workspace so staff can move between
                  public-site content and operational pages without using a second login.
                </div>
                {title ? <div className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</div> : null}
                {subtitle ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <NotificationBell />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenProfile((prev) => !prev)}
                    className="inline-flex items-center gap-3 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-[#171b25] dark:hover:bg-white/10"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-black tracking-[0.16em] text-white dark:bg-blue-600">
                      {badgeText}
                    </span>
                    <span>{user?.name ?? 'User'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {openProfile ? (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#171b25]">
                      <div className="rounded-xl border bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-[#11151d]">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-sm font-black tracking-[0.16em] text-white dark:bg-blue-600">
                            {badgeText}
                          </span>
                          <div>
                            <div className="text-sm font-semibold">{user?.name ?? 'User'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-300">{user?.email ?? ''}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl border border-dashed border-black/10 px-3 py-3 text-xs leading-6 text-slate-600 dark:border-white/10 dark:text-slate-300">
                        {workspaceSummary}
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

            <div className="grid gap-3 xl:grid-cols-2">
              <div className="rounded-[1.6rem] border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#16171b]">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eef7f4] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                  <PanelsTopLeft className="h-3.5 w-3.5" />
                  Frontend workspace
                </div>
                <div className="flex flex-wrap gap-2">
                  {frontendWorkspaceLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${groupLinkClass(isActiveLink(link.href))}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#16171b]">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff4d6] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#7c5d00] dark:bg-[#2f2411] dark:text-[#f1cf76]">
                  <ServerCog className="h-3.5 w-3.5" />
                  Backend workspace
                </div>
                <div className="flex flex-wrap gap-2">
                  {backendWorkspaceLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${groupLinkClass(isActiveLink(link.href))}`}
                    >
                      {link.label}
                      {link.href === '/admin/inquiries' && newInquiryCount > 0 ? ` (${newInquiryCount})` : ''}
                    </Link>
                  ))}
                </div>
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
