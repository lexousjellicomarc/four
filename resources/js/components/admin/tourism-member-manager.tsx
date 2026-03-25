import { ChangeEvent, FormEvent, useState } from 'react';
import { Edit3, Image as ImageIcon, Plus, Save, Trash2, X } from 'lucide-react';

type RowId = number | string;

export type TourismMemberRow = {
  id: RowId;
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

type TourismMemberFormState = {
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

type NoticeState =
  | { type: 'success' | 'error'; text: string }
  | null;

const emptyForm: TourismMemberFormState = {
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
  return (
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.trim() ?? ''
  );
}

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Unexpected server response.' };
  }
}

async function apiFormSubmit<T>(
  url: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST',
): Promise<T> {
  const csrf = getCsrfToken();

  if (method !== 'POST') {
    formData.append('_method', method);
  }

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

  if (!response.ok) {
    throw payload;
  }

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

  if (!response.ok) {
    throw payload;
  }

  return payload as T;
}

function normalizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return 'Something went wrong while processing the request.';
}

function upsertById<T extends { id: RowId }>(items: T[], row: T) {
  const exists = items.some((item) => item.id === row.id);
  if (exists) return items.map((item) => (item.id === row.id ? row : item));
  return [row, ...items];
}

function removeById<T extends { id: RowId }>(items: T[], id: RowId) {
  return items.filter((item) => item.id !== id);
}

export default function TourismMemberManager({
  initialMembers = [],
}: {
  initialMembers?: TourismMemberRow[];
}) {
  const [members, setMembers] = useState<TourismMemberRow[]>(initialMembers);
  const [form, setForm] = useState<TourismMemberFormState>(emptyForm);
  const [editingId, setEditingId] = useState<RowId | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, photoFile: file }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

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

    if (form.photoFile) {
      formData.append('photo', form.photoFile);
    }

    try {
      const payload = editingId
        ? await apiFormSubmit<{ message: string; item: TourismMemberRow }>(
            `/admin/tourism-members/${editingId}`,
            formData,
            'PUT',
          )
        : await apiFormSubmit<{ message: string; item: TourismMemberRow }>(
            '/admin/tourism-members',
            formData,
            'POST',
          );

      setMembers((prev) => upsertById(prev, payload.item));
      setNotice({ type: 'success', text: payload.message });
      resetForm();
    } catch (error) {
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  const edit = (row: TourismMemberRow) => {
    setEditingId(row.id);
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
  };

  const remove = async (id: RowId) => {
    if (!window.confirm('Are you sure you want to delete this team member profile?')) {
      return;
    }

    setNotice(null);

    try {
      const payload = await apiDelete<{ message: string; id: RowId }>(`/admin/tourism-members/${id}`);
      setMembers((prev) => removeById(prev, payload.id));
      if (editingId === payload.id) {
        resetForm();
      }
      setNotice({ type: 'success', text: payload.message });
    } catch (error) {
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318] sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">CTCAO Team / Member Profiles</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Add officer and staff cards for the Tourism Office page, including unit, designation, contact details, and more info content.
        </p>
      </div>

      {notice ? (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200'
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5 lg:grid-cols-2"
      >
        <input
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          placeholder="Full name"
          className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
          required
        />

        <input
          value={form.designation}
          onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))}
          placeholder="Designation / Position"
          className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
          required
        />

        <input
          value={form.unitName}
          onChange={(e) => setForm((prev) => ({ ...prev, unitName: e.target.value }))}
          placeholder="Unit / Division (example: Creative Baguio City)"
          className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
        />

        <input
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
          className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
        />

        <input
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="Phone"
          className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
        />

        <label className="flex items-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#121318]">
          <ImageIcon className="h-4 w-4" />
          <span>{form.photoFile ? form.photoFile.name : 'Profile photo'}</span>
          <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </label>

        <textarea
          value={form.shortBio}
          onChange={(e) => setForm((prev) => ({ ...prev, shortBio: e.target.value }))}
          placeholder="Short bio / summary"
          rows={4}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318] lg:col-span-2"
        />

        <textarea
          value={form.detailsText}
          onChange={(e) => setForm((prev) => ({ ...prev, detailsText: e.target.value }))}
          placeholder={'More details, one line per item\nExample:\nHandles tourism coordination\nSupports public inquiries\nCreative sector engagement'}
          rows={6}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318] lg:col-span-2"
        />

        <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#121318]">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
          />
          Active profile
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#121318]">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
          />
          Featured card
        </label>

        <div className="lg:col-span-2 flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
          >
            {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? 'Update Profile' : 'Create Profile'}
          </button>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
            >
              <X className="h-4 w-4" />
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((row) => (
          <div
            key={row.id}
            className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {row.photo ? (
                    <img
                      src={row.photo}
                      alt={row.fullName}
                      className="h-16 w-16 rounded-2xl border border-black/10 object-cover dark:border-white/10"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-white text-2xl font-semibold dark:border-white/10 dark:bg-[#121318]">
                      {row.fullName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="text-lg font-semibold">{row.fullName}</div>
                    <div className="text-sm text-[#174f40] dark:text-[#8ea3ff]">{row.designation}</div>
                    {row.unitName ? (
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                        {row.unitName}
                      </div>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {row.shortBio || 'No short bio yet.'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => edit(row)}
                  className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="rounded-full border border-red-200 bg-white p-2 text-red-600 dark:border-red-400/20 dark:bg-[#17181c]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {(row.active || row.featured) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {row.active ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Active
                  </span>
                ) : null}
                {row.featured ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    Featured
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
            No team member profiles added yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
