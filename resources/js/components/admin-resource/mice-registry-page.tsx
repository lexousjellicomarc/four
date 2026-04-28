import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import {
  cleanLabel,
  compactDate,
  currentWorkspaceRole,
  extractCollection,
  extractLinks,
  normalizeAdminResourceRole,
} from '@/lib/admin-resource-ui';
import { Link, router, usePage } from '@inertiajs/react';
import {
  Download,
  Edit3,
  FileBarChart,
  Plus,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type MiceRecord = {
  id: number | string;
  establishment_name?: string | null;
  business_type?: string | null;
  classification?: string | null;
  enterprise_group?: string | null;
  city_municipality?: string | null;
  province_huc?: string | null;
  region?: string | null;
  year_recorded?: number | string | null;
  month_added?: string | null;
  total_employees?: number | string | null;
  male_employees?: number | string | null;
  female_employees?: number | string | null;
  permit_to_engage?: boolean | number | string | null;
  dot_accredited?: boolean | number | string | null;
  active_member?: boolean | number | string | null;
  created_at?: string | null;
};

type PageProps = {
  workspaceRole?: string;
  records?: unknown;
  miceRecords?: unknown;
  registry?: unknown;
  filters?: {
    q?: string;
  };
};

function basePath(role: string) {
  if (role === 'manager') return '/manager/reports/mice-registry';
  return '/admin/reports/mice-registry';
}

function yesNo(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' ? 'Yes' : 'No';
}

export function MiceRegistryPage() {
  const { props } = usePage<PageProps>();
  const role = normalizeAdminResourceRole(props.workspaceRole ?? currentWorkspaceRole());
  const records = useMemo(
    () => extractCollection<MiceRecord>(props.records ?? props.miceRecords ?? props.registry),
    [props.records, props.miceRecords, props.registry],
  );
  const links = extractLinks(props.records ?? props.miceRecords ?? props.registry);
  const [q, setQ] = useState(String(props.filters?.q ?? ''));
  const path = basePath(role);
  const canMutate = role === 'admin';

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    router.get(
      path,
      { q: q || undefined },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
      },
    );
  }

  function destroy(record: MiceRecord) {
    const confirmed = window.confirm(
      `Delete MICE registry record "${record.establishment_name || record.id}"?`,
    );

    if (!confirmed) return;

    router.delete(`${path}/${record.id}`, {
      preserveScroll: true,
    });
  }

  return (
    <ResourcePageShell
      role={role}
      title="MICE Registry"
      current="Reports"
      eyebrow={role === 'manager' ? 'Management Report Review' : 'Executive MICE Reporting'}
      description="Review and manage MICE registry records, establishment details, employee counts, accreditation status, and reporting outputs."
      actions={
        <div className="flex flex-wrap gap-2">
          {canMutate ? (
            <Link
              href={`${path}/create`}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Record
            </Link>
          ) : null}

          <Link
            href={`${path}/print`}
            className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Link>

          <Link
            href={`${path}/export`}
            className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Link>
        </div>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
            Records
          </p>
          <p className="mt-3 text-3xl font-black">{records.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
            DOT Accredited
          </p>
          <p className="mt-3 text-3xl font-black">
            {records.filter((record) => yesNo(record.dot_accredited) === 'Yes').length}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
            Active Members
          </p>
          <p className="mt-3 text-3xl font-black">
            {records.filter((record) => yesNo(record.active_member) === 'Yes').length}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
            Employees
          </p>
          <p className="mt-3 text-3xl font-black">
            {records.reduce((sum, record) => sum + Number(record.total_employees ?? 0), 0)}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-sm backdrop-blur">
        <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
              Registry Records
            </p>
            <h3 className="mt-1 text-xl font-black">
              MICE report table
            </h3>
          </div>

          <form onSubmit={search} className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 pl-11 pr-4 text-sm outline-none focus:border-white/25"
              placeholder="Search registry..."
            />
          </form>
        </div>

        {records.length > 0 ? (
          <div className="divide-y divide-white/10">
            {records.map((record) => (
              <div
                key={record.id}
                className="grid gap-4 p-5 transition hover:bg-white/[0.05] xl:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/15">
                      <FileBarChart className="h-5 w-5 opacity-70" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-lg font-black">
                        {record.establishment_name || `Record #${record.id}`}
                      </p>
                      <p className="mt-1 text-sm opacity-65">
                        {record.business_type || 'No business type'} · {record.city_municipality || 'No city'}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-75">
                          {cleanLabel(record.classification)}
                        </span>

                        <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-75">
                          {record.year_recorded || 'No year'}
                        </span>

                        <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-75">
                          Employees {record.total_employees ?? 0}
                        </span>

                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">
                          DOT {yesNo(record.dot_accredited)}
                        </span>

                        <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-75">
                          Created {compactDate(record.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {canMutate ? (
                  <div className="flex items-start gap-2 xl:justify-end">
                    <Link
                      href={`${path}/${record.id}/edit`}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black transition hover:bg-white/15"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => destroy(record)}
                      className="inline-flex items-center rounded-full border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-400/15"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <FileBarChart className="mx-auto h-10 w-10 opacity-40" />
            <h3 className="mt-4 text-xl font-black">No MICE records found</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 opacity-65">
              Registry entries will appear here after records are created or imported.
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
