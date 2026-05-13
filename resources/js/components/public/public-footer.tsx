import SafeImage from '@/components/system/safe-image';
import type { SiteSettings } from '@/layouts/public-layout';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Building2,
    CalendarDays,
    ExternalLink,
    Landmark,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
} from 'lucide-react';

type PageProps = {
    siteSettings?: SiteSettings;
};

type FooterLink = {
    label: string;
    href: string;
    external?: boolean;
};

const serviceLinks: FooterLink[] = [
    { label: 'Book Your Event', href: '/book' },
    { label: 'Availability Calendar', href: '/calendar' },
    { label: 'Facilities and Rates', href: '/facilities' },
    { label: 'Booking Guidelines', href: '/guidelines' },
];

const publicLinks: FooterLink[] = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events' },
    { label: 'Tourism Office', href: '/tourism-office' },
    { label: 'Contact Us', href: '/contact' },
];

const governmentLinks: FooterLink[] = [
    { label: 'City Government of Baguio', href: 'https://main.baguio.gov.ph/', external: true },
    { label: 'VISITA Baguio', href: 'https://visita.baguio.gov.ph/', external: true },
    { label: 'Creative Baguio', href: 'https://creativecity.baguio.gov.ph/', external: true },
];

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function ExternalOrInternalLink({ item, className }: { item: FooterLink; className?: string }) {
    const baseClass = cx(
        'group inline-flex items-center gap-2 text-sm text-white/64 transition hover:text-[#f4dfad]',
        className,
    );

    if (item.external) {
        return (
            <a href={item.href} target="_blank" rel="noreferrer" className={baseClass}>
                <span>{item.label}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
            </a>
        );
    }

    return (
        <Link href={item.href} className={baseClass}>
            <span>{item.label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
        </Link>
    );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
    return (
        <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f4dfad]">
                {title}
            </h3>

            <nav className="mt-4 grid gap-3">
                {links.map((item) => (
                    <ExternalOrInternalLink key={`${title}-${item.label}`} item={item} />
                ))}
            </nav>
        </div>
    );
}

export default function PublicFooter() {
    const page = usePage<PageProps>();
    const settings = page.props.siteSettings || {};

    const sealUrl = settings.city_seal_url || settings.logo_url || '/marketing/images/logo/bccc-seal.png';
    const breatheLogoUrl =
        settings.breathe_baguio_logo_url || settings.baguio_logo_url || '/marketing/images/logo/breathe-baguio.png';

    const address = settings.address || 'Baguio Convention and Cultural Center, Baguio City';
    const phone = settings.phone || '(074) 446 2009';
    const email = settings.email || 'info@bccc-ease.com';

    const visitaUrl = settings.visitaUrl || settings.visita_url || 'https://visita.baguio.gov.ph/';
    const artsUrl =
        settings.creativeBaguioUrl ||
        settings.creative_baguio_url ||
        settings.arts_url ||
        'https://creativecity.baguio.gov.ph/';

    const footerDescription =
        settings.footerDescription ||
        settings.footer_description ||
        'BCCC EASE is the public booking, scheduling, and event access portal for the Baguio Convention and Cultural Center.';

    const copyright =
        settings.footerCopyright ||
        settings.footer_copyright ||
        `© ${new Date().getFullYear()} City Government of Baguio. All rights reserved.`;

    const governmentLinksResolved: FooterLink[] = [
        governmentLinks[0],
        { label: 'VISITA Baguio', href: visitaUrl, external: true },
        { label: 'Creative Baguio', href: artsUrl, external: true },
    ];

    return (
        <footer className="bccc-public-footer relative overflow-hidden bg-[#120d06] px-4 pt-16 text-white sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-12rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#d8b56d]/12 blur-3xl" />
                <div className="absolute bottom-[-16rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-white/6 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f4dfad]/40 to-transparent" />
            </div>

            <div className="relative mx-auto max-w-[1920px]">
                <section className="mb-10 grid gap-4 rounded-[2rem] border border-white/12 bg-white/[0.055] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl lg:grid-cols-[1fr_auto] lg:items-center lg:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[#f4dfad]/30 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
                                <SafeImage
                                    src={sealUrl}
                                    fallbackSrc="/marketing/images/logo/bccc-seal.png"
                                    alt="City Government of Baguio"
                                    className="h-full w-full object-contain p-1.5"
                                />
                            </span>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#f4dfad]">
                                    Official Portal
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-white">
                                    BCCC EASE
                                </h2>
                                <p className="mt-1 text-sm text-white/56">
                                    Events Access and Scheduling Engine
                                </p>
                            </div>
                        </div>

                        <div className="hidden h-14 w-px bg-white/12 lg:block" />

                        <p className="max-w-2xl text-sm leading-7 text-white/62">
                            {footerDescription}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Link
                            href="/book"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f4dfad] px-5 text-sm font-semibold text-[#17120b] shadow-[0_18px_50px_rgba(244,223,173,0.18)] transition hover:-translate-y-0.5 hover:bg-white"
                        >
                            <CalendarDays className="h-4 w-4" />
                            Book Your Event
                        </Link>

                        <Link
                            href="/calendar"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/14"
                        >
                            View Calendar
                        </Link>
                    </div>
                </section>

                <section className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f4dfad]/12 text-[#f4dfad] ring-1 ring-[#f4dfad]/20">
                                <Building2 className="h-6 w-6" />
                            </span>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f4dfad]">
                                    Baguio Convention and Cultural Center
                                </p>
                                <p className="mt-1 text-sm text-white/58">
                                    Managed in coordination with the City Government of Baguio.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 text-sm text-white/64">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="group flex items-start gap-3 transition hover:text-[#f4dfad]">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#f4dfad]" />
                                <span>{address}</span>
                            </a>

                            <a href={`tel:${phone}`} className="group flex items-center gap-3 transition hover:text-[#f4dfad]">
                                <Phone className="h-4 w-4 shrink-0 text-[#f4dfad]" />
                                <span>{phone}</span>
                            </a>

                            <a href={`mailto:${email}`} className="group flex items-center gap-3 transition hover:text-[#f4dfad]">
                                <Mail className="h-4 w-4 shrink-0 text-[#f4dfad]" />
                                <span>{email}</span>
                            </a>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <SafeImage
                                src={breatheLogoUrl}
                                fallbackSrc="/marketing/images/logo/bccc-seal.png"
                                alt="Breathe Baguio"
                                className="h-12 w-auto object-contain opacity-90"
                                wrapperClassName="h-12 w-28"
                            />

                            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#f4dfad]" />
                                Secure Public Service Portal
                            </div>
                        </div>
                    </div>

                    <FooterColumn title="Services" links={serviceLinks} />
                    <FooterColumn title="Public Site" links={publicLinks} />
                    <FooterColumn title="Government Links" links={governmentLinksResolved} />
                </section>

                <section className="flex flex-col gap-4 py-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
                    <p>{copyright}</p>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/guidelines" className="transition hover:text-[#f4dfad]">
                            Policies
                        </Link>
                        <span className="h-1 w-1 rounded-full bg-white/24" />
                        <Link href="/contact" className="transition hover:text-[#f4dfad]">
                            Contact
                        </Link>
                        <span className="h-1 w-1 rounded-full bg-white/24" />
                        <a href="https://main.baguio.gov.ph/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-[#f4dfad]">
                            Baguio.gov.ph
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </section>
            </div>
        </footer>
    );
}
