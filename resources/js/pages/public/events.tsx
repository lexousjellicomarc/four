import EventsCinemaShowcase from '@/components/public/events-cinema-showcase';
import {
    EditorialFrame,
    EmptyPublicPanel,
    SectionIntro,
    cx,
    descriptionOf,
    formatPublicDate,
    imageOf,
    titleOf,
    visibleRecords,
    type PublicImageRecord,
} from '@/components/public/public-display-system';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Clock3,
    Film,
    MapPin,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type EventsPageProps = {
    events?: PublicImageRecord[];
    bcccEvents?: PublicImageRecord[];
    cityEvents?: PublicImageRecord[];
};

function categoryOf(event: PublicImageRecord) {
    return String(event.category || event.event_category || 'Event');
}

function dateOf(event: PublicImageRecord) {
    return event.starts_at || event.startsAt || event.date || null;
}

export default function EventsPage() {
    const { props } = usePage<EventsPageProps>();
    const [filter, setFilter] = useState<'all' | 'bccc' | 'city'>('all');

    const allEvents = useMemo(
        () => visibleRecords([
            ...(props.events ?? []),
            ...(props.bcccEvents ?? []),
            ...(props.cityEvents ?? []),
        ]),
        [props.events, props.bcccEvents, props.cityEvents],
    );

    const bcccEvents = useMemo(
        () =>
            allEvents.filter((event) => {
                const category = categoryOf(event).toLowerCase();

                return category.includes('bccc') || !category.includes('city');
            }),
        [allEvents],
    );

    const cityEvents = useMemo(
        () =>
            allEvents.filter((event) => {
                const category = categoryOf(event).toLowerCase();

                return category.includes('city') || category.includes('baguio');
            }),
        [allEvents],
    );

    const visibleEvents =
        filter === 'bccc'
            ? bcccEvents
            : filter === 'city'
              ? cityEvents
              : allEvents;

    const featured = visibleEvents[0];

    return (
        <>
            <Head title="Events" />

            <main className="public-display-page min-h-screen">
                <section className="public-section-shell py-16 lg:py-20">
                    <EditorialFrame
                        label="Events"
                        left={
                            <div className="space-y-3">
                                <p className="public-frame-label green">Nav</p>

                                {[
                                    ['all', 'All Events'],
                                    ['bccc', 'BCCC Events'],
                                    ['city', 'Baguio City Events'],
                                ].map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFilter(key as 'all' | 'bccc' | 'city')}
                                        className={cx(
                                            'block w-full rounded-full border px-4 py-2 text-left text-sm font-semibold transition',
                                            filter === key
                                                ? 'border-[#2f2517] bg-[#2f2517] text-white dark:border-white dark:bg-white dark:text-[#17120b]'
                                                : 'border-[#d9c7a6]/70 bg-white/65 text-[#2f2517] hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12',
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        }
                        main={
                            <div>
                                <SectionIntro
                                    kicker="Event Highlights"
                                    title="Cinematic public event browsing"
                                    description="Events are displayed through a dark curved film carousel inspired by your reference, with smooth transitions and center-focused details."
                                />

                                <div className="mt-8 grid gap-3 md:grid-cols-3">
                                    <MiniStat icon={CalendarDays} label="All Events" value={allEvents.length.toString()} />
                                    <MiniStat icon={Film} label="BCCC" value={bcccEvents.length.toString()} />
                                    <MiniStat icon={Sparkles} label="Baguio City" value={cityEvents.length.toString()} />
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
                                                alt={titleOf(featured, 'Featured event')}
                                                className="h-40 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="grid h-40 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                                <CalendarDays className="h-10 w-10" />
                                            </div>
                                        )}

                                        <div className="p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                                {formatPublicDate(dateOf(featured)) || categoryOf(featured)}
                                            </p>
                                            <h3 className="mt-2 text-lg font-semibold tracking-[-0.045em] text-[#21180d] dark:text-white">
                                                {titleOf(featured, 'Featured event')}
                                            </h3>
                                        </div>
                                    </article>
                                ) : (
                                    <p className="text-sm leading-7 text-[#6e604c] dark:text-white/56">
                                        Create event highlights from the Content Manager.
                                    </p>
                                )}
                            </div>
                        }
                        footer={
                            <p className="public-readable text-sm text-[#6e604c] dark:text-white/58">
                                The event layout prioritizes visual storytelling while keeping details readable, left-aligned, and comfortable to scan.
                            </p>
                        }
                    />
                </section>

                <EventsCinemaShowcase
                    items={allEvents}
                    bcccEvents={bcccEvents}
                    cityEvents={cityEvents}
                />

                <section className="public-section-shell py-16">
                    <SectionIntro
                        kicker="Event Directory"
                        title="Browse event highlights"
                        description="Use the cards below for quick scanning after the cinematic carousel."
                    />

                    <div className="mt-6 flex flex-wrap gap-2">
                        {[
                            ['all', 'All Events'],
                            ['bccc', 'BCCC Events'],
                            ['city', 'Baguio City Events'],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setFilter(key as 'all' | 'bccc' | 'city')}
                                className={cx(
                                    'rounded-full px-5 py-2 text-sm font-bold transition',
                                    filter === key
                                        ? 'bg-[#2f2517] text-white dark:bg-white dark:text-[#17120b]'
                                        : 'border border-[#d9c7a6]/70 bg-white/70 text-[#2f2517] hover:bg-[#f7f0e3] dark:border-white/10 dark:bg-white/7 dark:text-white dark:hover:bg-white/12',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {visibleEvents.length > 0 ? (
                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {visibleEvents.map((event, index) => (
                                <article
                                    key={event.id ?? index}
                                    className="public-smooth-card overflow-hidden rounded-[1.5rem] border border-[#d9c7a6]/70 bg-white/78 shadow-[0_20px_60px_rgba(47,37,23,0.08)] dark:border-white/10 dark:bg-white/[0.05]"
                                >
                                    {imageOf(event) ? (
                                        <img
                                            src={imageOf(event)}
                                            alt={titleOf(event, 'Event')}
                                            className="h-64 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="grid h-64 place-items-center bg-[#f4ead8] text-[#8b672d] dark:bg-white/10 dark:text-[#f1d89b]">
                                            <CalendarDays className="h-12 w-12" />
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-2 rounded-full bg-[#f4ead8] px-3 py-1.5 text-xs font-bold text-[#7a5a24] dark:bg-white/10 dark:text-[#f1d89b]">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                {formatPublicDate(dateOf(event)) || 'Event'}
                                            </span>

                                            <span className="inline-flex items-center gap-2 rounded-full bg-[#f4ead8] px-3 py-1.5 text-xs font-bold text-[#7a5a24] dark:bg-white/10 dark:text-[#f1d89b]">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {categoryOf(event)}
                                            </span>
                                        </div>

                                        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.055em] text-[#21180d] dark:text-white">
                                            {titleOf(event, 'Event')}
                                        </h3>

                                        <p className="public-readable mt-3 line-clamp-4 text-sm text-[#6e604c] dark:text-white/56">
                                            {descriptionOf(event, 'A public event highlight connected to BCCC or the City of Baguio.')}
                                        </p>

                                        {event.external_url || event.externalUrl ? (
                                            <a
                                                href={String(event.external_url || event.externalUrl)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b]"
                                            >
                                                Open Link
                                                <ArrowRight className="h-4 w-4" />
                                            </a>
                                        ) : null}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-8">
                            <EmptyPublicPanel
                                icon={CalendarDays}
                                title="No events found"
                                description="Event highlights created in the Content Manager will appear on this page."
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
    icon: typeof CalendarDays;
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
