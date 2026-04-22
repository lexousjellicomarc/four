import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import {
  ArrowRight,
  BookOpen,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  SquareStack,
  Users2,
} from 'lucide-react';

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

type GuidelineSection = {
  title: string;
  items: string[];
};

type ContactCard = {
  office: string;
  person: string;
  role: string;
  email?: string | null;
  phones: string[];
};

type RentalArea = {
  area: string;
  rates: Array<{
    usage: string;
    rate: string;
  }>;
};

type Signatory = {
  label: string;
  name: string;
  role: string;
};

export default function AdminGuidelinesContactsPage({
  siteSettings,
  guidelinesSections,
  contactCards,
  rentalAreas,
  reservationNotes,
  signatories,
  operationalNotes,
}: {
  siteSettings: SiteSettings;
  guidelinesSections: GuidelineSection[];
  contactCards: ContactCard[];
  rentalAreas: RentalArea[];
  reservationNotes: string[];
  signatories: Signatory[];
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
      { label: 'Admin Home', href: '/admin/home' },
      { label: 'Backend Dashboard', href: '/dashboard' },
      { label: 'Booking Calendar', href: '/calendar/manage' },
      { label: 'MICE Registry', href: '/reports/mice-registry' },
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
    <AdminLayout
      title="Backend Guidelines & Contacts"
      subtitle="Staff-only reference for official BCCC rules, reservation rates, contact persons, and frontend contact settings."
    >
      <Head title="Admin • Backend Guidelines & Contacts" />

      <div className="space-y-6">
        <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-[#0f8b6d]/20 bg-[#eef7f4] px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#0f8b6d] dark:border-[#7aa6ff]/20 dark:bg-[#16212b] dark:text-[#9dc0ff]">
                Backend-only operational reference
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#1f1f1c] dark:text-white md:text-4xl">
                Official BCCC policy board, contacts, and reservation matrix
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                This page is intentionally separated from the public website. Use it as the internal source for the
                rules shown in the attached BCCC policy sheets, the official contacts, and the current reservation rate
                reference used during assessment and booking review.
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
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <form onSubmit={submit} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#eef7f4] p-2 text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Editable frontend settings</div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f1f1c] dark:text-white">Contact links and footer data</h2>
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

            <label className="mt-4 block space-y-2 text-sm">
              <span className="font-semibold text-[#1f1f1c] dark:text-white">Footer Description</span>
              <textarea
                value={form.footer_description}
                onChange={(e) => setForm((prev) => ({ ...prev, footer_description: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-[#17181c] dark:text-white"
              />
            </label>

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
            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#f7ebc1] p-2 text-[#6a4f00]">
                  <Users2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Official contacts</div>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f1f1c] dark:text-white">Attached policy sheet contacts</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {contactCards.map((contact) => (
                  <div key={contact.office} className="rounded-[1.5rem] border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-[#174f40] dark:text-[#9dc0ff]">{contact.office}</div>
                    <div className="mt-3 text-xl font-black tracking-tight text-[#1f1f1c] dark:text-white">{contact.person}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{contact.role}</div>

                    <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {contact.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                      ) : null}
                      {contact.phones.map((phone) => (
                        <div key={phone} className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#eef7f4] p-2 text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Internal notes</div>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f1f1c] dark:text-white">Staff reminders</h2>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-black/5 bg-[#f8f8f8] p-5 dark:border-white/10 dark:bg-white/5">
                <ul className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {operationalNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f7ebc1] p-2 text-[#6a4f00]">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Official rules</div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f1f1c] dark:text-white">Organizer and participant guidelines</h2>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {guidelinesSections.map((section) => (
                <div key={section.title} className="rounded-[1.7rem] border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5">
                  <h3 className="text-lg font-black tracking-tight text-[#1f1f1c] dark:text-white">{section.title}</h3>
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {section.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#eef7f4] p-2 text-[#174f40] dark:bg-[#16212b] dark:text-[#9dc0ff]">
                  <SquareStack className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Reservation form reference</div>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f1f1c] dark:text-white">Official rate matrix</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {rentalAreas.map((area) => (
                  <div key={area.area} className="overflow-hidden rounded-[1.5rem] border border-black/5 dark:border-white/10">
                    <div className="bg-[#f2eee4] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#1f1f1c] dark:bg-white/10 dark:text-white">
                      {area.area}
                    </div>
                    <div className="divide-y divide-black/5 dark:divide-white/10">
                      {area.rates.map((rate) => (
                        <div key={`${area.area}-${rate.usage}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{rate.usage}</span>
                          <span className="font-black text-[#174f40] dark:text-[#9dc0ff]">{rate.rate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#16171b]">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Reservation notes</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#1f1f1c] dark:text-white">Assessment and approval reminders</h2>

              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {reservationNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>

              <div className="mt-6 grid gap-3">
                {signatories.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-black/5 bg-[#f7f5ef] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{item.label}</div>
                    <div className="mt-2 text-lg font-black tracking-tight text-[#1f1f1c] dark:text-white">{item.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{item.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
