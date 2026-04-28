import { RoleWorkspaceShell } from '@/components/role/role-workspace-shell';
import {
  currentWorkspaceRole,
  normalizeAdminResourceRole,
  resourceTone,
  roleHomeHref,
  type AdminResourceRole,
} from '@/lib/admin-resource-ui';
import type { BreadcrumbItem } from '@/types';
import type { ReactNode } from 'react';

type ResourcePageShellProps = {
  role?: string | null;
  title: string;
  eyebrow?: string;
  description: string;
  current: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function ResourcePageShell({
  role,
  title,
  eyebrow,
  description,
  current,
  children,
  actions,
}: ResourcePageShellProps) {
  const normalizedRole = normalizeAdminResourceRole(role ?? currentWorkspaceRole());
  const tone = resourceTone(normalizedRole);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: tone.label,
      href: roleHomeHref(normalizedRole),
    },
    {
      title: current,
      href:
        normalizedRole === 'admin'
          ? `/admin/${current.toLowerCase().replace(/\s+/g, '-')}`
          : normalizedRole === 'manager'
            ? `/manager/${current.toLowerCase().replace(/\s+/g, '-')}`
            : roleHomeHref(normalizedRole),
    },
  ];

  return (
    <RoleWorkspaceShell
      role={normalizedRole as AdminResourceRole}
      title={title}
      eyebrow={eyebrow ?? tone.eyebrow}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={actions}
    >
      {children}
    </RoleWorkspaceShell>
  );
}
