import {
    EmptyPublicPanel,
    SectionIntro,
    cx,
    descriptionOf,
    imageOf,
    titleOf,
    type PublicImageRecord,
} from '@/components/public/public-display-system';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    ImageIcon,
    MapPin,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type FacilityShowProps = {
    space?: PublicImageRecord;
    facility?: PublicImageRecord;
    venueSpace?: PublicImageRecord;
    relatedSpaces?: PublicImageRecord[];
    spaces?: PublicImageRecord[];
};

function capacityOf(item?: PublicImageRecord | null) {
    return item?.capacity ? String(item.capacity) : 'Flexible capacity';
}

function galleryOf(item?: PublicImageRecord | null): string[] {
    const images = [
        imageOf(item),
        String(item?.gallery_image_1 ?? ''),
        String(item?.gallery_image_2 ?? ''),
        String(item?.gallery_image_3 ?? ''),
        String(item?.galleryImage1 ?? ''),
        String(item?.galleryImage2 ?? ''),
        String(item?.galleryImage3 ?? ''),
    ].filter(Boolean);

    return [...new Set(images)];
}

function facilityUrl(item: PublicImageRecord) {
    const slug = item.slug || item.id;

    return slug ? `/facilities/${slug}` : '/facilities';
}

export default function FacilityShowPage() {
    const { props } = usePage<FacilityShowProps>();

    const facility = props.space ?? props.facility ?? props.venueSpace ?? null;
    const related = useMemo(
        () => props.relatedSpaces ?? props.spaces ?? [],
        [props.relatedSpaces, props.spaces],
    );

    const gallery = galleryOf(facility);
    const [activeImage, setActiveImage] = useState(gallery[0] ?? '');

    if (!facility) {
        return (
            <>
                <Head title="Facility Not Found" />

                <main className="public-display-page min-h-screen">
                    <section className="public-section-shell py-20">
                        <EmptyPublicPanel
                            icon={Building2}
                            title="Facility not found"
                            description="The requested facility could not be loaded. Please return to the facilities page."
                        />

                        <div className="mt-6 flex justify-center">
                            <Link
                                href="/facilities"
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Facilities
                            </Link>
                        </div>
                    </section>
                </main>
            </>
        );
    }

    const heroImage = activeImage || imageOf(facility);

    return (
        <>
            <Head title={titleOf(facility, 'Facility')} />

            <main className="public-display-page min-h-screen">
                <section className="public-section-shell py-8 lg:py-12">
                    <Link
                        href="/facilities"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9c7a6]/70 bg-white/72 px-5 text-sm font-semibold text-[#2f2517] transition hover:-translate-y-0.5 hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Facilities
                    </Link>

                    <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#d9c7a6]/70 bg-white/80 shadow-[0_28px_90px_rgba(47,37,23,0.10)] dark:border-white/10 dark:bg-white/[0.055]">
                        <div className="grid min-h-[38rem] lg:grid-cols-[1fr_0.72fr]">
                            <div className="relative min-h-[28rem] overflow-hidden">
                                {heroImage ? (
                                    <img
                                        src={heroImage}
                                        alt={titleOf(facility, 'Facility')}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 grid place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                        <Building2 className="h-20 w-20" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/22 to-transparent" />

                                <div className="relative z-10 flex min-h-[38rem] max-w-3xl flex-col justify-end p-8 text-white lg:p-12">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f1d89b]">
                                        BCCC Facility
                                    </p>

                                    <h1 className="mt-4 text-5xl font-semibold tracking-[-0.075em] lg:text-7xl">
                                        {titleOf(facility, 'Facility')}
                                    </h1>

                                    <p className="public-readable mt-5 text-base text-white/76">
                                        {descriptionOf(facility, 'A public venue space available for events, programs, cultural activities, and reservations.')}
                                    </p>
                                </div>
                            </div>

                            <aside className="flex flex-col justify-between gap-6 p-6 lg:p-8">
                                <div>
                                    <p className="public-display-kicker">Details</p>

                                    <div className="mt-6 grid gap-3">
                                        <InfoBox icon={UsersRound} label="Capacity" value={capacityOf(facility)} />
                                        <InfoBox icon={MapPin} label="Location" value="Baguio Convention and Cultural Center" />
                                        <InfoBox icon={CalendarDays} label="Booking" value="Subject to availability" />
                                        <InfoBox icon={CheckCircle2} label="Use" value={String(facility.subtitle || 'Events, programs, and reservations')} />
                                    </div>
                                </div>

                                {gallery.length > 0 ? (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                            Gallery
                                        </p>

                                        <div className="public-no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2">
                                            {gallery.map((image, index) => (
                                                <button
                                                    key={`${image}-${index}`}
                                                    type="button"
                                                    onClick={() => setActiveImage(image)}
                                                    className={cx(
                                                        'h-24 w-32 shrink-0 overflow-hidden rounded-[1rem] border transition',
                                                        activeImage === image || (!activeImage && index === 0)
                                                            ? 'border-[#b08d48] ring-2 ring-[#b08d48]/30'
                                                            : 'border-[#eadcc2]/80 opacity-70 hover:opacity-100 dark:border-white/10',
                                                    )}
                                                >
                                                    <img src={image} alt="" className="h-full w-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <Link
                                    href="/book"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                >
                                    Check Availability
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </aside>
                        </div>
                    </section>
                </section>

                <section className="public-section-shell py-16">
                    <SectionIntro
                        kicker="Facility Information"
                        title="Designed for readable planning"
                        description="Facility descriptions are left-aligned with comfortable line height and readable width so clients can understand the venue quickly before booking."
                    />

                    <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.42fr]">
                        <article className="rounded-[1.5rem] border border-[#d9c7a6]/70 bg-white/78 p-6 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.05]">
                            <h2 className="text-3xl font-semibold tracking-[-0.06em] text-[#21180d] dark:text-white">
                                About this space
                            </h2>

                            <div className="public-readable mt-5 space-y-4 text-[#6e604c] dark:text-white/58">
                                <p>
                                    {descriptionOf(facility, 'This BCCC facility can support public events, private programs, civic gatherings, meetings, exhibitions, and cultural activities depending on the final booking arrangement and availability review.')}
                                </p>

                                <p>
                                    For best planning, check the target event date, expected guest count, preferred time block, technical requirements, and public calendar visibility before submitting the booking request.
                                </p>
                            </div>
                        </article>

                        <article className="rounded-[1.5rem] border border-[#d9c7a6]/70 bg-[#fffaf0]/72 p-6 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.035]">
                            <ImageIcon className="h-8 w-8 text-[#9d7b3d] dark:text-[#f1d89b]" />
                            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">
                                Visual planning note
                            </h3>
                            <p className="public-readable mt-3 text-sm text-[#6e604c] dark:text-white/56">
                                Add strong landscape images in the Content Manager to make this detail page more cinematic and more useful for public visitors.
                            </p>
                        </article>
                    </div>
                </section>

                {related.length > 0 ? (
                    <section className="public-section-shell pb-20">
                        <SectionIntro
                            kicker="More Spaces"
                            title="Related facilities"
                            description="Continue browsing other venue spaces managed from the public content system."
                        />

                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {related.slice(0, 3).map((space, index) => (
                                <Link
                                    key={space.id ?? index}
                                    href={facilityUrl(space)}
                                    className="public-smooth-card overflow-hidden rounded-[1.4rem] border border-[#d9c7a6]/70 bg-white/78 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.05]"
                                >
                                    {imageOf(space) ? (
                                        <img
                                            src={imageOf(space)}
                                            alt={titleOf(space, 'Facility')}
                                            className="h-52 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="grid h-52 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                            <Building2 className="h-10 w-10" />
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <h3 className="text-xl font-semibold tracking-[-0.05em] text-[#21180d] dark:text-white">
                                            {titleOf(space, 'Facility')}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-[#6e604c] dark:text-white/56">
                                            {capacityOf(space)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : null}
            </main>
        </>
    );
}

function InfoBox({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UsersRound;
    label: string;
    value: string;
}) {
    return (
        <article className="rounded-[1.15rem] border border-[#eadcc2]/80 bg-[#fffaf0]/72 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <Icon className="h-5 w-5 text-[#9d7b3d] dark:text-[#f1d89b]" />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#21180d] dark:text-white">
                {value}
            </p>
        </article>
    );
}
