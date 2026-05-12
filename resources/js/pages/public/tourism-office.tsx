import TourismMembersShowcase from '@/components/public/tourism-members-showcase';
import {
    EditorialFrame,
    EmptyPublicPanel,
    SectionIntro,
    cx,
    descriptionOf,
    imageOf,
    titleOf,
    visibleRecords,
    type PublicImageRecord,
} from '@/components/public/public-display-system';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Globe2,
    Mail,
    MapPin,
    Phone,
    Sparkles,
    UsersRound,
} from 'lucide-react';
import { useMemo } from 'react';

type SiteSettings = {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    visita_url?: string | null;
    visitaUrl?: string | null;
    creative_baguio_url?: string | null;
    creativeBaguioUrl?: string | null;
    arts_url?: string | null;
    footer_description?: string | null;
    footerDescription?: string | null;
};

type TourismPageProps = {
    members?: PublicImageRecord[];
    tourismMembers?: PublicImageRecord[];
    officeMembers?: PublicImageRecord[];
    siteSettings?: SiteSettings;
};

function setting(settings: SiteSettings | undefined, snake: keyof SiteSettings, camel?: keyof SiteSettings) {
    return String(settings?.[snake] ?? (camel ? settings?.[camel] : '') ?? '');
}

function contactCards(settings?: SiteSettings) {
    return [
        {
            label: 'Office Address',
            value: setting(settings, 'address'),
            icon: MapPin,
        },
        {
            label: 'Phone',
            value: setting(settings, 'phone'),
            icon: Phone,
        },
        {
            label: 'Email',
            value: setting(settings, 'email'),
            icon: Mail,
        },
    ].filter((item) => item.value.trim() !== '');
}

export default function TourismOfficePage() {
    const { props } = usePage<TourismPageProps>();

    const members = useMemo(
        () => visibleRecords([
            ...(props.members ?? []),
            ...(props.tourismMembers ?? []),
            ...(props.officeMembers ?? []),
        ]),
        [props.members, props.tourismMembers, props.officeMembers],
    );

    const settings = props.siteSettings;
    const contacts = contactCards(settings);
    const visitaUrl = setting(settings, 'visita_url', 'visitaUrl');
    const artsUrl = setting(settings, 'creative_baguio_url', 'creativeBaguioUrl') || setting(settings, 'arts_url');

    const featuredMembers = members.slice(0, 4);

    return (
        <>
            <Head title="Tourism Office" />

            <main className="public-display-page min-h-screen">
                <section className="public-section-shell py-16 lg:py-20">
                    <EditorialFrame
                        label="Tourism"
                        left={
                            <div className="space-y-3">
                                <p className="public-frame-label green">Nav</p>

                                {['Office Profile', 'Team', 'Contact', 'External Links'].map((item) => (
                                    <a
                                        key={item}
                                        href={`#${item.toLowerCase().replaceAll(' ', '-')}`}
                                        className="block rounded-full border border-[#d9c7a6]/70 bg-white/65 px-4 py-2 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                    >
                                        {item}
                                    </a>
                                ))}
                            </div>
                        }
                        main={
                            <div id="office-profile">
                                <SectionIntro
                                    kicker="City Tourism, Culture and Arts Office"
                                    title="Tourism Office"
                                    description="A public service section for BCCC, city tourism coordination, cultural support, visitor information, and institutional contact references."
                                />

                                <div className="public-readable mt-8 grid gap-4 text-[#6e604c] dark:text-white/60">
                                    <p>
                                        This page presents the official tourism office profile and team references connected to the Baguio Convention and Cultural Center public website. The content is designed for readable long-form information with comfortable line length, generous line height, and left-aligned body copy.
                                    </p>

                                    <p>
                                        Use this section for official public-facing profiles, visitor assistance references, tourism-related links, and people or office profiles managed from the Content Manager.
                                    </p>
                                </div>

                                <div className="mt-8 grid gap-3 md:grid-cols-3">
                                    <MiniStat icon={UsersRound} label="Team Profiles" value={members.length.toString()} />
                                    <MiniStat icon={Building2} label="Office Section" value="Public" />
                                    <MiniStat icon={Sparkles} label="Display" value="Carousel" />
                                </div>
                            </div>
                        }
                        right={
                            <div className="space-y-3">
                                <p className="public-frame-label">Contact</p>

                                {contacts.length > 0 ? (
                                    contacts.map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <article
                                                key={item.label}
                                                className="rounded-[1rem] border border-[#eadcc2]/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.035]"
                                            >
                                                <Icon className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />
                                                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                                    {item.label}
                                                </p>
                                                <p className="mt-1 break-words text-sm leading-6 text-[#6e604c] dark:text-white/58">
                                                    {item.value}
                                                </p>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        Contact details can be configured in the Content Manager or Guidelines & Contacts page.
                                    </p>
                                )}
                            </div>
                        }
                        footer={
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <p className="public-readable max-w-[70ch] text-sm text-[#6e604c] dark:text-white/58">
                                    External links can point visitors to VISITA Baguio and the city arts or creative tourism website.
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {visitaUrl ? (
                                        <a
                                            href={visitaUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                        >
                                            VISITA Baguio
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    ) : null}

                                    {artsUrl ? (
                                        <a
                                            href={artsUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                        >
                                            Arts Website
                                            <Globe2 className="h-4 w-4" />
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        }
                    />
                </section>

                <div id="team">
                    <TourismMembersShowcase items={members} />
                </div>

                <section id="contact" className="public-section-shell py-16">
                    <SectionIntro
                        kicker="Office Directory"
                        title="Tourism member profiles"
                        description="Profiles are shown with a center-focused carousel while selected cards below provide readable quick references."
                    />

                    {featuredMembers.length > 0 ? (
                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {featuredMembers.map((member, index) => (
                                <article
                                    key={member.id ?? index}
                                    className="public-smooth-card overflow-hidden rounded-[1.4rem] border border-[#d9c7a6]/70 bg-white/75 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.05]"
                                >
                                    {imageOf(member) ? (
                                        <img
                                            src={imageOf(member)}
                                            alt={titleOf(member, 'Tourism member')}
                                            className="h-64 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="grid h-64 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                            <UsersRound className="h-10 w-10" />
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <h3 className="text-xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                                            {titleOf(member, 'Tourism member')}
                                        </h3>

                                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                            {member.position || member.role || 'Tourism Office'}
                                        </p>

                                        {descriptionOf(member) ? (
                                            <p className="public-readable mt-3 line-clamp-4 text-sm text-[#6e604c] dark:text-white/56">
                                                {descriptionOf(member)}
                                            </p>
                                        ) : null}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-8">
                            <EmptyPublicPanel
                                icon={UsersRound}
                                title="No team profiles yet"
                                description="Tourism member profiles configured in the Content Manager will appear here."
                            />
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

function MiniStat({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UsersRound;
    label: string;
    value: string;
}) {
    return (
        <article className="rounded-[1.15rem] border border-[#eadcc2]/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                {value}
            </p>
        </article>
    );
}
