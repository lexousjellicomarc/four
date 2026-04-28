import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import {
  compactDate,
  extractCollection,
  extractLinks,
  money,
  numberText,
  textValue,
} from '@/lib/admin-resource-ui';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
  Banknote,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type RentalOption = {
  id: number | string;
  service_type_id?: number | string | null;
  service_type?: {
    id?: number | string;
    name?: string | null;
  } | null;
  name?: string | null;
  description?: string | null;
  uom?: string | null;
  price?: number | string | null;
  quantity?: number | string | null;
  min_guests?: number | string | null;
  max_guests?: number | string | null;
  capacity_note?: string | null;
  created_at?: string | null;
};

type VenueArea = {
  id: number | string;
  name?: string | null;
};

type PageProps = {
  workspaceRole?: string;
  services?: unknown;
  rentalOptions?: unknown;
  serviceTypes?: unknown;
  venueAreas?: unknown;
  filters?: {
    q?: string;
  };
};

export function RentalOptionsPage() {
  const { props } = usePage<PageProps>();
  const options = useMemo(
    () => extractCollection<RentalOption>(props.rentalOptions ?? props.services),
    [props.rentalOptions, props.services],
  );
  const areas = useMemo(
    () => extractCollection<VenueArea>(props.venueAreas ?? props.serviceTypes),
    [props.venueAreas, props.serviceTypes],
  );
  const links = extractLinks(props.rentalOptions ?? props.services);
  const [editing, setEditing] = useState<RentalOption | null>(null);
  const [q, setQ] = useState(String(props.filters?.q ?? ''));

  const { data, setData, post, put, reset, processing, errors } = useForm({
    service_type_id: '',
    name: '',
    description: '',
    uom: 'event',
    price: '',
    quantity: '1',
    min_guests: '',
    max_guests: '',
    capacity_note: '',
    is_guest_restricted: false,
  });

  function startCreate() {
    setEditing(null);
    reset();
  }

  function startEdit(option: RentalOption) {
    setEditing(option);
    setData({
      service_type_id: textValue(option.service_type_id ?? option.service_type?.id),
      name: textValue(option.name),
      description: textValue(option.description),
      uom: textValue(option.uom || 'event'),
      price: numberText(option.price),
      quantity: numberText(option.quantity || 1),
      min_guests: numberText(option.min_guests),
      max_guests: numberText(option.max_guests),
      capacity_note: textValue(option.capacity_note),
      is_guest_restricted: Boolean(option.min_guests || option.max_guests),
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editing) {
      put(`/admin/rental-options/${editing.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          setEditing(null);
          reset();
        },
      });

      return;
    }

    post('/admin/rental-options', {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  }

  function destroy(option: RentalOption) {
    const confirmed = window.confirm(
      `Delete "${option.name}"? Existing bookings may still keep historical records.`,
    );

    if (!confirmed) return;

    router.delete(`/admin/rental-options/${option.id}`, {
      preserveScroll: true,
    });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    router.get(
      '/admin/rental-options',
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
      title="Rental Options"
      current="Rental Options"
      description="Manage rates, time blocks, rental services, and pricing options under each venue area. This replaces the confusing old “Services” label."
      actions={
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Rental Option
        </button>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[430px_1fr]">
        <form
          onSubmit={submit}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/15">
              <Banknote className="h-5 w-5 opacity-75" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] opacity-60">
                {editing ? 'Edit Option' : 'Create Option'}
              </p>
              <h3 className="text-xl font-black">
                {editing ? editing.name : 'Rental Option Details'}
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Venue Area
              </span>
              <select
                value={data.service_type_id}
                onChange={(event) => setData('service_type_id', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
              >
                <option value="">Select venue area</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {errors.service_type_id ? (
                <p className="text-xs font-bold text-red-300">{errors.service_type_id}</p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Option Name
              </span>
              <input
                value={data.name}
                onChange={(event) => setData('name', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
                placeholder="Half Day AM, Whole Day, Additional Hour..."
              />
              {errors.name ? <p className="text-xs font-bold text-red-300">{errors.name}</p> : null}
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  UOM
                </span>
                <input
                  value={data.uom}
                  onChange={(event) => setData('uom', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Price
                </span>
                <input
                  value={data.price}
                  onChange={(event) => setData('price', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
                  inputMode="decimal"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Qty
                </span>
                <input
                  value={data.quantity}
                  onChange={(event) => setData('quantity', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
                  inputMode="numeric"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Min Guests
                </span>
                <input
                  value={data.min_guests}
                  onChange={(event) => setData('min_guests', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
                  inputMode="numeric"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  Max Guests
                </span>
                <input
                  value={data.max_guests}
                  onChange={(event) => setData('max_guests', event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
                  inputMode="numeric"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Capacity Note
              </span>
              <input
                value={data.capacity_note}
                onChange={(event) => setData('capacity_note', event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 px-4 text-sm outline-none focus:border-white/25"
                placeholder="Optional"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                Description
              </span>
              <textarea
                value={data.description}
                onChange={(event) => setData('description', event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm outline-none focus:border-white/25"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={processing}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/12 px-5 text-sm font-black transition hover:bg-white/18 disabled:opacity-60"
              >
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? 'Update Option' : 'Save Option'}
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
                Rates and Services
              </p>
              <h3 className="mt-1 text-xl font-black">
                {options.length} option{options.length === 1 ? '' : 's'}
              </h3>
            </div>

            <form onSubmit={search} className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 pl-11 pr-4 text-sm outline-none focus:border-white/25"
                placeholder="Search options..."
              />
            </form>
          </div>

          {options.length > 0 ? (
            <div className="divide-y divide-white/10">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="grid gap-4 p-5 transition hover:bg-white/[0.05] md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="text-lg font-black">{option.name}</p>
                    <p className="mt-1 text-sm opacity-65">
                      {option.service_type?.name || 'No venue area assigned'} · {option.uom || 'unit'}
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 opacity-65">
                      {option.description || 'No description provided.'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">
                        {money(option.price)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-70">
                        Qty {option.quantity ?? 1}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] opacity-70">
                        Created {compactDate(option.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(option)}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black transition hover:bg-white/15"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => destroy(option)}
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
              <Banknote className="mx-auto h-10 w-10 opacity-40" />
              <h3 className="mt-4 text-xl font-black">No rental options yet</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 opacity-65">
                Add rental options such as Half Day AM, Half Day PM, Whole Day, or Additional Hour.
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
