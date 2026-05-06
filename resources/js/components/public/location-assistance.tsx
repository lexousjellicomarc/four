import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import type { SiteSettings } from '@/layouts/public-layout';

export default function LocationAssistance() {
    const page = usePage<{ siteSettings?: SiteSettings }>();
    const settings = page.props.siteSettings;

    const openMapUrl =
        settings?.openMapUrl ||
        'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines';

    return (
        <section className="public-container public-section">
            <div className="grid overflow-hidden rounded-[24px] border border-[var(--public-line)] bg-[var(--public-paper)] lg:grid-cols-[0.95fr_1.05fr]">
                <div className="grid content-between gap-12 p-6 sm:p-8 lg:p-10">
                    <div>
                        <div className="public-kicker">Location</div>
                        <h2 className="public-section-title mt-5">
                            Find BCCC and get direct assistance.
                        </h2>
                    </div>

                    <div className="grid gap-4 text-sm text-[var(--public-muted)]">
                        <span className="inline-flex items-start gap-3">
                            <MapPin className="mt-1 h-4 w-4 shrink-0" />
                            {settings?.address || 'CH3X+RRW, Baguio, Benguet, Philippines'}
                        </span>

                        <div className="flex flex-wrap gap-3">
                            <a href={openMapUrl} target="_blank" rel="noreferrer" className="public-pill-primary">
                                Open Map
                                <ArrowUpRight className="h-4 w-4" />
                            </a>
                            <Link href="/contact" className="public-pill-secondary">
                                Contact Office
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="min-h-[28rem] bg-[var(--public-soft)]">
                    <iframe
                        title="BCCC map"
                        src={
                            settings?.mapEmbedUrl ||
                            'https://www.google.com/maps?q=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines&z=16&output=embed'
                        }
                        className="h-full min-h-[28rem] w-full border-0 grayscale-[0.25]"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>
            </div>
        </section>
    );
}
