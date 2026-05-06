import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ReactNode } from 'react';

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  activeTab?: string;
  activeSection?: string;
  breadcrumbs?: BreadcrumbItem[];
};

export default function AdminLayout({
  children,
  title = 'Admin Workspace',
  subtitle,
  description,
  eyebrow = 'Backend Operations',
  actions,
  breadcrumbs = [{ title: 'Admin', href: '/admin/dashboard' }],
}: AdminLayoutProps) {
  const resolvedBreadcrumbs =
    breadcrumbs.length > 0
      ? breadcrumbs
      : [{ title: 'Admin', href: '/admin/dashboard' }, { title, href: '#' }];

  return (
    <AppLayout breadcrumbs={resolvedBreadcrumbs}>
      <section className="mb-5 overflow-hidden border border-[var(--bccc-backend-line)] bg-[var(--bccc-backend-panel)] p-5 shadow-[var(--bccc-backend-shadow-soft)] backdrop-blur-xl sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--bccc-backend-gold)]">
              {eyebrow}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[var(--bccc-backend-text)] sm:text-4xl">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-2 text-sm font-semibold text-[var(--bccc-backend-text)]">
                {subtitle}
              </p>
            ) : null}

            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--bccc-backend-muted)]">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
        </div>
      </section>

      {children}
    </AppLayout>
  );
}
