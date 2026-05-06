import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Building2,
    CalendarDays,
    ExternalLink,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    SquareStack,
    Users2,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

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

type Props = {
    siteSettings: SiteSettings;
    guidelinesSections: GuidelineSection[];
    contactCards: ContactCard[];
    rentalAreas: RentalArea[];
    reservationNotes: string[];
    signatories: Signatory[];
    operationalNotes: string[];
};

function currentBasePath() {
    if (window.location.pathname.startsWith('/manager'))
        return '/manager/guidelines-contacts';

    return '/admin/guidelines-contacts';
}

function safeArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

function settingText(value?: string | null, fallback = 'Not configured') {
    return value && String(value).trim() ? String(value) : fallback;
}

export default function AdminGuidelinesContactsPage({
    siteSettings,
    guidelinesSections,
    contactCards,
    rentalAreas,
    reservationNotes,
    signatories,
    operationalNotes,
}: Props) {
    const { props } = usePage<{
        flash?: { success?: string; error?: string };
    }>();
    const flash = props.flash ?? {};
    const basePath = currentBasePath();

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

    const quickLinks = useMemo(
        () => [
            {
                label: 'Backend Dashboard',
                href: window.location.pathname.startsWith('/manager')
                    ? '/manager/dashboard'
                    : '/admin/dashboard',
            },
            {
                label: 'Calendar Manage',
                href: window.location.pathname.startsWith('/manager')
                    ? '/manager/calendar/manage'
                    : '/admin/calendar/manage',
            },
            {
                label: 'MICE Registry',
                href: window.location.pathname.startsWith('/manager')
                    ? '/manager/reports/mice-registry'
                    : '/admin/reports/mice-registry',
            },
            { label: 'Public Contact', href: '/contact' },
        ],
        [],
    );

    function submit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);

        router.post(basePath, form, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    }

    return (
        <AdminLayout
            title="Backend Guidelines & Contacts"
            eyebrow="Operations Reference"
            description="Staff-only reference for BCCC rules, rates, contact persons, signatories, reservation notes, and frontend contact settings."
            actions={
                <div className="flex flex-wrap gap-2">
                    {quickLinks.slice(0, 2).map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="alh-secondary-button"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            }
        >
            <Head title="Guidelines & Contacts" />

            <div className="space-y-5">
                <section className="guidelines-hero">
                    <div>
                        <p className="backend-booking-label">
                            Guidelines & Contacts
                        </p>
                        <h1>
                            Operational rules, rates, contacts, and public
                            contact settings.
                        </h1>
                        <span>
                            This page keeps the backend team aligned with the
                            booking rules, official contact details, public
                            website footer/contact links, and BCCC reference
                            information.
                        </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="guidelines-quick-link"
                            >
                                <span>{link.label}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        ))}
                    </div>
                </section>

                {flash.success ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {flash.success}
                    </div>
                ) : null}

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <main className="space-y-5">
                        <section className="guidelines-panel overflow-hidden">
                            <div className="guidelines-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Booking Rules
                                    </p>
                                    <h2>Official operational reminders</h2>
                                    <span>
                                        Rules are compressed by section so staff
                                        do not need to read a crowded long page.
                                    </span>
                                </div>
                                <BookOpen className="h-5 w-5 text-slate-400" />
                            </div>

                            <div className="grid gap-4 p-5 md:grid-cols-2">
                                {safeArray(guidelinesSections).map(
                                    (section) => (
                                        <article
                                            key={section.title}
                                            className="guidelines-section-card"
                                        >
                                            <h3>{section.title}</h3>
                                            <ul>
                                                {safeArray(section.items).map(
                                                    (item, index) => (
                                                        <li
                                                            key={`${section.title}-${index}`}
                                                        >
                                                            <ShieldCheck className="h-4 w-4" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </article>
                                    ),
                                )}
                            </div>
                        </section>

                        <section className="guidelines-panel overflow-hidden">
                            <div className="guidelines-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Rental Areas
                                    </p>
                                    <h2>Venue rate references</h2>
                                </div>
                                <Building2 className="h-5 w-5 text-slate-400" />
                            </div>

                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {safeArray(rentalAreas).map((area) => (
                                    <article
                                        key={area.area}
                                        className="guidelines-rental-row"
                                    >
                                        <div>
                                            <h3>{area.area}</h3>
                                            <p>
                                                Rental options and reference
                                                rates.
                                            </p>
                                        </div>

                                        <div className="guidelines-rate-grid">
                                            {safeArray(area.rates).map(
                                                (rate) => (
                                                    <div
                                                        key={`${area.area}-${rate.usage}`}
                                                        className="alh-admin-mini-box"
                                                    >
                                                        <span>
                                                            {rate.usage}
                                                        </span>
                                                        <strong>
                                                            {rate.rate}
                                                        </strong>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="guidelines-panel overflow-hidden">
                            <div className="guidelines-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Reservation Notes
                                    </p>
                                    <h2>Client-facing reminders</h2>
                                </div>
                                <SquareStack className="h-5 w-5 text-slate-400" />
                            </div>

                            <div className="grid gap-3 p-5">
                                {safeArray(reservationNotes).map(
                                    (note, index) => (
                                        <div
                                            key={index}
                                            className="guidelines-note-row"
                                        >
                                            <span>{index + 1}</span>
                                            <p>{note}</p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </section>

                        <section className="guidelines-panel overflow-hidden">
                            <div className="guidelines-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Signatories
                                    </p>
                                    <h2>Approval chain</h2>
                                </div>
                                <Users2 className="h-5 w-5 text-slate-400" />
                            </div>

                            <div className="grid gap-4 p-5 md:grid-cols-2">
                                {safeArray(signatories).map((person) => (
                                    <article
                                        key={`${person.label}-${person.name}`}
                                        className="guidelines-contact-card"
                                    >
                                        <p className="backend-booking-label">
                                            {person.label}
                                        </p>
                                        <h3>{person.name}</h3>
                                        <span>{person.role}</span>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </main>

                    <aside className="space-y-5">
                        <section className="guidelines-panel overflow-hidden">
                            <div className="guidelines-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Contact Settings
                                    </p>
                                    <h2>Public contact/footer data</h2>
                                </div>
                                <Save className="h-5 w-5 text-slate-400" />
                            </div>

                            <form onSubmit={submit} className="grid gap-4 p-5">
                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Address
                                    </span>
                                    <textarea
                                        rows={3}
                                        value={form.address}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                address: event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input min-h-[90px] py-3"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Phone
                                    </span>
                                    <input
                                        value={form.phone}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                phone: event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Email
                                    </span>
                                    <input
                                        value={form.email}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Google Map Embed URL
                                    </span>
                                    <textarea
                                        rows={3}
                                        value={form.map_embed_url}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                map_embed_url:
                                                    event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input min-h-[90px] py-3"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Open Map URL
                                    </span>
                                    <input
                                        value={form.open_map_url}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                open_map_url:
                                                    event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        VISITA URL
                                    </span>
                                    <input
                                        value={form.visita_url}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                visita_url: event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Creative Baguio URL
                                    </span>
                                    <input
                                        value={form.creative_baguio_url}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                creative_baguio_url:
                                                    event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Footer Description
                                    </span>
                                    <textarea
                                        rows={4}
                                        value={form.footer_description}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                footer_description:
                                                    event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input min-h-[120px] py-3"
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="backend-booking-label">
                                        Footer Copyright
                                    </span>
                                    <input
                                        value={form.footer_copyright}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                footer_copyright:
                                                    event.target.value,
                                            }))
                                        }
                                        className="backend-booking-input"
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="alh-primary-button justify-center disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </form>
                        </section>

                        <section className="guidelines-panel overflow-hidden">
                            <div className="guidelines-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Official Contacts
                                    </p>
                                    <h2>BCCC references</h2>
                                </div>
                                <Phone className="h-5 w-5 text-slate-400" />
                            </div>

                            <div className="grid gap-3 p-5">
                                {safeArray(contactCards).map((contact) => (
                                    <article
                                        key={`${contact.office}-${contact.person}`}
                                        className="guidelines-contact-card"
                                    >
                                        <p className="backend-booking-label">
                                            {contact.office}
                                        </p>
                                        <h3>{contact.person}</h3>
                                        <span>{contact.role}</span>

                                        <div className="mt-4 grid gap-2">
                                            {contact.email ? (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="guidelines-contact-link"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    {contact.email}
                                                </a>
                                            ) : null}
                                            {safeArray(contact.phones).map(
                                                (phone) => (
                                                    <a
                                                        key={phone}
                                                        href={`tel:${phone}`}
                                                        className="guidelines-contact-link"
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                        {phone}
                                                    </a>
                                                ),
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="guidelines-panel overflow-hidden">
                            <div className="guidelines-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Current Public Values
                                    </p>
                                    <h2>Quick preview</h2>
                                </div>
                                <MapPin className="h-5 w-5 text-slate-400" />
                            </div>

                            <div className="grid gap-3 p-5">
                                <div className="alh-admin-mini-box">
                                    <span>Address</span>
                                    <strong>
                                        {settingText(siteSettings?.address)}
                                    </strong>
                                </div>
                                <div className="alh-admin-mini-box">
                                    <span>Phone</span>
                                    <strong>
                                        {settingText(siteSettings?.phone)}
                                    </strong>
                                </div>
                                <div className="alh-admin-mini-box">
                                    <span>Email</span>
                                    <strong>
                                        {settingText(siteSettings?.email)}
                                    </strong>
                                </div>
                                <div className="alh-admin-mini-box">
                                    <span>Map Link</span>
                                    {siteSettings?.openMapUrl ? (
                                        <a
                                            href={siteSettings.openMapUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 font-black text-slate-950 dark:text-white"
                                        >
                                            Open Map{' '}
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    ) : (
                                        <strong>Not configured</strong>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="guidelines-panel overflow-hidden">
                            <div className="guidelines-panel-header">
                                <div>
                                    <p className="backend-booking-label">
                                        Operational Notes
                                    </p>
                                    <h2>Internal reminders</h2>
                                </div>
                                <CalendarDays className="h-5 w-5 text-slate-400" />
                            </div>

                            <div className="grid gap-3 p-5">
                                {safeArray(operationalNotes).map(
                                    (note, index) => (
                                        <div
                                            key={index}
                                            className="guidelines-note-row"
                                        >
                                            <span>{index + 1}</span>
                                            <p>{note}</p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </section>
                    </aside>
                </section>
            </div>
        </AdminLayout>
    );
}
