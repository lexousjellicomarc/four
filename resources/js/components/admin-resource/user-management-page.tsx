import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import {
  cleanLabel,
  compactDate,
  extractCollection,
  extractLinks,
} from '@/lib/admin-resource-ui';
import { Link, router, usePage } from '@inertiajs/react';
import {
  Edit3,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type UserRecord = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  organization_name?: string | null;
  position_title?: string | null;
  roles?: Array<string | { name?: string | null }>;
  created_at?: string | null;
  email_verified_at?: string | null;
};

type PageProps = {
  workspaceRole?: string;
  users?: unknown;
  filters?: {
    q?: string;
  };
};

function roleNames(user: UserRecord): string[] {
  if (!Array.isArray(user.roles)) return [];

  return user.roles
    .map((role) => (typeof role === 'string' ? role : role?.name))
    .filter(Boolean)
    .map((role) => String(role));
}

export function UserManagementPage() {
  const { props } = usePage<PageProps>();
  const users = useMemo(() => extractCollection<UserRecord>(props.users), [props.users]);
  const links = extractLinks(props.users);
  const [q, setQ] = useState(String(props.filters?.q ?? ''));

  function destroy(user: UserRecord) {
    const confirmed = window.confirm(
      `Delete user "${user.name || user.email}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    router.delete(`/admin/users/${user.id}`, {
      preserveScroll: true,
    });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    router.get(
      '/admin/users',
      { q: q || undefined },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
      },
    );
  }

  return (
    <ResourcePageShell
      role={props.workspaceRole}
      title="Users & Roles"
      current="Users"
      description="Manage account access for administrators, managers, staff, and client users. Keep this page restricted to administrators only."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/users/create"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
          >
            <Plus className="mr-2 h-4 w-4" />
            New User
          </Link>

          <Link
            href="/admin/users/roles"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Role Matrix
          </Link>
        </div>
      }
    >
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-sm backdrop-blur">
        <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
              System Accounts
            </p>
            <h3 className="mt-1 text-xl font-black">
              {users.length} user{users.length === 1 ? '' : 's'}
            </h3>
          </div>

          <form onSubmit={search} className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 pl-11 pr-4 text-sm outline-none focus:border-white/25"
              placeholder="Search users..."
            />
          </form>
        </div>

        {users.length > 0 ? (
          <div className="divide-y divide-white/10">
            {users.map((user) => {
              const roles = roleNames(user);

              return (
                <div
                  key={user.id}
                  className="grid gap-4 p-5 transition hover:bg-white/[0.05] lg:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/15">
                        <UserRound className="h-5 w-5 opacity-70" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-lg font-black">{user.name || 'Unnamed User'}</p>
                        <p className="mt-1 text-sm opacity-65">{user.email}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {roles.length > 0 ? (
                            roles.map((role) => (
                              <span
                                key={role}
                                className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-80"
                              >
                                {cleanLabel(role)}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-100">
                              No role
                            </span>
                          )}

                          <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-70">
                            Created {compactDate(user.created_at)}
                          </span>

                          {user.email_verified_at ? (
                            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">
                              Verified
                            </span>
                          ) : (
                            <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-red-100">
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 lg:justify-end">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black transition hover:bg-white/15"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => destroy(user)}
                      className="inline-flex items-center rounded-full border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-400/15"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <UserRound className="mx-auto h-10 w-10 opacity-40" />
            <h3 className="mt-4 text-xl font-black">No users found</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 opacity-65">
              Create administrator, manager, staff, or client user accounts from here.
            </p>
          </div>
        )}

        {links.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-white/10 p-5">
            {links.map((link, index) =>
              link.url ? (
                <Link
                  key={`${link.label}-${index}`}
                  href={link.url}
                  preserveScroll
                  className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                    link.active
                      ? 'border-white/20 bg-white/15'
                      : 'border-white/10 bg-black/10 hover:bg-white/10'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label ?? '' }}
                />
              ) : (
                <span
                  key={`${link.label}-${index}`}
                  className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs font-bold opacity-40"
                  dangerouslySetInnerHTML={{ __html: link.label ?? '' }}
                />
              ),
            )}
          </div>
        ) : null}
      </section>
    </ResourcePageShell>
  );
}
