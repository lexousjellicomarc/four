import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ArrowRight, BookOpen, Mail, MapPin, Phone, Save, ShieldCheck } from 'lucide-react';

type SiteSettings = {
  mapEmbedUrl?: string | null;
  openMapUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  visitaUrl?: string | null;
  creativeBaguioUrl?: string | null;
  footerDescription?: string | null;
  footerCopyright?: string | null;
};

type InfoSection = {
  title: string;
  items?: string[];
  body?: string;
};

export default function AdminGuidelinesContactsPage({
  siteSettings,
  guidelinesSections,
  termsSections,
  operationalNotes,
}: {
  siteSettings: SiteSettings;
  guidelinesSections: InfoSection[];
  termsSections: InfoSection[];
  operationalNotes: string[];
}) {
  const { props } = usePage<any>();
  const flash = props.flash ?? {};
  const [form, setForm] = useState({
    map_embed_url: siteSettings?.mapEmbedUrl ?? '',
    open_map_url: siteSettings?.openMapUrl ?? '',
    address: siteSettings?.address ?? '',
    phone: siteSettings?.phone ?? '',
    email: siteSettings?.email ?? '',
    visita_url: siteSettings?.visitaUrl ?? '',
    creative_baguio_url: siteSettings?.creativeBaguioUrl ?? '',
    footer_description: siteSettings?.footerDescription ?? '',
    footer_copyright: siteSettings?.footerCopyright ?? '',
  });
  const [saving, setSaving] = useState(false);

  const adminLinks = useMemo(
    () => [
      { label: 'Back to Admin Home', href: '/admin/home' },
      { label: 'Open Frontend Contact', href: '/contact' },
      { label: 'Open Frontend Guidelines', href: '/guidelines' },
    ],
    [],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    router.post('/admin/guidelines-contacts', form, {
      preserveScroll: true,
      onFinish: () => setSaving(false),
    });
  };

  return (
    <AppLayout>
      <Head title="Admin • Guidelines & Contacts" />

      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f8b6d] dark:bg-[#172128] dark:text-[#9dc0ff]">
                Backend-only reference page
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#1f1f1c] dark:text-white">
                Guidelines & Contacts Management
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                This page is separate from the public frontend. Use it for richer internal guidance, official contact maintenance,
                tourism/arts link control, and staff-facing operational notes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#1f1f1c] transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {flash.success ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              {flash.success}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={submit} className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#eef7f4] p-2 text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Editable contact settings</div>
                <h2 className="mt-1 text-2xl font-semibold text-[#1f1f1c] dark:text-white">Office information and public links</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['address', 'Office Address'],
                ['phone', 'Phone'],
                ['email', 'Email'],
                ['open_map_url', 'Open Map URL'],
                ['map_embed_url', 'Map Embed URL'],
                ['visita_url', 'VISITA Baguio URL'],
                ['creative_baguio_url', 'Arts / Creative URL'],
                ['footer_copyright', 'Footer Copyright'],
              ].map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm">
                  <span className="font-semibold text-[#1f1f1c] dark:text-white">{label}</span>
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#17181c] dark:text-white"
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 grid gap-4">
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-[#1f1f1c] dark:text-white">Footer Description</span>
                <textarea
                  value={form.footer_description}
                  onChange={(e) => setForm((prev) => ({ ...prev, footer_description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-[#17181c] dark:text-white"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-[#294CFF]"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save Contact Settings'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#f7ebc1] p-2 text-[#6a4f00]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Internal guidance</div>
                  <h2 className="mt-1 text-2xl font-semibold text-[#1f1f1c] dark:text-white">Backend guidelines for staff</h2>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {guidelinesSections.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5">
                    <h3 className="text-lg font-semibold text-[#1f1f1c] dark:text-white">{section.title}</h3>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {(section.items ?? []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#eef7f4] p-2 text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Terms and conditions</div>
                  <h2 className="mt-1 text-2xl font-semibold text-[#1f1f1c] dark:text-white">Operational policy reference</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {termsSections.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-black/5 p-4 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-[#1f1f1c] dark:text-white">{section.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-black/5 bg-[#f8f8f8] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-semibold text-[#1f1f1c] dark:text-white">Operational Notes</div>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {operationalNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="flex items-center gap-3 text-[#174f40] dark:text-[#9dc0ff]"><Phone className="h-4 w-4" /> Current office phone</div>
            <div className="mt-3 text-xl font-semibold text-[#1f1f1c] dark:text-white">{siteSettings?.phone || '(074) 446 2009'}</div>
          </div>
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="flex items-center gap-3 text-[#174f40] dark:text-[#9dc0ff]"><Mail className="h-4 w-4" /> Current office email</div>
            <div className="mt-3 text-xl font-semibold text-[#1f1f1c] dark:text-white">{siteSettings?.email || 'info@bccc-ease.com'}</div>
          </div>
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="flex items-center gap-3 text-[#174f40] dark:text-[#9dc0ff]"><MapPin className="h-4 w-4" /> Current address</div>
            <div className="mt-3 text-base font-semibold text-[#1f1f1c] dark:text-white">{siteSettings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}</div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
