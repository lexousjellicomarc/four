import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Edit3, Mail, Phone, Plus, Trash2, X } from 'lucide-react';

export type TourismMemberRow = {
  id: number | string;
  fullName: string;
  designation: string;
  unitName: string;
  email: string;
  phone: string;
  shortBio: string;
  details: string[];
  photo: string;
  active: boolean;
  featured: boolean;
};

type FormState = {
  fullName: string;
  designation: string;
  unitName: string;
  email: string;
  phone: string;
  shortBio: string;
  detailsText: string;
  photoFile: File | null;
  active: boolean;
  featured: boolean;
};

type FieldErrors = Record<string, string>;

type NoticeState = { type: 'success' | 'error'; text: string } | null;

const emptyForm: FormState = {
  fullName: '',
  designation: '',
  unitName: '',
  email: '',
  phone: '',
  shortBio: '',
  detailsText: '',
  photoFile: null,
  active: true,
  featured: false,
};

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.trim() ?? '';
}

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Unexpected server response.' };
  }
}

async function apiFormSubmit<T>(url: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  const csrf = getCsrfToken();
  if (method !== 'POST') formData.append('_method', method);

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
    body: formData,
  });

  const payload = await parseApiResponse(response);
  if (!response.ok) throw payload;
  return payload as T;
}

async function apiDelete<T>(url: string): Promise<T> {
  const csrf = getCsrfToken();
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
  });
  const payload = await parseApiResponse(response);
  if (!response.ok) throw payload;
  return payload as T;
}

function normalizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    if ('errors' in error && typeof (error as { errors?: unknown }).errors === 'object') {
      const errors = (error as { errors?: Record<string, string[] | string> }).errors ?? {};
      const first = Object.values(errors)[0];
      if (Array.isArray(first) && first[0]) return first[0];
      if (typeof first === 'string') return first;
    }
  }
  return 'Please check the form.';
}

function validationErrors(error: unknown, map: Record<string, string> = {}): FieldErrors {
  if (!(typeof error === 'object' && error !== null && 'errors' in error)) return {};
  const raw = (error as { errors?: Record<string, string[] | string> }).errors ?? {};
  const out: FieldErrors = {};
  Object.entries(raw).forEach(([key, value]) => {
    const message = Array.isArray(value) ? value[0] : value;
    if (!message) return;
    out[map[key] ?? key] = String(message);
  });
  return out;
}

function inputClass(hasError: boolean) {
  return `w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
    hasError
      ? 'border-red-500 bg-red-50 focus:border-red-600 dark:bg-red-950/20'
      : 'border-slate-300 bg-white focus:border-emerald-600 dark:border-white/10 dark:bg-[#11151d] dark:focus:border-blue-400'
  }`;
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <div className="mt-1 text-sm font-medium text-red-600 dark:text-red-300">{error}</div>;
}

function NoticeBar({ notice }: { notice: NoticeState }) {
  if (!notice) return null;
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200'}`}>
      {notice.text}
    </div>
  );
}

function upsertById<T extends { id: number | string }>(items: T[], row: T) {
  const exists = items.some((item) => item.id === row.id);
  return exists ? items.map((item) => (item.id === row.id ? row : item)) : [row, ...items];
}

function removeById<T extends { id: number | string }>(items: T[], id: number | string) {
  return items.filter((item) => item.id !== id);
}

export default function TourismMemberManager({ initialMembers = [] }: { initialMembers?: TourismMemberRow[] }) {
  const [members, setMembers] = useState<TourismMemberRow[]>(initialMembers);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<NoticeState>(null);
  const [query, setQuery] = useState('');

  const filteredMembers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((row) => [row.fullName, row.designation, row.unitName, row.email, row.phone].join(' ').toLowerCase().includes(needle));
  }, [members, query]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, photoFile: file }));
    setErrors((prev) => ({ ...prev, photoFile: '' }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setErrors({});

    const formData = new FormData();
    formData.append('full_name', form.fullName);
    formData.append('designation', form.designation);
    formData.append('unit_name', form.unitName);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('short_bio', form.shortBio);
    formData.append('details_text', form.detailsText);
    formData.append('is_active', form.active ? '1' : '0');
    formData.append('is_featured', form.featured ? '1' : '0');
    if (form.photoFile) formData.append('photo', form.photoFile);

    try {
      const payload = editingId
        ? await apiFormSubmit<{ message: string; item: TourismMemberRow }>(`/admin/tourism-members/${editingId}`, formData, 'PUT')
        : await apiFormSubmit<{ message: string; item: TourismMemberRow }>('/admin/tourism-members', formData, 'POST');

      setMembers((prev) => upsertById(prev, payload.item));
      setNotice({ type: 'success', text: payload.message });
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setErrors(validationErrors(error, { full_name: 'fullName', unit_name: 'unitName', short_bio: 'shortBio', details_text: 'detailsText', photo: 'photoFile', is_active: 'active', is_featured: 'featured' }));
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  const edit = (row: TourismMemberRow) => {
    setEditingId(row.id);
    setErrors({});
    setNotice(null);
    setForm({
      fullName: row.fullName,
      designation: row.designation,
      unitName: row.unitName,
      email: row.email,
      phone: row.phone,
      shortBio: row.shortBio,
      detailsText: row.details.join('\n'),
      photoFile: null,
      active: row.active,
      featured: row.featured,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (row: TourismMemberRow) => {
    if (!window.confirm(`Delete ${row.fullName}?`)) return;
    setNotice(null);
    try {
      const payload = await apiDelete<{ message: string; id: number | string }>(`/admin/tourism-members/${row.id}`);
      setMembers((prev) => removeById(prev, payload.id));
      if (editingId === row.id) resetForm();
      setNotice({ type: 'success', text: payload.message });
    } catch (error) {
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_1.2fr]">
        <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#161b24]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Tourism profile form</h2>
            {editingId ? (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
                Cancel
              </button>
            ) : null}
          </div>

          <NoticeBar notice={notice} />

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Full name</label>
              <input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} className={inputClass(!!errors.fullName)} />
              <FieldError error={errors.fullName} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Position</label>
              <input value={form.designation} onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))} className={inputClass(!!errors.designation)} />
              <FieldError error={errors.designation} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Office / unit</label>
              <input value={form.unitName} onChange={(e) => setForm((prev) => ({ ...prev, unitName: e.target.value }))} className={inputClass(!!errors.unitName)} />
              <FieldError error={errors.unitName} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className={inputClass(!!errors.email)} />
                <FieldError error={errors.email} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className={inputClass(!!errors.phone)} />
                <FieldError error={errors.phone} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Short bio</label>
              <textarea rows={3} value={form.shortBio} onChange={(e) => setForm((prev) => ({ ...prev, shortBio: e.target.value }))} className={inputClass(!!errors.shortBio)} />
              <FieldError error={errors.shortBio} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">More details</label>
              <textarea rows={4} value={form.detailsText} onChange={(e) => setForm((prev) => ({ ...prev, detailsText: e.target.value }))} className={inputClass(!!errors.detailsText)} />
              <FieldError error={errors.detailsText} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Photo</label>
              <input type="file" accept="image/*" onChange={handlePhoto} className={inputClass(!!errors.photoFile)} />
              {form.photoFile ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{form.photoFile.name}</div> : null}
              <FieldError error={errors.photoFile} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium dark:border-white/10">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
                Active
              </label>
              <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium dark:border-white/10">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))} />
                Featured
              </label>
            </div>

            <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-blue-600 dark:hover:bg-blue-500">
              {editingId ? 'Update profile' : 'Save profile'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#161b24]">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">Saved profiles</h2>
            <div className="relative w-full md:w-72">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className={inputClass(false)} />
            </div>
          </div>

          <div className="space-y-3">
            {filteredMembers.length === 0 ? <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No profiles found.</div> : null}
            {filteredMembers.map((row) => (
              <div key={row.id} className="rounded-2xl border p-4 dark:border-white/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold">{row.fullName}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.designation}{row.unitName ? ` • ${row.unitName}` : ''}</div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                      {row.email ? <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{row.email}</span> : null}
                      {row.phone ? <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{row.phone}</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => edit(row)} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
                    <button type="button" onClick={() => remove(row)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
