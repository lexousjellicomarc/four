import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Link, router, usePage } from '@inertiajs/react';
import { Eye, Mail, MessageSquare, Phone, Search, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type Inquiry = {
    id: number | string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    subject?: string | null;
    inquiry_type?: string | null;
    event_date?: string | null;
    venue?: string | null;
    guest_count?: number | string | null;
    message?: string | null;
    status?: string | null;
    read_at?: string | null;
    created_at?: string | null;
};

type PageProps = {
    workspaceRole?: string;
    inquiries?: unknown;
    messages?: unknown;
    filters?: {
        q?: string;
        status?: string;
    };
};

type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

function currentRole() {
    const path = window.location.pathname;

    if (path.startsWith('/manager')) return 'manager';
    if (path.startsWith('/staff')) return 'staff';

    return 'admin';
}

function basePath(role: string) {
    if (role === 'manager') return '/manager/inquiries';
    if (role === 'staff') return '/staff/inquiries';

    return '/admin/inquiries';
}

function collection<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];

    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { data?: unknown[] }).data)
    ) {
        return (value as { data: T[] }).data;
    }

    return [];
}

function linksOf(value: unknown): PaginationLink[] {
    if (
        value &&
        typeof value === 'object' &&
        Array.isArray((value as { links?: PaginationLink[] }).links)
    ) {
        return (value as { links: PaginationLink[] }).links;
    }

    return [];
}

function cleanLabel(value?: string | null): string {
    return String(value || '—')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compactDate(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(date);
}

function compactDateTime(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function statusClass(value?: string | null) {
    const status = String(value || '').toLowerCase();

    if (['read', 'replied', 'closed'].includes(status)) return 'is-good';
    if (status === 'new') return 'is-warn';

    return '';
}

function paginationLabel(label?: string | null) {
    return String(label || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;|&raquo;/g, '')
        .trim();
}

function Pagination({ links }: { links: PaginationLink[] }) {
    if (!links.length) return null;

    return (
        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-5 dark:border-slate-800">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                            link.active
                                ? 'border-[#20242b] bg-[#20242b] text-white dark:border-white dark:bg-white dark:text-slate-950'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                        aria-label={paginationLabel(link.label)}
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/60"
                        dangerouslySetInnerHTML={{ __html: link.label || '' }}
                    />
                ),
            )}
        </div>
    );
}

export function InquiriesPage() {
    const { props } = usePage() as unknown as { props: PageProps };
    const role = String(props.workspaceRole || currentRole());
    const path = basePath(role);
    const raw = props.inquiries ?? props.messages;
    const allInquiries = useMemo(() => collection<Inquiry>(raw), [raw]);
    const pageLinks = useMemo(() => linksOf(raw), [raw]);

    const [q, setQ] = useState(String(props.filters?.q ?? ''));
    const [status, setStatus] = useState(String(props.filters?.status ?? ''));

    const inquiries = useMemo(() => {
        const needle = q.toLowerCase().trim();

        return allInquiries.filter((inquiry) => {
            const matchesSearch =
                !needle ||
                [
                    inquiry.name,
                    inquiry.email,
                    inquiry.phone,
                    inquiry.subject,
                    inquiry.inquiry_type,
                    inquiry.venue,
                    inquiry.message,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(needle);

            const matchesStatus =
                !status ||
                String(inquiry.status || '').toLowerCase() ===
                    status.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [allInquiries, q, status]);

    const unread = allInquiries.filter(
        (item) => String(item.status || '').toLowerCase() === 'new',
    ).length;
    const replied = allInquiries.filter(
        (item) => String(item.status || '').toLowerCase() === 'replied',
    ).length;
    const closed = allInquiries.filter(
        (item) => String(item.status || '').toLowerCase() === 'closed',
    ).length;

    function search(event: FormEvent) {
        event.preventDefault();

        router.get(
            path,
            {
                q: q || undefined,
                status: status || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function updateStatus(inquiry: Inquiry, nextStatus: string) {
        router.put(
            `${path}/${inquiry.id}`,
            { status: nextStatus },
            { preserveScroll: true },
        );
    }

    function destroy(inquiry: Inquiry) {
        if (
            !window.confirm(
                `Delete inquiry "${inquiry.subject || inquiry.id}"?`,
            )
        )
            return;

        router.delete(`${path}/${inquiry.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <ResourcePageShell
            role={props.workspaceRole}
            current="Inquiries"
            eyebrow="Client Communication"
            title="Inquiries"
            description="Review public contact messages, event questions, and venue inquiries in a clean backend inbox."
        >
            <div className="space-y-5">
                <section className="inquiry-hero">
                    <div>
                        <p className="backend-booking-label">
                            Public Inquiry Inbox
                        </p>
                        <h1>Centralized messages from the public website.</h1>
                        <span>
                            Keep client messages, booking questions, preferred
                            dates, venue details, and follow-up status in one
                            compact operations screen.
                        </span>
                    </div>

                    <Link
                        href="/contact"
                        target="_blank"
                        className="alh-primary-button"
                    >
                        <Eye className="h-4 w-4" />
                        Public Contact Page
                    </Link>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article className="inquiry-kpi">
                        <p className="backend-booking-label">Loaded</p>
                        <strong>{allInquiries.length}</strong>
                        <span>
                            Total loaded inquiries from the current page.
                        </span>
                    </article>
                    <article className="inquiry-kpi">
                        <p className="backend-booking-label">New</p>
                        <strong>{unread}</strong>
                        <span>Messages requiring first review.</span>
                    </article>
                    <article className="inquiry-kpi">
                        <p className="backend-booking-label">Replied</p>
                        <strong>{replied}</strong>
                        <span>Messages already answered by staff.</span>
                    </article>
                    <article className="inquiry-kpi">
                        <p className="backend-booking-label">Closed</p>
                        <strong>{closed}</strong>
                        <span>Resolved or archived inquiry records.</span>
                    </article>
                </section>

                <section className="inquiry-panel overflow-hidden">
                    <div className="inquiry-panel-header">
                        <div>
                            <p className="backend-booking-label">Inbox</p>
                            <h2>
                                {inquiries.length} visible inquiry
                                {inquiries.length === 1 ? '' : 'ies'}
                            </h2>
                            <span>
                                Messages are compressed into rows. Expand/open
                                only the records that need action.
                            </span>
                        </div>

                        <form onSubmit={search} className="inquiry-filter-grid">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={q}
                                    onChange={(event) =>
                                        setQ(event.target.value)
                                    }
                                    className="backend-booking-input pl-10"
                                    placeholder="Search inquiries..."
                                />
                            </div>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="backend-booking-input"
                            >
                                <option value="">All statuses</option>
                                <option value="new">New</option>
                                <option value="read">Read</option>
                                <option value="replied">Replied</option>
                                <option value="closed">Closed</option>
                            </select>

                            <button
                                type="submit"
                                className="alh-primary-button justify-center"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {inquiries.length > 0 ? (
                            inquiries.map((inquiry) => (
                                <article
                                    key={inquiry.id}
                                    className="inquiry-row"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            <span
                                                className={`alh-status-chip ${statusClass(inquiry.status)}`}
                                            >
                                                {cleanLabel(inquiry.status)}
                                            </span>
                                            <span className="booking-mini-pill">
                                                {cleanLabel(
                                                    inquiry.inquiry_type ||
                                                        'Inquiry',
                                                )}
                                            </span>
                                            <span className="booking-mini-pill">
                                                #{inquiry.id}
                                            </span>
                                        </div>

                                        <h3>
                                            {inquiry.subject || 'No subject'}
                                        </h3>
                                        <p>
                                            {inquiry.name || 'No name'} ·{' '}
                                            {inquiry.email || 'No email'} ·{' '}
                                            {compactDateTime(
                                                inquiry.created_at,
                                            )}
                                        </p>

                                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                                            <div className="alh-admin-mini-box">
                                                <span>Phone</span>
                                                <strong>
                                                    {inquiry.phone || 'Not set'}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Preferred Date</span>
                                                <strong>
                                                    {compactDate(
                                                        inquiry.event_date,
                                                    )}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Venue</span>
                                                <strong>
                                                    {inquiry.venue || 'Not set'}
                                                </strong>
                                            </div>
                                            <div className="alh-admin-mini-box">
                                                <span>Guests</span>
                                                <strong>
                                                    {inquiry.guest_count ||
                                                        'Not set'}
                                                </strong>
                                            </div>
                                        </div>

                                        {inquiry.message ? (
                                            <p className="mt-3 line-clamp-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                                                {inquiry.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap gap-2 xl:justify-end">
                                        <a
                                            href={`mailto:${inquiry.email || ''}`}
                                            className="alh-admin-neutral-button"
                                        >
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </a>

                                        {inquiry.phone ? (
                                            <a
                                                href={`tel:${inquiry.phone}`}
                                                className="alh-admin-neutral-button"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </a>
                                        ) : null}

                                        <select
                                            value={inquiry.status || 'new'}
                                            onChange={(event) =>
                                                updateStatus(
                                                    inquiry,
                                                    event.target.value,
                                                )
                                            }
                                            className="backend-booking-input min-h-10 w-auto"
                                        >
                                            <option value="new">New</option>
                                            <option value="read">Read</option>
                                            <option value="replied">
                                                Replied
                                            </option>
                                            <option value="closed">
                                                Closed
                                            </option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => destroy(inquiry)}
                                            className="alh-admin-danger-button"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="ops-empty-state">
                                <MessageSquare className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                                <h3>No inquiries found</h3>
                                <p>
                                    Public contact messages and client inquiries
                                    will appear here.
                                </p>
                            </div>
                        )}
                    </div>

                    <Pagination links={pageLinks} />
                </section>
            </div>
        </ResourcePageShell>
    );
}
