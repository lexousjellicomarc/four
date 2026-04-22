export type WorkspaceRoleLike = string | { name?: string | null } | null | undefined;

export type WorkspaceAuthLike = {
  user?: {
    name?: string | null;
    email?: string | null;
    roles?: WorkspaceRoleLike[] | null;
    permissions?: string[] | null;
  } | null;
  roles?: WorkspaceRoleLike[] | null;
  permissions?: string[] | null;
} | null | undefined;

export type WorkspaceLink = {
  label: string;
  href: string;
  description: string;
};

export const frontendWorkspaceLinks: WorkspaceLink[] = [
  {
    label: 'Frontend Dashboard',
    href: '/admin/dashboard',
    description: 'Admin overview for the public-facing site.',
  },
  {
    label: 'Configure Frontend',
    href: '/admin/home?tab=home',
    description: 'Edit public-site sections and content blocks.',
  },
  {
    label: 'Open Public Website',
    href: '/',
    description: 'Review the live marketing website.',
  },
];

export const backendWorkspaceLinks: WorkspaceLink[] = [
  {
    label: 'Booking Dashboard',
    href: '/dashboard',
    description: 'Shared booking month board and monitoring tools.',
  },
  {
    label: 'Manage Calendar',
    href: '/calendar/manage',
    description: 'Calendar blocks, notes, and multi-day control.',
  },
  {
    label: 'MICE Survey & Registry',
    href: '/reports/mice-registry',
    description: 'Survey-linked MICE entries and reports.',
  },
  {
    label: 'Inquiries',
    href: '/admin/inquiries',
    description: 'Public inquiry inbox for admin and manager roles.',
  },
  {
    label: 'Guidelines & Contacts',
    href: '/admin/guidelines-contacts',
    description: 'Backend rules, forms, contacts, and references.',
  },
];

export const adminWorkspaceLinks: WorkspaceLink[] = [
  {
    label: 'Frontend Admin',
    href: '/admin/home?tab=home',
    description: 'Public-site content configuration.',
  },
  {
    label: 'Backend Dashboard',
    href: '/admin/dashboard',
    description: 'Unified admin overview and shortcuts.',
  },
  {
    label: 'Booking Calendar',
    href: '/dashboard',
    description: 'Backend booking calendar board.',
  },
  {
    label: 'Manage Calendar Center',
    href: '/calendar/manage',
    description: 'Blocks, notes, and day control.',
  },
  {
    label: 'MICE Registry',
    href: '/reports/mice-registry',
    description: 'Built-in survey and report registry.',
  },
  {
    label: 'Inquiries',
    href: '/admin/inquiries',
    description: 'Public inquiry inbox for admins.',
  },
  {
    label: 'Guidelines & Contacts',
    href: '/admin/guidelines-contacts',
    description: 'Backend reference copy and contacts.',
  },
];

export const standardAccountLinks: WorkspaceLink[] = [
  {
    label: 'My Dashboard',
    href: '/dashboard',
    description: 'My booking calendar and records.',
  },
  {
    label: 'Create Booking',
    href: '/bookings/create',
    description: 'Start a new booking request.',
  },
];

export function normalizeRoleNames(auth: WorkspaceAuthLike): string[] {
  const raw = auth?.roles ?? auth?.user?.roles ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((role) => {
      if (typeof role === 'string') return role;
      if (role && typeof role === 'object' && typeof role.name === 'string') return role.name;
      return '';
    })
    .filter(Boolean)
    .map((role) => String(role).trim().toLowerCase());
}

export function normalizePermissions(auth: WorkspaceAuthLike): string[] {
  const raw = auth?.permissions ?? auth?.user?.permissions ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((permission) => String(permission).trim().toLowerCase()).filter(Boolean);
}

export function hasBackendWorkspaceAccess(auth: WorkspaceAuthLike): boolean {
  const roles = normalizeRoleNames(auth);
  return roles.some((role) => ['admin', 'manager', 'staff'].includes(role));
}

export function canManageCalendarBlocks(auth: WorkspaceAuthLike): boolean {
  const roles = normalizeRoleNames(auth);
  return roles.some((role) => ['admin', 'manager'].includes(role));
}

export function getWorkspaceBadgeText(name?: string | null, auth?: WorkspaceAuthLike): string {
  if (hasBackendWorkspaceAccess(auth)) return 'BA';

  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'US';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

export function getWorkspaceModeLabel(auth: WorkspaceAuthLike): string {
  return hasBackendWorkspaceAccess(auth) ? 'Frontend + Backend' : 'Account';
}

export function getWorkspaceSummary(auth: WorkspaceAuthLike): string {
  return hasBackendWorkspaceAccess(auth)
    ? 'Same login session for frontend configuration and backend booking tools.'
    : 'Signed-in booking account.';
}
