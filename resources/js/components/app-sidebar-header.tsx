import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import NotificationBell from '@/components/layout/NotificationBell';
import {
  backendBookingCreateHref,
  backendCalendarHref,
  backendHomeHref,
  backendRoleEyebrow,
  backendRoleLabel,
  getBackendRole,
} from '@/lib/backend-navigation';
import type { BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type AuthUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  role_name?: string | null;
};

type SharedProps = {
  auth?: {
    user?: AuthUser | null;
  };
};

const easeLuxury = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function resolveTitle(breadcrumbs: BreadcrumbItem[]) {
  if (breadcrumbs.length > 0) {
    return breadcrumbs[breadcrumbs.length - 1]?.title ?? 'Workspace';
  }

  return 'Workspace';
}

function initials(name?: string | null) {
  if (!name) {
    return 'BC';
  }

  const parts = name.trim().split(/\s+/).slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'BC';
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between border border-white/10 bg-white/[0.055] px-4 py-4 text-sm font-semibold text-white/82 transition hover:border-[#f4dfad]/35 hover:text-[#f4dfad]"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
  const page = usePage<SharedProps>();
  const role = getBackendRole(page.props.auth as any);
  const user = page.props.auth?.user;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const title = resolveTitle(breadcrumbs);
  const homeHref = backendHomeHref(role);
  const bookingHref = backendBookingCreateHref(role);
  const calendarHref = backendCalendarHref(role);

  const breadcrumbTrail = useMemo(
    () => breadcrumbs.filter((item) => item.title),
    [breadcrumbs],
  );

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [page.url]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const logout = () => {
    router.post('/logout');
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-header)] px-3 py-3 shadow-[0_16px_60px_rgba(27,23,18,0.08)] backdrop-blur-2xl sm:px-4 lg:px-6 xl:px-8">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] text-[var(--bccc-backend-text)] shadow-[var(--bccc-backend-shadow-soft)] transition hover:border-[var(--bccc-backend-gold-line)] lg:hidden"
              aria-label="Open workspace menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden h-11 w-px bg-[var(--bccc-backend-line)] lg:block" />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.09)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-backend-gold)]">
                  {backendRoleLabel(role)}
                </span>

                <span className="hidden text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-backend-muted)] sm:inline">
                  {backendRoleEyebrow(role)}
                </span>
              </div>

              <h1 className="mt-1 truncate text-xl font-semibold tracking-[-0.045em] text-[var(--bccc-backend-text)] sm:text-2xl">
                {title}
              </h1>

              {breadcrumbTrail.length > 1 ? (
                <nav
                  className="mt-1 hidden items-center gap-1 text-xs text-[var(--bccc-backend-muted)] md:flex"
                  aria-label="Breadcrumb"
                >
                  {breadcrumbTrail.map((item, index) => {
                    const last = index === breadcrumbTrail.length - 1;

                    return (
                      <span key={`${item.href}-${index}`} className="inline-flex items-center gap-1">
                        {item.href && !last ? (
                          <Link
                            href={item.href}
                            className="transition hover:text-[var(--bccc-backend-gold)]"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className={cx(last && 'text-[var(--bccc-backend-text)]')}>
                            {item.title}
                          </span>
                        )}

                        {!last ? <span className="opacity-40">/</span> : null}
                      </span>
                    );
                  })}
                </nav>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label className="hidden h-11 min-w-[14rem] items-center gap-3 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-3 text-[var(--bccc-backend-muted)] shadow-[var(--bccc-backend-shadow-soft)] xl:flex">
              <Search className="h-4 w-4 shrink-0 text-[var(--bccc-backend-gold)]" />
              <input
                placeholder="Search workspace"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--bccc-backend-text)] outline-none placeholder:text-[var(--bccc-backend-muted)]/70"
              />
            </label>

            <Link
              href={homeHref}
              className="hidden h-11 items-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-muted)] shadow-[var(--bccc-backend-shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)] hover:text-[var(--bccc-backend-text)] md:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
              Dashboard
            </Link>

            <Link
              href={calendarHref}
              className="hidden h-11 items-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--bccc-backend-muted)] shadow-[var(--bccc-backend-shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)] hover:text-[var(--bccc-backend-text)] lg:inline-flex"
            >
              <CalendarDays className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
              Calendar
            </Link>

            <Link
              href={bookingHref}
              className="hidden h-11 items-center gap-2 border border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-green-800)] px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[var(--bccc-backend-shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[var(--bccc-green-900)] sm:inline-flex"
            >
              <BookOpenCheck className="h-4 w-4" />
              New Booking
            </Link>

            <NotificationBell />
            <AppearanceToggleDropdown />

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="inline-flex h-11 items-center gap-2 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] px-2.5 text-[var(--bccc-backend-text)] shadow-[var(--bccc-backend-shadow-soft)] transition hover:border-[var(--bccc-backend-gold-line)]"
                aria-expanded={accountOpen}
                aria-label="Open account menu"
              >
                <span className="flex h-7 min-w-7 items-center justify-center border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.11)] px-2 text-[10px] font-black uppercase text-[var(--bccc-backend-gold)]">
                  {initials(user?.name)}
                </span>

                <span className="hidden max-w-[9rem] truncate text-left text-xs font-semibold lg:block">
                  {user?.name || backendRoleLabel(role)}
                </span>

                <ChevronDown className={cx('h-3.5 w-3.5 text-[var(--bccc-backend-muted)] transition', accountOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {accountOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.985, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 8, scale: 0.985, filter: 'blur(8px)' }}
                    transition={{ duration: 0.24, ease: easeLuxury }}
                    className="absolute right-0 top-[calc(100%+0.65rem)] w-[19rem] border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-strong)] p-3 shadow-[var(--bccc-backend-shadow-strong)] backdrop-blur-2xl"
                  >
                    <div className="border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] p-4">
                      <p className="text-sm font-semibold text-[var(--bccc-backend-text)]">
                        {user?.name || backendRoleLabel(role)}
                      </p>
                      <p className="mt-1 truncate text-xs text-[var(--bccc-backend-muted)]">
                        {user?.email || 'BCCC workspace'}
                      </p>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-gold)]">
                        {backendRoleEyebrow(role)}
                      </p>
                    </div>

                    <div className="mt-2 grid gap-2">
                      <Link
                        href="/"
                        className="flex items-center justify-between border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 py-3 text-sm font-semibold text-[var(--bccc-backend-muted)] transition hover:border-[var(--bccc-backend-gold-line)] hover:text-[var(--bccc-backend-text)]"
                      >
                        Public Website
                        <Globe2 className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={logout}
                        className="flex items-center justify-between border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-4 py-3 text-sm font-semibold text-[var(--bccc-backend-muted)] transition hover:border-rose-300/40 hover:text-rose-600 dark:hover:text-rose-200"
                      >
                        Logout
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-[120] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: easeLuxury }}
          >
            <button
              type="button"
              aria-label="Close workspace menu"
              className="absolute inset-0 bg-black/64 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              initial={{ opacity: 0, x: -34, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -28, filter: 'blur(10px)' }}
              transition={{ duration: 0.34, ease: easeLuxury }}
              className="absolute bottom-0 left-0 top-0 flex w-full max-w-[25rem] flex-col overflow-y-auto border-r border-white/12 bg-[#080906]/94 p-4 text-white shadow-[0_30px_100px_rgba(0,0,0,0.44)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f4dfad]">
                    BCCC EASE
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.04em]">
                    {backendRoleLabel(role)} Workspace
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close workspace menu"
                  className="inline-flex h-11 w-11 items-center justify-center border border-white/12 bg-white/[0.06] text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 border border-white/10 bg-white/[0.055] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#f4dfad]/30 bg-[#f4dfad]/12 text-xs font-black text-[#f4dfad]">
                    {initials(user?.name)}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user?.name || backendRoleLabel(role)}</p>
                    <p className="mt-1 truncate text-xs text-white/50">{user?.email || 'BCCC workspace'}</p>
                    <p className="mt-2 text-xs leading-5 text-white/62">{backendRoleEyebrow(role)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <MobileNavLink href={homeHref} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </MobileNavLink>

                <MobileNavLink href={calendarHref} onClick={() => setMobileOpen(false)}>
                  Calendar
                </MobileNavLink>

                <MobileNavLink href={bookingHref} onClick={() => setMobileOpen(false)}>
                  New Booking
                </MobileNavLink>

                <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>
                  Public Website
                </MobileNavLink>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center justify-between border border-white/10 bg-white/[0.055] px-4 py-4 text-sm font-semibold text-white/82 transition hover:border-rose-300/35 hover:text-rose-200"
                >
                  Logout
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
