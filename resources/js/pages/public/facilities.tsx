import FacilitiesLayeredShowcase from '@/components/public/facilities-layered-showcase';
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
    CheckCircle2,
    LayoutGrid,
    MapPin,
    Sparkles,
    UsersRound,
} from 'lucide-react';
import { useMemo } from 'react';

type FacilitiesPageProps = {
    spaces?: PublicImageRecord[];
    venueSpaces?: PublicImageRecord[];
    facilities?: PublicImageRecord[];
};

function capacityOf(item: PublicImageRecord) {
    return item.capacity ? String(item.capacity) : 'Flexible capacity';
}

function facilityUrl(item: PublicImageRecord) {
    const slug = item.slug || item.id;

    return slug ? `/facilities/${slug}` : '/facilities';
}

export default function FacilitiesPage() {
    const { props } = usePage<FacilitiesPageProps>();

    const spaces = useMemo(
        () => visibleRecords([
            ...(props.spaces ?? []),
            ...(props.venueSpaces ?? []),
            ...(props.facilities ?? []),
        ]),
        [props.spaces, props.venueSpaces, props.facilities],
    );

    const featured = spaces[0];
    const secondary = spaces.slice(1, 7);

    return (
        <>
            <Head title="Facilities" />

            <main className="public-display-page min-h-screen">
                <section className="public-section-shell py-16 lg:py-20">
                    <EditorialFrame
                        label="Facilities"
                        left={
                            <div className="space-y-3">
                                <p className="public-frame-label green">Nav</p>

                                {spaces.slice(0, 6).map((space, index) => (
                                    <a
                                        key={space.id ?? index}
                                        href={`#space-${space.id ?? index}`}
                                        className="block rounded-full border border-[#d9c7a6]/70 bg-white/65 px-4 py-2 text-sm font-semibold text-[#2f2517] transition hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                                    >
                                        {titleOf(space, `Space ${index + 1}`)}
                                    </a>
                                ))}

                                {spaces.length === 0 ? (
                                    <p className="text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        Venue spaces from the Content Manager will appear here.
                                    </p>
                                ) : null}
                            </div>
                        }
                        main={
                            <div>
                                <SectionIntro
                                    kicker="Our Spaces"
                                    title="Facilities designed for civic, cultural, and convention use"
                                    description="Explore BCCC spaces through a large image-led layout with layered supporting cards and readable descriptions."
                                />

                                <div className="mt-8 grid gap-3 md:grid-cols-3">
                                    <MiniStat icon={Building2} label="Spaces" value={spaces.length.toString()} />
                                    <MiniStat icon={LayoutGrid} label="Layout" value="Layered" />
                                    <MiniStat icon={Sparkles} label="Display" value="Premium" />
                                </div>
                            </div>
                        }
                        right={
                            <div className="space-y-3">
                                <p className="public-frame-label">Featured</p>

                                {featured ? (
                                    <article className="overflow-hidden rounded-[1.2rem] border border-[#eadcc2]/80 bg-white/70 dark:border-white/10 dark:bg-white/[0.035]">
                                        {imageOf(featured) ? (
                                            <img
                                                src={imageOf(featured)}
                                                alt={titleOf(featured, 'Featured facility')}
                                                className="h-40 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="grid h-40 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                                <Building2 className="h-10 w-10" />
                                            </div>
                                        )}

                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                                                {titleOf(featured, 'Featured facility')}
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                                                {capacityOf(featured)}
                                            </p>
                                        </div>
                                    </article>
                                ) : (
                                    <p className="text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        Create facilities from the Content Manager.
                                    </p>
                                )}
                            </div>
                        }
                        footer={
                            <p className="public-readable text-sm text-[#6e604c] dark:text-white/58">
                                Body text is kept left-aligned with comfortable line height and readable line width, while visual browsing uses smooth layered movement.
                            </p>
                        }
                    />
                </section>

                <FacilitiesLayeredShowcase items={spaces} />

                <section className="public-section-shell py-16">
                    <SectionIntro
                        kicker="Venue Directory"
                        title="All public facility cards"
                        description="Each card links to a detailed facility page. Keep descriptions clear and concise for faster scanning."
                    />

                    {spaces.length > 0 ? (
                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {spaces.map((space, index) => (
                                <article
                                    key={space.id ?? index}
                                    id={`space-${space.id ?? index}`}
                                    className="public-smooth-card overflow-hidden rounded-[1.5rem] border border-[#d9c7a6]/70 bg-white/78 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.05]"
                                >
                                    {imageOf(space) ? (
                                        <img
                                            src={imageOf(space)}
                                            alt={titleOf(space, 'Facility')}
                                            className="h-64 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="grid h-64 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                            <Building2 className="h-12 w-12" />
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-2 rounded-full bg-[#f4ead8] px-3 py-1.5 text-xs font-bold text-[#7a5a24] dark:bg-white/10 dark:text-[#f1d89b]">
                                                <UsersRound className="h-3.5 w-3.5" />
                                                {capacityOf(space)}
                                            </span>

                                            <span className="inline-flex items-center gap-2 rounded-full bg-[#f4ead8] px-3 py-1.5 text-xs font-bold text-[#7a5a24] dark:bg-white/10 dark:text-[#f1d89b]">
                                                <MapPin className="h-3.5 w-3.5" />
                                                BCCC
                                            </span>
                                        </div>

                                        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">
                                            {titleOf(space, 'Facility')}
                                        </h3>

                                        <p className="public-readable mt-3 line-clamp-4 text-sm text-[#6e604c] dark:text-white/56">
                                            {descriptionOf(space, 'A BCCC venue space available for public events, programs, and reservations.')}
                                        </p>

                                        <Link
                                            href={facilityUrl(space)}
                                            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                        >
                                            View Facility
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-8">
                            <EmptyPublicPanel
                                icon={Building2}
                                title="No facilities configured"
                                description="Facilities created in the Content Manager will appear on this page."
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
    icon: typeof Building2;
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
