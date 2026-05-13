import SafeImage from '@/components/system/safe-image';
import { useAppearance } from '@/hooks/use-appearance';
import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    ExternalLink,
    Landmark,
    Menu,
    Moon,
    Palette,
    ShieldCheck,
    Sun,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export type PublicSiteSettings = {
    logo_url?: string | null;
    city_seal_url?: string | null;
    baguio_logo_url?: string | null;
    breathe_baguio_logo_url?: string | null;
    visitaUrl?: string | null;
    visita_url?: string | null;
    creativeBaguioUrl?: string | null;
    creative_baguio_url?: string | null;
    arts_url?: string | null;
};

type PageProps = {
    siteSettings?: PublicSiteSettings;
};

type NavChild = {
    label: string;
    href: string;
    external?: boolean;
};

type NavItem = {
    label: string;
    href: string;
    children?: NavChild[];
};

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Home',
        href: '/',
    },
    {
        label: 'Government',
        href: '/tourism-office',
        children: [
            { label: 'Tourism Office', href: '/tourism-office' },
            { label: 'City Government Website', href: 'https://main.baguio.gov.ph/', external: true },
        ],
    },
    {
        label: 'Citizens Charter',
        href: '/guidelines',
        children: [
            { label: 'Booking Guidelines', href: '/guidelines' },
            { label: 'Facilities and Rates', href: '/facilities' },
            { label: 'Contact Office', href: '/contact' },
        ],
    },
    {
        label: 'Tourism',
        href: '/tourism-office',
        children: [
            { label: 'Tourism Office', href: '/tourism-office' },
            { label: 'Baguio City Events', href: '/events?type=city' },
            { label: 'Event Calendar', href: '/calendar' },
        ],
    },
    {
        label: 'News & Announcements',
        href: '/events',
        children: [
            { label: 'BCCC Events', href: '/events?type=bccc' },
            { label: 'Baguio City Events', href: '/events?type=city' },
            { label: 'Event Highlights', href: '/events#highlights' },
        ],
    },
    {
        label: 'About',
        href: '/facilities',
        children: [
            { label: 'About BCCC', href: '/facilities' },
            { label: 'Venue Spaces', href: '/facilities#spaces' },
            { label: 'Amenities', href: '/facilities#amenities' },
        ],
    },
    {
        label: 'More',
        href: '/contact',
        children: [
            { label: 'Contact Us', href: '/contact' },
            { label: 'Availability Calendar', href: '/calendar' },
            { label: 'Book Your Event', href: '/book' },
        ],
    },
];

const ease = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function isActive(url: string, href: string): boolean {
    if (href.startsWith('http')) {
        return false;
    }

    if (href === '/') {
        return url === '/' || url.startsWith('/?');
    }

    return url === href || url.startsWith(`${href}/`) || url.startsWith(`${href}?`) || url.startsWith(`${href}#`);
}

function ThemeButton() {
    const { appearance, updateAppearance } = useAppearance();
    const [systemDark, setSystemDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const sync = () => {
            setSystemDark(mediaQuery.matches);
            setMounted(true);
        };

        sync();
        mediaQuery.addEventListener('change', sync);

        return () => mediaQuery.removeEventListener('change', sync);
    }, []);

    const isDark = appearance === 'dark' || (appearance === 'system' && systemDark);

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            className="group grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white/78 text-[#352819] shadow-[0_10px_28px_rgba(54,39,20,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#b08d48]/45 hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
            aria-label="Toggle theme"
        >
            {!mounted ? (
                <span className="h-4 w-4 rounded-full border border-current opacity-40" />
            ) : isDark ? (
                <Moon className="h-4 w-4 transition duration-300 group-hover:rotate-12" />
            ) : (
                <Sun className="h-4 w-4 transition duration-300 group-hover:rotate-45" />
            )}
        </button>
    );
}

function ExternalMiniLinks({
    visitaUrl,
    artsUrl,
}: {
    visitaUrl: string;
    artsUrl: string;
}) {
    return (
        <div className="hidden items-center gap-2 2xl:flex">

        </div>
    );
}

function DesktopNav({ url }: { url: string }) {
    return (
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
            {NAV_ITEMS.map((item) => {
                const active = isActive(url, item.href);

                return (
                    <div key={item.label} className="group relative">
                        <Link
                            href={item.href}
                            className={cx(
                                'inline-flex h-12 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition duration-300',
                                active
                                    ? 'bg-[#2f2517] text-white shadow-[0_18px_42px_rgba(48,36,21,0.16)] dark:bg-white dark:text-[#17120b]'
                                    : 'text-[#392d1d]/72 hover:bg-white/72 hover:text-[#17120b] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white',
                            )}
                        >
                            {item.label}
                            {item.children ? <ChevronDown className="h-3.5 w-3.5 opacity-60" /> : null}
                        </Link>

                        {item.children ? (
                            <div className="pointer-events-none absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 translate-y-2 opacity-0 transition duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                                <div className="mt-2 overflow-hidden rounded-[1.35rem] border border-black/10 bg-white/95 p-2 shadow-[0_28px_80px_rgba(46,34,18,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#111418]/95">
                                    {item.children.map((child) =>
                                        child.external ? (
                                            <a
                                                key={child.label}
                                                href={child.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#352819] transition hover:bg-[#f6efe1] dark:text-white dark:hover:bg-white/10"
                                            >
                                                {child.label}
                                                <ExternalLink className="h-3.5 w-3.5 opacity-55" />
                                            </a>
                                        ) : (
                                            <Link
                                                key={child.label}
                                                href={child.href}
                                                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#352819] transition hover:bg-[#f6efe1] dark:text-white dark:hover:bg-white/10"
                                            >
                                                {child.label}
                                            </Link>
                                        ),
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </nav>
    );
}

function MobileMenu({
    open,
    url,
    onClose,
}: {
    open: boolean;
    url: string;
    onClose: () => void;
}) {
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setExpanded(null);
        }
    }, [open]);

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[99990] xl:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-[#17120b]/36 backdrop-blur-xl dark:bg-black/50"
                        onClick={onClose}
                        aria-label="Close menu"
                    />

                    <motion.aside
                        className="absolute right-3 top-3 flex max-h-[calc(100vh-1.5rem)] w-[min(28rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.65rem] border border-black/10 bg-[#fffaf0]/96 shadow-[0_28px_90px_rgba(23,18,11,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#111418]/96"
                        initial={{ x: 32, opacity: 0, filter: 'blur(8px)' }}
                        animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ x: 32, opacity: 0, filter: 'blur(8px)' }}
                        transition={{ duration: 0.28, ease }}
                    >
                        <div className="flex items-center justify-between border-b border-black/10 px-4 py-4 dark:border-white/10">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b7739]">
                                    BCCC EASE
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#231a10] dark:text-white">
                                    Official Public Menu
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/70 text-[#231a10] transition hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
                                aria-label="Close menu"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                            {NAV_ITEMS.map((item) => {
                                const active = isActive(url, item.href);
                                const isExpanded = expanded === item.label;

                                return (
                                    <div key={item.label} className="mb-1">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={item.href}
                                                className={cx(
                                                    'min-h-12 flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                                                    active
                                                        ? 'bg-[#302517] text-white dark:bg-white dark:text-[#17120b]'
                                                        : 'text-[#2f2517] hover:bg-white/70 dark:text-white dark:hover:bg-white/10',
                                                )}
                                            >
                                                {item.label}
                                            </Link>

                                            {item.children ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpanded((current) =>
                                                            current === item.label ? null : item.label,
                                                        )
                                                    }
                                                    className="grid h-12 w-12 place-items-center rounded-2xl border border-black/10 bg-white/60 text-[#2f2517] dark:border-white/10 dark:bg-white/8 dark:text-white"
                                                    aria-label={`Toggle ${item.label}`}
                                                >
                                                    <ChevronDown
                                                        className={cx(
                                                            'h-4 w-4 transition',
                                                            isExpanded && 'rotate-180',
                                                        )}
                                                    />
                                                </button>
                                            ) : null}
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {item.children && isExpanded ? (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-1 space-y-1 rounded-2xl border border-black/10 bg-white/55 p-2 dark:border-white/10 dark:bg-white/5">
                                                        {item.children.map((child) =>
                                                            child.external ? (
                                                                <a
                                                                    key={child.label}
                                                                    href={child.href}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[#4b3b25] hover:bg-[#f5ead8] dark:text-white/80 dark:hover:bg-white/10"
                                                                >
                                                                    {child.label}
                                                                    <ExternalLink className="h-3.5 w-3.5 opacity-55" />
                                                                </a>
                                                            ) : (
                                                                <Link
                                                                    key={child.label}
                                                                    href={child.href}
                                                                    className="block rounded-xl px-3 py-2.5 text-sm text-[#4b3b25] hover:bg-[#f5ead8] dark:text-white/80 dark:hover:bg-white/10"
                                                                >
                                                                    {child.label}
                                                                </Link>
                                                            ),
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid gap-2 border-t border-black/10 p-4 dark:border-white/10">
                            <Link
                                href="/book"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2f2517] px-5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(47,37,23,0.22)] transition hover:-translate-y-0.5 dark:bg-white dark:text-[#17120b]"
                            >
                                <CalendarDays className="h-4 w-4" />
                                Book Your Event
                            </Link>
                        </div>
                    </motion.aside>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

export default function PublicHeader() {
    const { props, url } = usePage<PageProps>();
    const [mobileOpen, setMobileOpen] = useState(false);

    const settings = (props.siteSettings || {}) as PublicSiteSettings;

    const sealUrl = settings.city_seal_url || settings.logo_url || '/marketing/images/branding/FINAL.png';
    const breatheLogoUrl =
        settings.breathe_baguio_logo_url || settings.baguio_logo_url || '/marketing/images/logo/breathe-baguio.png';

    const visitaUrl = settings.visitaUrl || settings.visita_url || 'https://visita.baguio.gov.ph/';
    const artsUrl =
        settings.creativeBaguioUrl ||
        settings.creative_baguio_url ||
        settings.arts_url ||
        'https://creativecity.baguio.gov.ph/';

    useEffect(() => {
        setMobileOpen(false);
    }, [url]);

    useEffect(() => {
        document.body.classList.toggle('overflow-hidden', mobileOpen);

        return () => document.body.classList.remove('overflow-hidden');
    }, [mobileOpen]);

    const officialCaption = useMemo(
        () => (
            <div className="leading-tight">
                <p className="text-[14px] font-semibold uppercase tracking-[0.05rem] text-[#8d6a30] dark:text-[#f0d69a]">
                    Baguio Convention and Cultural Center
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#21180d] dark:text-white">
                    EVENTS ACCESS AND SCHEDULING ENGINE
                </p>
            </div>
        ),
        [],
    );

    return (
        <>
            <header className="bccc-public-header fixed inset-x-0 top-0 z-[99980] border-b border-black/8 bg-[#fffaf0]/88 shadow-[0_12px_50px_rgba(49,37,19,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0f1216]/82">
                <div className="bccc-public-header-inner mx-auto flex h-[68px] w-full max-w-[1920px] items-center gap-2 px-3 sm:px-4 lg:px-5 2xl:px-7">
                    <Link href="/" className="bccc-public-brand group flex min-w-0 items-center gap-3">
                        <span className="bccc-public-seal grid h-10 w-10 shrink-0 place-items-center overflow-hidden sm:h-11 sm:w-11">
                            <SafeImage
                                src={sealUrl}
                                fallbackSrc="/marketing/images/branding/FINAL.png"
                                alt="City Government of Baguio"
                                className="h-full w-full object-contain p-1"
                            />
                        </span>

                        <span className="bccc-public-caption hidden min-w-0 sm:block">
                            {officialCaption}
                        </span>
                    </Link>

                    <div className="hidden h-8 w-px bg-black/10 dark:bg-white/10 lg:block" />

                    <DesktopNav url={url} />

                    <div className="bccc-public-actions ml-auto flex shrink-0 items-center gap-2">
                        <ExternalMiniLinks visitaUrl={visitaUrl} artsUrl={artsUrl} />

                        <ThemeButton />

                        <SafeImage
                            src={breatheLogoUrl}
                            fallbackSrc="/marketing/images/branding/breathe-light.png"
                            alt="Breathe Baguio"
                            className="bccc-public-breathe-logo hidden h-8 w-auto max-w-[6.5rem] object-contain xl:block"
                            wrapperClassName="hidden h-8 w-[6.5rem] xl:grid"
                        />

                        <Link
                            href="/book"
                            className="hidden h-11 items-center gap-2 rounded-full bg-[#2f2517] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_45px_rgba(47,37,23,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4a3921] dark:bg-white dark:text-[#17120b] dark:hover:bg-[#f3ead9] lg:inline-flex"
                        >
                            <CalendarDays className="h-4 w-4" />
                            Book
                        </Link>

                        <button
                            type="button"
                            onClick={() => setMobileOpen((value) => !value)}
                            className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/78 text-[#2f2517] shadow-[0_10px_28px_rgba(54,39,20,0.08)] backdrop-blur-xl transition hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white xl:hidden"
                            aria-label="Open menu"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenu open={mobileOpen} url={url} onClose={() => setMobileOpen(false)} />
        </>
    );
}
