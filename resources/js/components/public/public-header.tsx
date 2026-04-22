import { Link, router, usePage } from '@inertiajs/react';
import { BookUser, CalendarDays, LayoutDashboard, Menu, PhoneCall, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ThemeToggle from '@/components/public/theme-toggle';
import {
  adminWorkspaceLinks,
  getWorkspaceBadgeText,
  getWorkspaceModeLabel,
  getWorkspaceSummary,
  hasBackendWorkspaceAccess,
  standardAccountLinks,
  type WorkspaceAuthLike,
} from '@/lib/workspace';

type SharedProps = {
  auth?: WorkspaceAuthLike;
};

const leftNavItems = [
  { label: 'Home', href: '/' },
  { label: 'Facilities', href: '/facilities' },
  { label: 'Events', href: '/events' },
  { label: 'Calendar', href: '/calendar' },
];

const rightNavItems = [
  { label: 'Tourism Office', href: '/tourism-office' },
  { label: 'Contact', href: '/contact' },
];

const allNavItems = [...leftNavItems, ...rightNavItems];

function accountToneClass(isBackendCapable: boolean) {
  return isBackendCapable ? 'bg-[#0f8b6d] text-white dark:bg-[#294CFF]' : 'bg-white text-slate-900';
}

export default function PublicHeader() {
  const page = usePage<SharedProps>();
  const currentUrl = useMemo(() => page.url.split('?')[0], [page.url]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const auth = page.props.auth;
  const authUser = auth?.user;
  const isBackendCapable = hasBackendWorkspaceAccess(auth);
  const badgeText = getWorkspaceBadgeText(authUser?.name, auth);
  const workspaceLabel = getWorkspaceModeLabel(auth);
  const workspaceSummary = getWorkspaceSummary(auth);
  const workspaceLinks = isBackendCapable ? adminWorkspaceLinks : standardAccountLinks;

  useEffect(() => {
    if (!accountOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [accountOpen]);

  useEffect(() => {
    setAccountOpen(false);
    setMobileOpen(false);
  }, [currentUrl]);

  const isActive = (href: string) => {
    if (href === '/') return currentUrl === '/';
    return currentUrl === href || currentUrl.startsWith(`${href}/`);
  };

  const navClass = (href: string) =>
    `rounded-full px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.16em] transition lg:text-[14px] ${
      isActive(href)
        ? 'bg-white/18 text-white shadow-[0_8px_22px_rgba(15,23,42,0.15)]'
        : 'text-white/90 hover:bg-white/10 hover:text-white'
    }`;

  const handleLogout = () => {
    setAccountOpen(false);
    setMobileOpen(false);
    router.post('/logout');
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100]">
        <div className="w-full border-b border-white/10 bg-[linear-gradient(135deg,rgba(14,26,45,0.86),rgba(15,139,109,0.36))] shadow-[0_24px_70px_rgba(15,23,42,0.26)] backdrop-blur-xl dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.94),rgba(41,76,255,0.26))] dark:shadow-[0_24px_70px_rgba(2,8,23,0.48)]">
          <div className="relative flex min-h-[88px] w-full items-center justify-between gap-4 pl-3 pr-[118px] sm:pl-4 lg:min-h-[96px] lg:pl-5 lg:pr-[136px]">
            <div className="flex min-w-0 items-center gap-4 lg:gap-6">
              <Link href="/" className="shrink-0">
                <img
                  src="/marketing/images/logo/lightlogo.png"
                  alt="BCCC EASE"
                  className="h-12 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)] dark:hidden sm:h-14"
                />
                <img
                  src="/marketing/images/logo/darklogo.png"
                  alt="BCCC EASE"
                  className="hidden h-12 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.28)] dark:block sm:h-14"
                />
              </Link>

              <nav className="hidden items-center gap-1 xl:flex">
                {leftNavItems.map((item) => (
                  <Link key={item.href} href={item.href} className={navClass(item.href)}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="hidden items-center gap-2 pr-8 xl:flex">
              {rightNavItems.map((item) => (
                <Link key={item.href} href={item.href} className={navClass(item.href)}>
                  {item.label}
                </Link>
              ))}

              <ThemeToggle />

              {authUser ? (
                <div ref={accountRef} className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((prev) => !prev)}
                    aria-expanded={accountOpen}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-2 text-white backdrop-blur-md transition hover:bg-white/15"
                    title={isBackendCapable ? 'Open frontend/backend workspace menu' : 'Open account menu'}
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-black tracking-[0.16em] ${accountToneClass(isBackendCapable)}`}
                    >
                      {badgeText}
                    </span>
                    <span className="pr-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">{workspaceLabel}</span>
                    <LayoutDashboard className="h-4 w-4" />
                  </button>

                  {accountOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.85rem)] w-[380px] overflow-hidden rounded-[1.8rem] border border-white/15 bg-[#0d1726]/95 p-4 text-white shadow-[0_32px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl dark:bg-[#070c16]/96">
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-black tracking-[0.18em] ${accountToneClass(isBackendCapable)}`}
                          >
                            {badgeText}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold">{authUser.name || 'Account'}</div>
                            <div className="truncate text-xs text-white/70">{authUser.email || ''}</div>
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/76">
                          {workspaceSummary}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {workspaceLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setAccountOpen(false)}
                            className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4 transition hover:-translate-y-0.5 hover:bg-white/10"
                          >
                            <div className="text-sm font-bold">{link.label}</div>
                            <div className="mt-1 text-xs leading-5 text-white/70">{link.description}</div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href="/"
                          onClick={() => setAccountOpen(false)}
                          className="inline-flex flex-1 items-center justify-center rounded-full border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/88 transition hover:bg-white/10"
                        >
                          Public Website
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-900 transition hover:opacity-90"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Link
              href="/bookings/create"
              className="absolute right-0 top-0 z-[110] hidden h-[116px] w-[118px] flex-col items-center justify-center gap-2 bg-[#0f8b6d] px-4 text-center text-[12px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_22px_55px_rgba(15,139,109,0.36)] transition hover:opacity-95 dark:bg-[#294CFF] dark:shadow-[0_22px_55px_rgba(41,76,255,0.34)] xl:flex lg:h-[122px] lg:w-[136px]"
            >
              <CalendarDays className="h-5 w-5" />
              <span className="leading-tight">
                Book
                <br />
                Your
                <br />
                Event
              </span>
            </Link>

            <div className="flex items-center gap-2 pr-3 sm:pr-4 xl:hidden">
              <ThemeToggle />

              {authUser ? (
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-[11px] font-black tracking-[0.16em] text-white ${
                    isBackendCapable ? 'bg-white/12' : 'bg-white/10'
                  }`}
                  title={isBackendCapable ? 'Open frontend/backend account menu' : 'Open account menu'}
                >
                  {badgeText}
                </button>
              ) : null}

              <Link
                href="/bookings/create"
                className="hidden items-center gap-2 rounded-full bg-[#0f8b6d] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white dark:bg-[#294CFF] sm:inline-flex"
              >
                <CalendarDays className="h-4 w-4" />
                Book
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[120] xl:hidden">
          <div className="absolute inset-0 bg-slate-950/68 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-[#f7f4ec] p-5 dark:bg-[#0b1220]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <img src="/marketing/images/logo/lightlogo.png" alt="BCCC EASE" className="h-12 w-auto object-contain dark:hidden" />
              <img src="/marketing/images/logo/darklogo.png" alt="BCCC EASE" className="hidden h-12 w-auto object-contain dark:block" />

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {authUser ? (
              <div className="mb-4 rounded-[1.4rem] bg-[#174f40] px-4 py-4 text-white dark:bg-[#294CFF]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black tracking-[0.18em] text-slate-900">
                      {badgeText}
                    </span>
                    <div>
                      <div className="text-sm font-bold">{authUser.name || 'Account'}</div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/78">{workspaceSummary}</div>
                    </div>
                  </div>
                  <LayoutDashboard className="h-4 w-4" />
                </div>

                <div className="mt-4 grid gap-2">
                  {workspaceLinks.slice(0, isBackendCapable ? 6 : 2).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-[1.1rem] bg-white/12 px-4 py-3 text-sm font-semibold"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-[1.2rem] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition ${
                    isActive(item.href)
                      ? 'bg-[#0f8b6d] text-white dark:bg-[#294CFF]'
                      : 'bg-white text-slate-800 dark:bg-white/5 dark:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <Link
                href="/bookings/create"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-[#0f8b6d] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-white dark:bg-[#294CFF]"
              >
                <CalendarDays className="h-4 w-4" />
                Book Your Event
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-black/10 px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-white/10 dark:text-white"
              >
                <PhoneCall className="h-4 w-4" />
                Contact Office
              </Link>

              {authUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-black/10 bg-white px-5 py-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <BookUser className="h-4 w-4" />
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}