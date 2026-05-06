import {
    backendAdminConfigNav,
    backendExternalNav,
    backendHomeHref,
    backendMainNav,
    backendRoleEyebrow,
    backendRoleLabel,
    getBackendRole,
    isBackendActive,
    userHasPermission,
    type BackendNavItem,
  } from '@/lib/backend-navigation';
  import { Link, usePage } from '@inertiajs/react';
  import {
    ArrowUpRight,
    Building2,
    ChevronRight,
    Globe2,
    LayoutDashboard,
    Sparkles,
  } from 'lucide-react';
  import type { LucideIcon } from 'lucide-react';

  type AuthUser = {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    role_name?: string | null;
    permissions?: string[];
  };

  type SharedProps = {
    auth?: {
      user?: AuthUser | null;
      permissions?: string[];
    };
  };

  function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
  }

  function initials(name?: string | null) {
    if (!name) {
      return 'BC';
    }

    const parts = name.trim().split(/\s+/).slice(0, 2);

    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'BC';
  }

  function NavGroup({
    label,
    items,
    currentUrl,
    permissions,
  }: {
    label: string;
    items: BackendNavItem[];
    currentUrl: string;
    permissions: string[];
  }) {
    const visibleItems = items.filter((item) => userHasPermission(permissions, item.permission));

    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <section className="bccc-backend-nav-group">
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.26em] text-[var(--bccc-backend-muted)]">
          {label}
        </p>

        <div className="grid gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon as LucideIcon | undefined;
            const active = isBackendActive(currentUrl, item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  'group relative flex min-h-11 items-center gap-3 overflow-hidden border px-3 text-sm font-semibold transition duration-500',
                  active
                    ? 'border-[var(--bccc-backend-gold-line)] bg-[var(--bccc-backend-active)] text-[var(--bccc-backend-text)] shadow-[var(--bccc-backend-shadow-soft)]'
                    : 'border-transparent text-[var(--bccc-backend-muted)] hover:border-[var(--bccc-backend-line)] hover:bg-[var(--bccc-backend-hover)] hover:text-[var(--bccc-backend-text)]',
                )}
              >
                <span
                  className={cx(
                    'flex h-8 w-8 shrink-0 items-center justify-center border transition duration-500',
                    active
                      ? 'border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.14)] text-[var(--bccc-backend-gold)]'
                      : 'border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] text-[var(--bccc-backend-muted)] group-hover:border-[var(--bccc-backend-gold-line)] group-hover:text-[var(--bccc-backend-gold)]',
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>

                <span className="min-w-0 flex-1 truncate">{item.title}</span>

                {active ? (
                  <span className="h-2 w-2 shrink-0 bg-[var(--bccc-backend-gold)]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-60" />
                )}

                <span className="pointer-events-none absolute inset-y-2 left-0 w-px bg-[var(--bccc-backend-gold)] opacity-0 transition duration-500 group-hover:opacity-60" />
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  export function AppSidebar() {
    const page = usePage<SharedProps>();
    const role = getBackendRole(page.props.auth as any);
    const user = page.props.auth?.user;
    const permissions = [
      ...((page.props.auth?.permissions ?? []) as string[]),
      ...((user?.permissions ?? []) as string[]),
    ];

    const mainNav = backendMainNav(role);
    const configNav = backendAdminConfigNav(role);
    const quickLinks = backendExternalNav(role);

    return (
      <aside className="bccc-backend-sidebar sticky top-0 hidden h-screen w-[18.5rem] shrink-0 border-r border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-sidebar)] px-3 py-4 shadow-[18px_0_70px_rgba(27,23,18,0.08)] backdrop-blur-2xl lg:flex lg:flex-col">
        <Link
          href={backendHomeHref(role)}
          className="group mb-4 flex items-center gap-3 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-3 shadow-[var(--bccc-backend-shadow-soft)] transition duration-500 hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)]"
        >
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.12)] text-[var(--bccc-backend-gold)]">
            <Building2 className="h-5 w-5" />
            <span className="absolute inset-x-2 bottom-2 h-px bg-[var(--bccc-backend-gold)] opacity-40" />
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-black uppercase tracking-[0.22em] text-[var(--bccc-backend-text)]">
              BCCC EASE
            </span>
            <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--bccc-backend-muted)]">
              Events Access
            </span>
          </span>
        </Link>

        <div className="mb-4 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-4 shadow-[var(--bccc-backend-shadow-soft)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--bccc-backend-gold-line)] bg-[rgba(169,132,67,0.11)] text-xs font-black uppercase tracking-[0.08em] text-[var(--bccc-backend-gold)]">
              {initials(user?.name)}
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--bccc-backend-gold)]">
                {backendRoleEyebrow(role)}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--bccc-backend-text)]">
                {user?.name || backendRoleLabel(role)}
              </p>
              <p className="mt-1 truncate text-xs text-[var(--bccc-backend-muted)]">
                {user?.email || 'BCCC workspace'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--bccc-backend-line)] pt-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--bccc-backend-muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--bccc-backend-gold)]" />
              {backendRoleLabel(role)}
            </span>

            <span className="border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
              Active
            </span>
          </div>
        </div>

        <div className="bccc-hidden-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          <NavGroup
            label="Workspace"
            items={mainNav}
            currentUrl={page.url}
            permissions={permissions}
          />

          <NavGroup
            label="Configuration"
            items={configNav}
            currentUrl={page.url}
            permissions={permissions}
          />

          <NavGroup
            label="Quick Links"
            items={quickLinks}
            currentUrl={page.url}
            permissions={permissions}
          />
        </div>

        <div className="mt-4 grid gap-2 border-t border-[var(--bccc-backend-line)] pt-4">
          <Link
            href="/"
            className="group flex min-h-11 items-center gap-3 border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel-muted)] px-3 text-sm font-semibold text-[var(--bccc-backend-muted)] transition duration-500 hover:-translate-y-0.5 hover:border-[var(--bccc-backend-gold-line)] hover:text-[var(--bccc-backend-text)]"
          >
            <Globe2 className="h-4 w-4 text-[var(--bccc-backend-gold)]" />
            Public Website
            <ArrowUpRight className="ml-auto h-4 w-4 opacity-50 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </Link>
        </div>
      </aside>
    );
  }
