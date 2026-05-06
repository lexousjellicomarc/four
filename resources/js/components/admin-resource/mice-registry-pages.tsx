import { ResourcePageShell } from '@/components/admin-resource/resource-page-shell';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    Download,
    Edit3,
    FileBarChart,
    Plus,
    Printer,
    Save,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';

type PaginationLink = {
    url?: string | null;
    label?: string | null;
    active?: boolean;
};

type MiceRecord = {
    id?: number | string;
    booking_id?: number | string | null;
    event_name?: string | null;
    type_of_event?: string | null;
    organizer_name?: string | null;
    company_name?: string | null;
    venue_area?: string | null;
    venue?: string | null;
    event_date?: string | null;
    event_date_from?: string | null;
    event_date_to?: string | null;
    mice_category?: string | null;
    event_type?: string | null;
    local_participants?: number | string | null;
    foreign_participants?: number | string | null;
    participants_local?: number | string | null;
    participants_foreign?: number | string | null;
    total_participants?: number | string | null;
    room_nights?: number | string | null;
    revenue?: number | string | null;
    economic_impact?: number | string | null;
    remarks?: string | null;
    created_at?: string | null;
};

type BookingOption = {
    id: number | string;
    type_of_event?: string | null;
    company_name?: string | null;
    client_name?: string | null;
    booking_date_from?: string | null;
};

type Props = {
    records?: unknown;
    miceRecords?: unknown;
    registry?: unknown;
    miceRecord?: MiceRecord;
    record?: MiceRecord;
    bookings?: BookingOption[];
    filters?: {
        q?: string;
        date_from?: string;
        date_to?: string;
        mice_category?: string;
        event_type?: string;
    };
    stats?: Record<string, number | string>;
    generated_at?: string;
};

function currentRole() {
    if (window.location.pathname.startsWith('/manager')) return 'manager';

    return 'admin';
}

function basePath() {
    return currentRole() === 'manager'
        ? '/manager/reports/mice-registry'
        : '/admin/reports/mice-registry';
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

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown): string {
    const parsed = Number(value ?? 0);

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(parsed) ? parsed : 0);
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

function recordTitle(record: MiceRecord): string {
    return String(
        record.event_name ||
            record.type_of_event ||
            `MICE Record #${record.id}`,
    );
}

function organizer(record: MiceRecord): string {
    return String(
        record.organizer_name || record.company_name || 'No organizer',
    );
}

function venue(record: MiceRecord): string {
    return String(record.venue_area || record.venue || 'No venue');
}

function localParticipants(record: MiceRecord): number {
    return numberValue(record.local_participants ?? record.participants_local);
}

function foreignParticipants(record: MiceRecord): number {
    return numberValue(
        record.foreign_participants ?? record.participants_foreign,
    );
}

function totalParticipants(record: MiceRecord): number {
    const explicit = numberValue(record.total_participants);

    if (explicit > 0) return explicit;

    return localParticipants(record) + foreignParticipants(record);
}

function paginationLabel(label?: string | null) {
    return String(label || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&laquo;|&raquo;/g, '')
        .trim();
}

function MiceKpi({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: ReactNode;
    helper: string;
    icon: typeof FileBarChart;
}) {
    return (
        <article className="mice-kpi">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="backend-booking-label">{label}</p>
                    <strong>{value}</strong>
                </div>
                <div className="alh-admin-kpi-icon">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p>{helper}</p>
        </article>
    );
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

export function MiceRegistryIndexPage() {
    const { props } = usePage() as unknown as { props: Props };
    const path = basePath();
    const raw = props.records ?? props.miceRecords ?? props.registry;
    const records = useMemo(() => collection<MiceRecord>(raw), [raw]);
    const links = useMemo(() => linksOf(raw), [raw]);

    const [q, setQ] = useState(String(props.filters?.q ?? ''));
    const [dateFrom, setDateFrom] = useState(
        String(props.filters?.date_from ?? ''),
    );
    const [dateTo, setDateTo] = useState(String(props.filters?.date_to ?? ''));
    const [category, setCategory] = useState(
        String(props.filters?.mice_category ?? ''),
    );
    const [eventType, setEventType] = useState(
        String(props.filters?.event_type ?? ''),
    );

    const participants = records.reduce(
        (sum, record) => sum + totalParticipants(record),
        0,
    );
    const revenue = records.reduce(
        (sum, record) =>
            sum + numberValue(record.revenue ?? record.economic_impact),
        0,
    );
    const roomNights = records.reduce(
        (sum, record) => sum + numberValue(record.room_nights),
        0,
    );

    function applyFilters(event?: FormEvent) {
        event?.preventDefault();

        router.get(
            path,
            {
                q: q || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                mice_category: category || undefined,
                event_type: eventType || undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setQ('');
        setDateFrom('');
        setDateTo('');
        setCategory('');
        setEventType('');

        router.get(
            path,
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function destroy(record: MiceRecord) {
        if (!record.id) return;

        if (!window.confirm(`Delete MICE record "${recordTitle(record)}"?`))
            return;

        router.delete(`${path}/${record.id}`, {
            preserveScroll: true,
        });
    }

    const query = new URLSearchParams();

    if (q) query.set('q', q);
    if (dateFrom) query.set('date_from', dateFrom);
    if (dateTo) query.set('date_to', dateTo);
    if (category) query.set('mice_category', category);
    if (eventType) query.set('event_type', eventType);

    const suffix = query.toString() ? `?${query.toString()}` : '';

    return (
        <ResourcePageShell
            role={currentRole()}
            current="MICE Registry"
            eyebrow="Reports"
            title="MICE Registry"
            description="Monitor MICE-related events, participants, economic activity, and reporting records."
        >
            <div className="space-y-5">
                <section className="mice-hero">
                    <div>
                        <p className="backend-booking-label">MICE Registry</p>
                        <h1>
                            Reporting records for meetings, incentives,
                            conventions, and exhibitions.
                        </h1>
                        <span>
                            Keep reporting clean and printable. Use the form for
                            encoded entries and the print/export actions for
                            submission-ready reports.
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`${path}/create`}
                            className="alh-primary-button"
                        >
                            <Plus className="h-4 w-4" />
                            New Record
                        </Link>
                        <a
                            href={`${path}/export${suffix}`}
                            className="alh-secondary-button"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </a>
                        <a
                            href={`${path}/print${suffix}`}
                            target="_blank"
                            rel="noreferrer"
                            className="alh-secondary-button"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </a>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MiceKpi
                        label="Records"
                        value={props.stats?.records ?? records.length}
                        helper="Loaded MICE records in the current view."
                        icon={FileBarChart}
                    />
                    <MiceKpi
                        label="Participants"
                        value={props.stats?.participants ?? participants}
                        helper="Local and foreign participants combined."
                        icon={Users}
                    />
                    <MiceKpi
                        label="Room Nights"
                        value={props.stats?.room_nights ?? roomNights}
                        helper="Room-night count encoded for reporting."
                        icon={CalendarDays}
                    />
                    <MiceKpi
                        label="Revenue / Impact"
                        value={money(props.stats?.revenue ?? revenue)}
                        helper="Encoded revenue or economic impact."
                        icon={BarChart3}
                    />
                </section>

                <section className="mice-panel overflow-hidden">
                    <div className="mice-panel-header">
                        <div>
                            <p className="backend-booking-label">
                                Registry Records
                            </p>
                            <h2>
                                {records.length} visible record
                                {records.length === 1 ? '' : 's'}
                            </h2>
                            <span>
                                Filter by title, organizer, category, event
                                type, or event date range.
                            </span>
                        </div>
                    </div>

                    <form onSubmit={applyFilters} className="mice-filter-grid">
                        <div className="relative xl:col-span-2">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                className="backend-booking-input pl-10"
                                placeholder="Search event, organizer, venue..."
                            />
                        </div>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(event) =>
                                setDateFrom(event.target.value)
                            }
                            className="backend-booking-input"
                            aria-label="Date from"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(event) => setDateTo(event.target.value)}
                            className="backend-booking-input"
                            aria-label="Date to"
                        />

                        <select
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                            className="backend-booking-input"
                        >
                            <option value="">All categories</option>
                            <option value="meeting">Meeting</option>
                            <option value="incentive">Incentive</option>
                            <option value="convention">Convention</option>
                            <option value="exhibition">Exhibition</option>
                            <option value="event">Event</option>
                        </select>

                        <select
                            value={eventType}
                            onChange={(event) =>
                                setEventType(event.target.value)
                            }
                            className="backend-booking-input"
                        >
                            <option value="">All event types</option>
                            <option value="local">Local</option>
                            <option value="regional">Regional</option>
                            <option value="national">National</option>
                            <option value="international">International</option>
                        </select>

                        <button
                            type="submit"
                            className="alh-primary-button justify-center"
                        >
                            Apply
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="alh-secondary-button justify-center"
                        >
                            Reset
                        </button>
                    </form>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {records.map((record) => (
                            <article key={record.id} className="mice-row">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="alh-status-chip is-public">
                                            {cleanLabel(record.mice_category)}
                                        </span>
                                        <span className="booking-mini-pill">
                                            {cleanLabel(record.event_type)}
                                        </span>
                                        {record.booking_id ? (
                                            <span className="booking-mini-pill">
                                                Booking #{record.booking_id}
                                            </span>
                                        ) : null}
                                    </div>

                                    <h3>{recordTitle(record)}</h3>
                                    <p>
                                        {organizer(record)} · {venue(record)} ·{' '}
                                        {compactDate(
                                            record.event_date_from ||
                                                record.event_date,
                                        )}
                                    </p>

                                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                                        <div className="alh-admin-mini-box">
                                            <span>Participants</span>
                                            <strong>
                                                {totalParticipants(record)}
                                            </strong>
                                        </div>
                                        <div className="alh-admin-mini-box">
                                            <span>Local / Foreign</span>
                                            <strong>
                                                {localParticipants(record)} /{' '}
                                                {foreignParticipants(record)}
                                            </strong>
                                        </div>
                                        <div className="alh-admin-mini-box">
                                            <span>Room Nights</span>
                                            <strong>
                                                {numberValue(
                                                    record.room_nights,
                                                )}
                                            </strong>
                                        </div>
                                        <div className="alh-admin-mini-box">
                                            <span>Revenue</span>
                                            <strong>
                                                {money(
                                                    record.revenue ??
                                                        record.economic_impact,
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 xl:justify-end">
                                    <Link
                                        href={`${path}/${record.id}/edit`}
                                        className="alh-admin-neutral-button"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => destroy(record)}
                                        className="alh-admin-danger-button"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    <Pagination links={links} />
                </section>
            </div>
        </ResourcePageShell>
    );
}

export function MiceRegistryFormPage() {
    const { props } = usePage() as unknown as { props: Props };
    const path = basePath();
    const record = props.record ?? props.miceRecord;
    const isEdit = Boolean(record?.id);
    const bookings = props.bookings || [];

    const [form, setForm] = useState({
        booking_id: String(record?.booking_id ?? ''),
        event_name: String(record?.event_name || record?.type_of_event || ''),
        organizer_name: String(
            record?.organizer_name || record?.company_name || '',
        ),
        venue_area: String(record?.venue_area || record?.venue || ''),
        event_date_from: String(
            record?.event_date_from || record?.event_date || '',
        ),
        event_date_to: String(
            record?.event_date_to || record?.event_date || '',
        ),
        mice_category: String(record?.mice_category || 'meeting'),
        event_type: String(record?.event_type || 'local'),
        local_participants: String(
            record?.local_participants ?? record?.participants_local ?? '0',
        ),
        foreign_participants: String(
            record?.foreign_participants ?? record?.participants_foreign ?? '0',
        ),
        room_nights: String(record?.room_nights ?? '0'),
        revenue: String(record?.revenue ?? record?.economic_impact ?? '0'),
        remarks: String(record?.remarks || ''),
    });
    const [saving, setSaving] = useState(false);

    function submit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);

        const payload = {
            ...form,
            type_of_event: form.event_name,
            company_name: form.organizer_name,
            venue: form.venue_area,
            event_date: form.event_date_from,
            participants_local: form.local_participants,
            participants_foreign: form.foreign_participants,
            total_participants:
                numberValue(form.local_participants) +
                numberValue(form.foreign_participants),
            economic_impact: form.revenue,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        };

        if (isEdit) {
            router.put(`${path}/${record?.id}`, payload, options);
            return;
        }

        router.post(path, payload, options);
    }

    return (
        <ResourcePageShell
            role={currentRole()}
            current={isEdit ? 'Edit MICE Record' : 'Create MICE Record'}
            eyebrow="Reports"
            title={isEdit ? 'Edit MICE Record' : 'Create MICE Record'}
            description="Encode MICE report information in a clean two-column form."
        >
            <div className="space-y-5">
                <section className="mice-hero">
                    <div>
                        <p className="backend-booking-label">MICE Form</p>
                        <h1>
                            {isEdit
                                ? 'Update report record.'
                                : 'Encode a new report record.'}
                        </h1>
                        <span>
                            Keep MICE data consistent with bookings where
                            possible. Link a booking record when the MICE entry
                            came from an actual reservation.
                        </span>
                    </div>

                    <Link href={path} className="alh-secondary-button">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Registry
                    </Link>
                </section>

                <section className="mice-panel overflow-hidden">
                    <div className="mice-panel-header">
                        <div>
                            <p className="backend-booking-label">
                                Record Details
                            </p>
                            <h2>MICE registry form</h2>
                        </div>
                    </div>

                    <form onSubmit={submit} className="mice-form-grid">
                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Linked Booking
                            </span>
                            <select
                                value={form.booking_id}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        booking_id: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            >
                                <option value="">No linked booking</option>
                                {bookings.map((booking) => (
                                    <option key={booking.id} value={booking.id}>
                                        #{booking.id} ·{' '}
                                        {booking.type_of_event ||
                                            booking.company_name ||
                                            booking.client_name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Event Name
                            </span>
                            <input
                                value={form.event_name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        event_name: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                                required
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Organizer
                            </span>
                            <input
                                value={form.organizer_name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        organizer_name: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Venue Area
                            </span>
                            <input
                                value={form.venue_area}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        venue_area: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Date From
                            </span>
                            <input
                                type="date"
                                value={form.event_date_from}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        event_date_from: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Date To
                            </span>
                            <input
                                type="date"
                                value={form.event_date_to}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        event_date_to: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                MICE Category
                            </span>
                            <select
                                value={form.mice_category}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        mice_category: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            >
                                <option value="meeting">Meeting</option>
                                <option value="incentive">Incentive</option>
                                <option value="convention">Convention</option>
                                <option value="exhibition">Exhibition</option>
                                <option value="event">Event</option>
                            </select>
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Event Type
                            </span>
                            <select
                                value={form.event_type}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        event_type: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            >
                                <option value="local">Local</option>
                                <option value="regional">Regional</option>
                                <option value="national">National</option>
                                <option value="international">
                                    International
                                </option>
                            </select>
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Local Participants
                            </span>
                            <input
                                value={form.local_participants}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        local_participants: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Foreign Participants
                            </span>
                            <input
                                value={form.foreign_participants}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        foreign_participants:
                                            event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Room Nights
                            </span>
                            <input
                                value={form.room_nights}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        room_nights: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="backend-booking-label">
                                Revenue / Economic Impact
                            </span>
                            <input
                                value={form.revenue}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        revenue: event.target.value,
                                    }))
                                }
                                className="backend-booking-input"
                            />
                        </label>

                        <label className="grid gap-2 md:col-span-2">
                            <span className="backend-booking-label">
                                Remarks
                            </span>
                            <textarea
                                rows={5}
                                value={form.remarks}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        remarks: event.target.value,
                                    }))
                                }
                                className="backend-booking-input min-h-[130px] py-3"
                            />
                        </label>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="alh-primary-button justify-center disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {saving
                                    ? 'Saving...'
                                    : isEdit
                                      ? 'Update Record'
                                      : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </ResourcePageShell>
    );
}

export function MiceRegistryPrintPage() {
    const { props } = usePage() as unknown as { props: Props };
    const raw = props.records ?? props.miceRecords ?? props.registry;
    const records = collection<MiceRecord>(raw);
    const participants = records.reduce(
        (sum, record) => sum + totalParticipants(record),
        0,
    );
    const revenue = records.reduce(
        (sum, record) =>
            sum + numberValue(record.revenue ?? record.economic_impact),
        0,
    );

    return (
        <>
            <Head title="MICE Registry Print" />

            <div className="print-report-page">
                <div className="print-report-toolbar no-print">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="alh-primary-button"
                    >
                        <Printer className="h-4 w-4" />
                        Print MICE Report
                    </button>
                </div>

                <main className="print-report-paper">
                    <header className="print-report-header">
                        <p>MICE Registry Report</p>
                        <h1>Baguio Convention and Cultural Center</h1>
                        <span>
                            Generated {compactDate(props.generated_at)} ·{' '}
                            {records.length} records · {participants}{' '}
                            participants · {money(revenue)} revenue/impact
                        </span>
                    </header>

                    <section className="print-report-section">
                        <h2>Summary</h2>
                        <table className="print-report-table">
                            <tbody>
                                <tr>
                                    <td>Total Records</td>
                                    <td>{records.length}</td>
                                </tr>
                                <tr>
                                    <td>Total Participants</td>
                                    <td>{participants}</td>
                                </tr>
                                <tr>
                                    <td>Total Revenue / Economic Impact</td>
                                    <td>{money(revenue)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="print-report-section">
                        <h2>Registry Records</h2>
                        <table className="print-report-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Event</th>
                                    <th>Organizer</th>
                                    <th>Venue</th>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Participants</th>
                                    <th>Room Nights</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length > 0 ? (
                                    records.map((record) => (
                                        <tr key={record.id}>
                                            <td>#{record.id}</td>
                                            <td>{recordTitle(record)}</td>
                                            <td>{organizer(record)}</td>
                                            <td>{venue(record)}</td>
                                            <td>
                                                {compactDate(
                                                    record.event_date_from ||
                                                        record.event_date,
                                                )}{' '}
                                                to{' '}
                                                {compactDate(
                                                    record.event_date_to ||
                                                        record.event_date,
                                                )}
                                            </td>
                                            <td>
                                                {cleanLabel(
                                                    record.mice_category,
                                                )}
                                            </td>
                                            <td>
                                                {cleanLabel(record.event_type)}
                                            </td>
                                            <td>{totalParticipants(record)}</td>
                                            <td>
                                                {numberValue(
                                                    record.room_nights,
                                                )}
                                            </td>
                                            <td>
                                                {money(
                                                    record.revenue ??
                                                        record.economic_impact,
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10}>
                                            No MICE records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <footer className="print-report-footer">
                        <strong>BCCC EASE</strong>
                        <span>
                            MICE registry generated for internal tourism and
                            convention reporting.
                        </span>
                    </footer>
                </main>
            </div>
        </>
    );
}
