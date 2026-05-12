import SafeImage from '@/components/system/safe-image';
import {
    backendHomeHref,
    backendNavSections,
    backendRoleLabel,
    filterBackendSectionsByPermission,
    getBackendRole,
    isBackendActive,
    sectionIsActive,
    type BackendNavItem,
    type BackendNavSection,
} from '@/lib/backend-navigation';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Circle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type AuthUser = {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    role_name?: string | null;
    permissions?: string[];
};

type SharedProps = {
    auth?: {
        user?: AuthUser | null;
        permissions?: string[];
    };
};

const ease = [0.22, 1, 0.36, 1] as const;

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function sectionTone(index: number, active: boolean, open: boolean) {
    const tones = [
        {
            accent: 'from-[#2f2517] to-[#7a5a24]',
            icon:
                active || open
                    ? 'bg-[#2f2517] text-white dark:bg-white dark:text-[#17120b]'
                    : 'bg-[#efe2c8] text-[#7a5a24] dark:bg-white/8 dark:text-[#f1d89b]',
        },
        {
            accent: 'from-[#765421] to-[#b08d48]',
            icon:
                active || open
                    ? 'bg-[#765421] text-white dark:bg-white dark:text-[#17120b]'
                    : 'bg-[#f2e6ce] text-[#8b672d] dark:bg-white/8 dark:text-[#f1d89b]',
        },
        {
            accent: 'from-[#36424b] to-[#7a8792]',
            icon:
                active || open
                    ? 'bg-[#36424b] text-white dark:bg-white dark:text-[#17120b]'
                    : 'bg-slate-200 text-slate-700 dark:bg-white/8 dark:text-white/78',
        },
        {
            accent: 'from-[#203a43] to-[#4c7d7f]',
            icon:
                active || open
                    ? 'bg-[#203a43] text-white dark:bg-white dark:text-[#17120b]'
                    : 'bg-teal-50 text-teal-800 dark:bg-white/8 dark:text-white/78',
        },
        {
            accent: 'from-[#442e54] to-[#8a6aa1]',
            icon:
                active || open
                    ? 'bg-[#442e54] text-white dark:bg-white dark:text-[#17120b]'
                    : 'bg-violet-50 text-violet-800 dark:bg-white/8 dark:text-white/78',
        },
    ];

    return tones[index % tones.length];
}

function NavLeaf({
    item,
    currentUrl,
}: {
    item: BackendNavItem;
    currentUrl: string;
}) {
    const Icon = item.icon as LucideIcon | undefined;
    const active = isBackendActive(currentUrl, item.href, item.exact);

    return (
        <Link
            href={item.href}
            className={cx(
                'group relative flex min-h-[3.1rem] items-center gap-3 rounded-[1rem] px-3 py-2.5 text-sm font-semibold transition duration-200',
                active
                    ? 'bg-[#2f2517] text-white shadow-[0_16px_38px_rgba(47,37,23,0.20)] dark:bg-white dark:text-[#17120b]'
                    : 'text-[#51412c] hover:bg-white/80 hover:text-[#21180d] dark:text-white/66 dark:hover:bg-white/10 dark:hover:text-white',
            )}
        >
            {active ? (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#d8b56d] dark:bg-[#17120b]" />
            ) : null}

            <span
                className={cx(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition',
                    active
                        ? 'bg-white/14 text-white dark:bg-[#17120b]/8 dark:text-[#17120b]'
                        : 'bg-[#efe3cd] text-[#8b672d] group-hover:bg-[#f7ecd8] dark:bg-white/8 dark:text-[#f4d894]',
                )}
            >
                {Icon ? <Icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
            </span>

            <span className="min-w-0 flex-1">
                <span className="block truncate">{item.title}</span>

                {item.description ? (
                    <span
                        className={cx(
                            'mt-0.5 block truncate text-[11px] font-medium',
                            active
                                ? 'text-white/62 dark:text-[#17120b]/58'
                                : 'text-[#7b6b55] dark:text-white/40',
                        )}
                    >
                        {item.description}
                    </span>
                ) : null}
            </span>
        </Link>
    );
}

function NavSectionBlock({
    section,
    index,
    currentUrl,
    open,
    onToggle,
}: {
    section: BackendNavSection;
    index: number;
    currentUrl: string;
    open: boolean;
    onToggle: () => void;
}) {
    const active = sectionIsActive(currentUrl, section);
    const Icon = section.icon as LucideIcon | undefined;
    const tone = sectionTone(index, active, open);

    return (
        <section
            className={cx(
                'overflow-hidden rounded-[1.18rem] border transition duration-200',
                open
                    ? 'border-[#d0b886]/80 bg-white/72 shadow-[0_14px_34px_rgba(47,37,23,0.08)] dark:border-white/12 dark:bg-white/[0.055]'
                    : 'border-[#e0cfad]/70 bg-white/42 hover:bg-white/60 dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.055]',
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                className="relative flex min-h-[3.35rem] w-full items-center gap-3 px-3 py-2.5 text-left transition duration-200"
                aria-expanded={open}
            >
                <span
                    className={cx(
                        'absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b opacity-80',
                        tone.accent,
                        active || open ? 'opacity-100' : 'opacity-35',
                    )}
                />

                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl transition', tone.icon)}>
                    {Icon ? <Icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[#21180d] dark:text-white">
                        {section.title}
                    </span>

                    {section.description ? (
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-[#7a6b55] dark:text-white/42">
                            {section.description}
                        </span>
                    ) : null}
                </span>

                {active && !open ? (
                    <span className="mr-1 h-2 w-2 shrink-0 rounded-full bg-[#b08d48] dark:bg-[#f1d89b]" />
                ) : null}

                <ChevronDown
                    className={cx(
                        'h-4 w-4 shrink-0 text-[#7a6b55] transition duration-200 dark:text-white/48',
                        open && 'rotate-180',
                    )}
                />
            </button>

            <AnimatePresence initial={false}>
                {open ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-1 border-t border-[#e6d8bd]/70 p-1.5 dark:border-white/10">
                            {section.items.map((item) => (
                                <NavLeaf
                                    key={`${section.key}-${item.href}`}
                                    item={item}
                                    currentUrl={currentUrl}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </section>
    );
}

export function AppSidebar() {
    const page = usePage();
    const props = page.props as SharedProps;
    const role = getBackendRole(props.auth);
    const user = props.auth?.user;

    const permissions = useMemo(
        () => [
            ...((props.auth?.permissions ?? []) as string[]),
            ...((user?.permissions ?? []) as string[]),
        ],
        [props.auth?.permissions, user?.permissions],
    );

    const sections = useMemo(
        () => filterBackendSectionsByPermission(backendNavSections(role), permissions),
        [role, permissions],
    );

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setOpenSections((current) => {
            const next = { ...current };

            sections.forEach((section) => {
                if (sectionIsActive(page.url, section)) {
                    next[section.key] = true;
                }
            });

            return next;
        });
    }, [page.url, sections]);

    return (
        <aside className="backend-sidebar fixed inset-y-0 left-0 z-[80] hidden w-[17.25rem] border-r border-[#d9c7a6]/70 bg-[#fffaf0]/90 shadow-[18px_0_80px_rgba(47,37,23,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#101419]/90 lg:flex lg:flex-col">
            <div className="flex min-h-0 flex-1 flex-col p-3">
                <Link
                    href={backendHomeHref(role)}
                    className="group relative overflow-hidden rounded-[1.35rem] border border-[#d9c7a6]/70 bg-white/82 p-4 shadow-[0_18px_44px_rgba(47,37,23,0.10)] transition hover:border-[#b08d48]/70 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,181,109,0.20),transparent_45%)]" />

                    <div className="relative flex items-center gap-3">
                        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-[#d8b56d]/70 bg-white shadow-[0_16px_36px_rgba(47,37,23,0.16)] dark:border-white/12 dark:bg-white">
                            <SafeImage
                                src="/marketing/images/logo/bccc-seal.png"
                                fallbackSrc="/marketing/images/logo/bccc-seal.png"
                                alt="BCCC EASE"
                                className="h-full w-full object-contain p-1.5"
                                wrapperClassName="h-full w-full rounded-full border-0"
                            />
                        </span>

                        <span className="min-w-0">
                            <span className="block text-base font-semibold tracking-tight text-[#21180d] dark:text-white">
                                BCCC EASE
                            </span>
                            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7b3d] dark:text-[#f1d89b]">
                                {backendRoleLabel(role)}
                            </span>
                        </span>
                    </div>
                </Link>

                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7b3d] dark:text-[#f1d89b]">
                        Navigation
                    </p>

                    <div className="space-y-2">
                        {sections.map((section, index) => (
                            <NavSectionBlock
                                key={section.key}
                                section={section}
                                index={index}
                                currentUrl={page.url}
                                open={openSections[section.key] === true}
                                onToggle={() =>
                                    setOpenSections((current) => ({
                                        ...current,
                                        [section.key]: current[section.key] !== true,
                                    }))
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
