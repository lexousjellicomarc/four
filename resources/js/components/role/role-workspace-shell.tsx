import AppLayout from '@/layouts/app-layout';
import { getRoleTheme, type RoleThemeKey } from '@/lib/role-theme';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

type RoleWorkspaceShellProps = {
  role: RoleThemeKey | string;
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
};

export function RoleWorkspaceShell({
  role,
  title,
  eyebrow,
  description,
  breadcrumbs = [],
  actions,
  children,
}: RoleWorkspaceShellProps) {
  const theme = getRoleTheme(role);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={title} />

      <div className={`ease-role-shell min-h-[calc(100vh-4rem)] ${theme.shellClass}`}>
        <main className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <section className={`ease-role-hero relative overflow-hidden rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8 lg:p-10 ${theme.heroClass}`}>
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-current opacity-[0.055] blur-3xl" />
              <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-current opacity-[0.035] blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>

            <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
              <div className="max-w-5xl">
                <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.24em] ${theme.badgeClass}`}>
                  {eyebrow || theme.eyebrow}
                </div>

                <h1 className="mt-5 max-w-5xl text-3xl font-black leading-[0.95] tracking-[-0.055em] sm:text-4xl lg:text-5xl">
                  {title}
                </h1>

                {description ? (
                  <p className="mt-4 max-w-4xl text-base leading-7 opacity-70 sm:text-lg">
                    {description}
                  </p>
                ) : null}
              </div>

              {actions ? (
                <div className="flex flex-wrap items-center gap-3">
                  {actions}
                </div>
              ) : null}
            </div>
          </section>

          <section className="ease-role-content min-w-0 space-y-6">
            {children}
          </section>
        </main>
      </div>
    </AppLayout>
  );
}
