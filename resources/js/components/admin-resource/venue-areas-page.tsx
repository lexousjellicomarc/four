import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import {
  cleanLabel,
  compactDate,
  extractCollection,
  extractLinks,
  textValue,
} from '@/lib/admin-resource-ui';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
  Building2,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type VenueArea = {
  id: number | string;
  name?: string | null;
  description?: string | null;
  created_at?: string | null;
  services_count?: number | string | null;
  services?: unknown[];
};

type PageProps = {
  workspaceRole?: string;
  serviceTypes?: unknown;
  venueAreas?: unknown;
  filters?: {
    q?: string;
  };
};

export function VenueAreasPage() {
  const { props } = usePage<PageProps>();
  const areas = useMemo(
    () => extractCollection<VenueArea>(props.venueAreas ?? props.serviceTypes),
    [props.venueAreas, props.serviceTypes],
  );
  const links = extractLinks(props.venueAreas ?? props.serviceTypes);
  const [editing, setEditing] = useState<VenueArea | null>(null);
  const [q, setQ] = useState(String(props.filters?.q ?? ''));

  const { data, setData, post, put, reset, processing, errors } = useForm({
    name: '',
    description: '',
  });

  function startCreate() {
    setEditing(null);
    reset();
  }

  function startEdit(area: VenueArea) {
    setEditing(area);
    setData({
      name: textValue(area.name),
      description: textValue(area.description),
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editing) {
      put(`/admin/venue-areas/${editing.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          setEditing(null);
          reset();
        },
      });

      return;
    }

    post('/admin/venue-areas', {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  }

  function destroy(area: VenueArea) {
    const confirmed = window.confirm(
      `Delete "${area.name}"? This may affect rental options connected to this area.`,
    );

    if (!confirmed) return;

    router.delete(`/admin/venue-areas/${area.id}`, {
      preserveScroll: true,
    });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    router.get(
      '/admin/venue-areas',
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
      title="Venue Areas"
      current="Venue Areas"
      description="Manage the main rentable areas of Baguio Convention and Cultural Center. These replace the confusing old “Service Types” label in the interface."
      actions={
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Venue Area
        </button>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[390px_1fr]">
        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/15">
              <Building2 className="h-5 w-5 opacity-75" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                {editing ? 'Edit Area' : 'Create Area'}
              </p>
              <h3 className="text-xl font-black">
                {editing ? editing.name : 'Venue Area Details'}
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Area Name
              </span>
              <input
                value={data.name}
                onChange={(event) => setData('name', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
                placeholder="MAIN HALL, VIP LOUNGE, BOARD ROOM..."
              />
              {errors.name ? <p className="text-xs font-bold text-red-300">{errors.name}</p> : null}
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Description
              </span>
              <textarea
                value={data.description}
                onChange={(event) => setData('description', event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm outline-none focus:border-white/25"
                placeholder="Short internal description or public context..."
              />
              {errors.description ? (
                <p className="text-xs font-bold text-red-300">{errors.description}</p>
              ) : null}
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={processing}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/12 px-5 text-sm font-black transition hover:bg-white/18 disabled:opacity-60"
              >
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? 'Update Area' : 'Save Area'}
              </button>

              {editing ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-black/10 px-5 text-sm font-black transition hover:bg-white/10"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-sm backdrop-blur">
          <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                Rentable Areas
              </p>
              <h3 className="mt-1 text-xl font-black">
                {areas.length} area{areas.length === 1 ? '' : 's'}
              </h3>
            </div>

            <form onSubmit={search} className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 pl-11 pr-4 text-sm outline-none focus:border-white/25"
                placeholder="Search areas..."
              />
            </form>
          </div>

          {areas.length > 0 ? (
            <div className="divide-y divide-white/10">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="grid gap-4 p-5 transition hover:bg-white/[0.05] md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="text-lg font-black">{area.name}</p>
                    <p className="mt-1 max-w-3xl text-sm leading-6 opacity-65">
                      {area.description || 'No description provided.'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-70">
                        {Number(area.services_count ?? area.services?.length ?? 0)} rental option(s)
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-70">
                        Created {compactDate(area.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(area)}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black transition hover:bg-white/15"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => destroy(area)}
                      className="inline-flex items-center rounded-full border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-400/15"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <Building2 className="mx-auto h-10 w-10 opacity-40" />
              <h3 className="mt-4 text-xl font-black">No venue areas yet</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 opacity-65">
                Add areas like MAIN HALL, FOYER & LOBBY AREA, VIP LOUNGE, BOARD ROOM,
                BASEMENT, or GALLERY2600.
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
      </section>
    </ResourcePageShell>
  );
}
