import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Edit3, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import TourismMemberManager, { type TourismMemberRow } from '@/components/admin/tourism-member-manager';

type RowId = number | string;

type EventRow = {
  id: RowId;
  title: string;
  venue: string;
  date: string;
  time: string | null;
  description: string;
  note: string;
  highlighted: boolean;
  images: string[];
  scope?: 'bccc' | 'city';
  isPublic?: boolean;
};

type PackageRow = {
  id: RowId;
  title: string;
  description: string;
  images: string[];
};

type CalendarBlockRow = {
  id: RowId;
  title: string;
  area: string;
  block: 'AM' | 'PM' | 'EVE' | 'DAY';
  dateFrom: string;
  dateTo: string;
  note: string;
  statusColor: 'red' | 'gold' | 'blue';
};

type SpaceRow = {
  id: RowId;
  title: string;
  category: string;
  capacity: string;
  shortDescription: string;
  summary: string;
  details: string[];
  lightImage: string;
  darkImage: string;
  homepageVisible: boolean;
};

type StatRow = {
  id: RowId;
  label: string;
  value: string;
  suffix: string;
};

type SiteConfigState = {
  mapEmbedUrl: string;
  openMapUrl: string;
  address: string;
  phone: string;
  email: string;
  visitaUrl: string;
  creativeBaguioUrl: string;
  footerDescription: string;
  footerCopyright: string;
};

type AdminHomePageProps = {
  initialBcccEvents?: EventRow[];
  initialCityEvents?: EventRow[];
  initialPackages?: PackageRow[];
  initialCalendarBlocks?: CalendarBlockRow[];
  initialSpaces?: SpaceRow[];
  initialStats?: StatRow[];
  initialSiteConfig?: SiteConfigState;
  initialTourismMembers?: TourismMemberRow[];
};

type NoticeState = { type: 'success' | 'error'; text: string } | null;
type FieldErrors = Record<string, string>;

type EventFormState = {
  scope: 'bccc' | 'city';
  title: string;
  venue: string;
  date: string;
  time: string;
  description: string;
  note: string;
  highlighted: boolean;
  isPublic: boolean;
  files: File[];
};

type PackageFormState = {
  title: string;
  description: string;
  files: File[];
};

type CalendarBlockFormState = {
  title: string;
  area: string;
  block: 'AM' | 'PM' | 'EVE' | 'DAY';
  dateFrom: string;
  dateTo: string;
  note: string;
  statusColor: 'red' | 'gold' | 'blue';
};

type SpaceFormState = {
  title: string;
  category: string;
  capacity: string;
  shortDescription: string;
  summary: string;
  detailsText: string;
  homepageVisible: boolean;
  lightFile: File | null;
  darkFile: File | null;
};

type StatFormState = {
  label: string;
  value: string;
  suffix: string;
};

const emptyEventForm: EventFormState = {
  scope: 'bccc',
  title: '',
  venue: '',
  date: '',
  time: '',
  description: '',
  note: '',
  highlighted: false,
  isPublic: true,
  files: [],
};

const emptyPackageForm: PackageFormState = {
  title: '',
  description: '',
  files: [],
};

const emptyCalendarBlockForm: CalendarBlockFormState = {
  title: '',
  area: '',
  block: 'DAY',
  dateFrom: '',
  dateTo: '',
  note: '',
  statusColor: 'red',
};

const emptySpaceForm: SpaceFormState = {
  title: '',
  category: '',
  capacity: '',
  shortDescription: '',
  summary: '',
  detailsText: '',
  homepageVisible: true,
  lightFile: null,
  darkFile: null,
};

const emptyStatForm: StatFormState = {
  label: '',
  value: '',
  suffix: '',
};

const fallbackSiteConfig: SiteConfigState = {
  mapEmbedUrl: '',
  openMapUrl: '',
  address: '',
  phone: '',
  email: '',
  visitaUrl: '',
  creativeBaguioUrl: '',
  footerDescription: '',
  footerCopyright: '',
};

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.trim() ?? '';
}

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Unexpected server response.' };
  }
}

async function apiJson<T>(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const csrf = getCsrfToken();
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseApiResponse(response);
  if (!response.ok) throw payload;
  return payload as T;
}

async function apiFormSubmit<T>(url: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  const csrf = getCsrfToken();
  if (method !== 'POST') formData.append('_method', method);
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
    body: formData,
  });

  const payload = await parseApiResponse(response);
  if (!response.ok) throw payload;
  return payload as T;
}

function normalizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    if ('errors' in error && typeof (error as { errors?: unknown }).errors === 'object') {
      const errors = (error as { errors?: Record<string, string[] | string> }).errors ?? {};
      const first = Object.values(errors)[0];
      if (Array.isArray(first) && first[0]) return first[0];
      if (typeof first === 'string') return first;
    }
  }
  return 'Please check the form.';
}

function validationErrors(error: unknown, map: Record<string, string> = {}): FieldErrors {
  if (!(typeof error === 'object' && error !== null && 'errors' in error)) return {};
  const raw = (error as { errors?: Record<string, string[] | string> }).errors ?? {};
  const out: FieldErrors = {};
  Object.entries(raw).forEach(([key, value]) => {
    const message = Array.isArray(value) ? value[0] : value;
    if (!message) return;
    out[map[key] ?? key] = String(message);
  });
  return out;
}

function inputClass(hasError: boolean) {
  return `w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
    hasError
      ? 'border-red-500 bg-red-50 focus:border-red-600 dark:bg-red-950/20'
      : 'border-slate-300 bg-white focus:border-emerald-600 dark:border-white/10 dark:bg-[#11151d] dark:focus:border-blue-400'
  }`;
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <div className="mt-1 text-sm font-medium text-red-600 dark:text-red-300">{error}</div>;
}

function NoticeBar({ notice }: { notice: NoticeState }) {
  if (!notice) return null;
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200'}`}>
      {notice.text}
    </div>
  );
}

function SectionPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#161b24]">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ItemImageStrip({ images }: { images: string[] }) {
  if (!images?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {images.map((src) => (
        <img key={src} src={src} alt="Preview" className="h-16 w-24 rounded-lg border object-cover dark:border-white/10" />
      ))}
    </div>
  );
}


type CalendarPreviewStatus = 'available' | 'blocked' | 'private' | 'public';

const previewWeekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLongDateLabel(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function expandDateRange(start: string, end: string) {
  const output: string[] = [];
  if (!start || !end) return output;

  const current = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(last.getTime())) return output;

  while (current.getTime() <= last.getTime()) {
    output.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return output;
}

function getMonthGridSundayFirst(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const startIndex = firstDay.getDay();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startIndex; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function previewStatusFromRows(rows: CalendarBlockRow[]): CalendarPreviewStatus {
  if (rows.some((row) => row.statusColor === 'red')) return 'blocked';
  if (rows.some((row) => row.statusColor === 'gold')) return 'private';
  if (rows.some((row) => row.statusColor === 'blue')) return 'public';
  return 'available';
}

function previewStatusClasses(status: CalendarPreviewStatus, selected: boolean) {
  if (status === 'blocked') {
    return selected
      ? 'border-red-700 bg-red-700 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
      : 'border-red-300 bg-red-100 text-red-800 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-200';
  }

  if (status === 'private') {
    return selected
      ? 'border-amber-600 bg-amber-600 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
      : 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200';
  }

  if (status === 'public') {
    return selected
      ? 'border-blue-700 bg-blue-700 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
      : 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-200';
  }

  return selected
    ? 'border-emerald-700 bg-emerald-700 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] dark:border-blue-600 dark:bg-blue-600'
    : 'border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-[#11151d] dark:text-white';
}

function previewStatusDotClasses(status: CalendarPreviewStatus) {
  if (status === 'blocked') return 'bg-red-600 dark:bg-red-300';
  if (status === 'private') return 'bg-amber-500 dark:bg-amber-300';
  if (status === 'public') return 'bg-blue-600 dark:bg-blue-300';
  return 'bg-emerald-600 dark:bg-emerald-300';
}

function previewStatusLabel(status: CalendarPreviewStatus) {
  if (status === 'blocked') return 'Blocked';
  if (status === 'private') return 'Private';
  if (status === 'public') return 'Public';
  return 'Available';
}

export default function AdminHome({
  initialBcccEvents = [],
  initialCityEvents = [],
  initialPackages = [],
  initialCalendarBlocks = [],
  initialSpaces = [],
  initialStats = [],
  initialTourismMembers = [],
  initialSiteConfig = fallbackSiteConfig,
}: AdminHomePageProps) {
  const page = usePage();
  const url = page.url;
  const currentTab = useMemo(() => new URLSearchParams(url.split('?')[1] ?? '').get('tab') ?? 'home', [url]);

  const [calendarPreviewMonth, setCalendarPreviewMonth] = useState<Date>(() => {
    const firstBlockDate = initialCalendarBlocks[0]?.dateFrom;
    if (firstBlockDate) {
      const parsed = new Date(`${firstBlockDate}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarDateKey, setSelectedCalendarDateKey] = useState<string>('');

  const [bcccEvents, setBcccEvents] = useState<EventRow[]>(initialBcccEvents);
  const [cityEvents, setCityEvents] = useState<EventRow[]>(initialCityEvents);
  const [packages, setPackages] = useState<PackageRow[]>(initialPackages);
  const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlockRow[]>(initialCalendarBlocks);
  const [spaces, setSpaces] = useState<SpaceRow[]>(initialSpaces);
  const [stats, setStats] = useState<StatRow[]>(initialStats);
  const [siteConfig, setSiteConfig] = useState<SiteConfigState>({ ...fallbackSiteConfig, ...initialSiteConfig });

  const [notice, setNotice] = useState<NoticeState>(null);
  const [search, setSearch] = useState('');

  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm);
  const [eventErrors, setEventErrors] = useState<FieldErrors>({});
  const [editingEventId, setEditingEventId] = useState<RowId | null>(null);

  const [packageForm, setPackageForm] = useState<PackageFormState>(emptyPackageForm);
  const [packageErrors, setPackageErrors] = useState<FieldErrors>({});
  const [editingPackageId, setEditingPackageId] = useState<RowId | null>(null);

  const [calendarForm, setCalendarForm] = useState<CalendarBlockFormState>(emptyCalendarBlockForm);
  const [calendarErrors, setCalendarErrors] = useState<FieldErrors>({});
  const [editingCalendarId, setEditingCalendarId] = useState<RowId | null>(null);

  const [spaceForm, setSpaceForm] = useState<SpaceFormState>(emptySpaceForm);
  const [spaceErrors, setSpaceErrors] = useState<FieldErrors>({});
  const [editingSpaceId, setEditingSpaceId] = useState<RowId | null>(null);

  const [statForm, setStatForm] = useState<StatFormState>(emptyStatForm);
  const [statErrors, setStatErrors] = useState<FieldErrors>({});
  const [editingStatId, setEditingStatId] = useState<RowId | null>(null);

  const [siteErrors, setSiteErrors] = useState<FieldErrors>({});

  const filteredPackages = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return packages;
    return packages.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(needle));
  }, [packages, search]);

  const filteredStats = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return stats;
    return stats.filter((item) => `${item.label} ${item.value} ${item.suffix}`.toLowerCase().includes(needle));
  }, [stats, search]);

  const filteredEvents = useMemo(() => {
    const source = eventForm.scope === 'bccc' ? bcccEvents : cityEvents;
    const needle = search.trim().toLowerCase();
    if (!needle) return source;
    return source.filter((item) => `${item.title} ${item.venue} ${item.description}`.toLowerCase().includes(needle));
  }, [bcccEvents, cityEvents, eventForm.scope, search]);

  const filteredBlocks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return calendarBlocks;
    return calendarBlocks.filter((item) => `${item.title} ${item.area} ${item.note}`.toLowerCase().includes(needle));
  }, [calendarBlocks, search]);

  const filteredSpaces = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return spaces;
    return spaces.filter((item) => `${item.title} ${item.category} ${item.shortDescription}`.toLowerCase().includes(needle));
  }, [spaces, search]);

  const calendarPreviewCells = useMemo(() => getMonthGridSundayFirst(calendarPreviewMonth), [calendarPreviewMonth]);

  const calendarPreviewMap = useMemo(() => {
    const map = new Map<string, CalendarBlockRow[]>();

    calendarBlocks.forEach((row) => {
      expandDateRange(row.dateFrom, row.dateTo).forEach((dateKey) => {
        const existing = map.get(dateKey) ?? [];
        existing.push(row);
        map.set(dateKey, existing);
      });
    });

    return map;
  }, [calendarBlocks]);

  const selectedCalendarRows = useMemo(() => {
    if (!selectedCalendarDateKey) return [] as CalendarBlockRow[];
    return calendarPreviewMap.get(selectedCalendarDateKey) ?? [];
  }, [calendarPreviewMap, selectedCalendarDateKey]);

  const selectedCalendarDate = useMemo(() => {
    if (!selectedCalendarDateKey) return null;
    const parsed = new Date(`${selectedCalendarDateKey}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [selectedCalendarDateKey]);

  const resetEventForm = () => {
    setEventForm(emptyEventForm);
    setEditingEventId(null);
    setEventErrors({});
  };
  const resetPackageForm = () => {
    setPackageForm(emptyPackageForm);
    setEditingPackageId(null);
    setPackageErrors({});
  };
  const resetCalendarForm = () => {
    setCalendarForm(emptyCalendarBlockForm);
    setEditingCalendarId(null);
    setCalendarErrors({});
  };
  const resetSpaceForm = () => {
    setSpaceForm(emptySpaceForm);
    setEditingSpaceId(null);
    setSpaceErrors({});
  };
  const resetStatForm = () => {
    setStatForm(emptyStatForm);
    setEditingStatId(null);
    setStatErrors({});
  };

  const handleEventFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setEventForm((prev) => ({ ...prev, files }));
    setEventErrors((prev) => ({ ...prev, files: '' }));
  };
  const handlePackageFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPackageForm((prev) => ({ ...prev, files }));
    setPackageErrors((prev) => ({ ...prev, files: '' }));
  };
  const handleLightFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSpaceForm((prev) => ({ ...prev, lightFile: file }));
    setSpaceErrors((prev) => ({ ...prev, lightFile: '' }));
  };
  const handleDarkFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSpaceForm((prev) => ({ ...prev, darkFile: file }));
    setSpaceErrors((prev) => ({ ...prev, darkFile: '' }));
  };

  const saveEvent = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setEventErrors({});

    const formData = new FormData();
    formData.append('scope', eventForm.scope);
    formData.append('title', eventForm.title);
    formData.append('venue', eventForm.venue);
    formData.append('event_date', eventForm.date);
    formData.append('event_time', eventForm.time);
    formData.append('description', eventForm.description);
    formData.append('note', eventForm.note);
    formData.append('is_highlighted', eventForm.highlighted ? '1' : '0');
    formData.append('is_public', eventForm.isPublic ? '1' : '0');
    eventForm.files.forEach((file) => formData.append('images[]', file));

    try {
      const payload = editingEventId
        ? await apiFormSubmit<{ message: string; item: EventRow }>(`/admin/events/${editingEventId}`, formData, 'PUT')
        : await apiFormSubmit<{ message: string; item: EventRow }>('/admin/events', formData, 'POST');

      const setter = payload.item.scope === 'city' ? setCityEvents : setBcccEvents;
      setter((prev) => {
        const exists = prev.some((item) => item.id === payload.item.id);
        return exists ? prev.map((item) => (item.id === payload.item.id ? payload.item : item)) : [payload.item, ...prev];
      });

      setNotice({ type: 'success', text: payload.message });
      resetEventForm();
    } catch (error) {
      setEventErrors(validationErrors(error, { event_date: 'date', event_time: 'time', is_highlighted: 'highlighted', is_public: 'isPublic', 'images.0': 'files' }));
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  const savePackage = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setPackageErrors({});

    const formData = new FormData();
    formData.append('title', packageForm.title);
    formData.append('description', packageForm.description);
    packageForm.files.forEach((file) => formData.append('images[]', file));

    try {
      const payload = editingPackageId
        ? await apiFormSubmit<{ message: string; item: PackageRow }>(`/admin/packages/${editingPackageId}`, formData, 'PUT')
        : await apiFormSubmit<{ message: string; item: PackageRow }>('/admin/packages', formData, 'POST');

      setPackages((prev) => {
        const exists = prev.some((item) => item.id === payload.item.id);
        return exists ? prev.map((item) => (item.id === payload.item.id ? payload.item : item)) : [payload.item, ...prev];
      });
      setNotice({ type: 'success', text: payload.message });
      resetPackageForm();
    } catch (error) {
      setPackageErrors(validationErrors(error, { 'images.0': 'files' }));
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  const saveCalendar = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setCalendarErrors({});

    try {
      const payload = editingCalendarId
        ? await apiJson<{ message: string; item: CalendarBlockRow }>(`/calendar-blocks/${editingCalendarId}`, 'PUT', {
            title: calendarForm.title,
            area: calendarForm.area,
            notes: calendarForm.note,
            block: calendarForm.block,
            public_status: calendarForm.statusColor,
            date_from: calendarForm.dateFrom,
            date_to: calendarForm.dateTo,
          })
        : await apiJson<{ message: string; item: CalendarBlockRow }>('/calendar-blocks', 'POST', {
            title: calendarForm.title,
            area: calendarForm.area,
            notes: calendarForm.note,
            block: calendarForm.block,
            public_status: calendarForm.statusColor,
            date_from: calendarForm.dateFrom,
            date_to: calendarForm.dateTo,
          });

      setCalendarBlocks((prev) => {
        const exists = prev.some((item) => item.id === payload.item.id);
        return exists ? prev.map((item) => (item.id === payload.item.id ? payload.item : item)) : [payload.item, ...prev];
      });
      setNotice({ type: 'success', text: payload.message });
      resetCalendarForm();
    } catch (error) {
      setCalendarErrors(validationErrors(error, { notes: 'note', public_status: 'statusColor', date_from: 'dateFrom', date_to: 'dateTo' }));
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  const saveSpace = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSpaceErrors({});

    const formData = new FormData();
    formData.append('title', spaceForm.title);
    formData.append('category', spaceForm.category);
    formData.append('capacity', spaceForm.capacity);
    formData.append('short_description', spaceForm.shortDescription);
    formData.append('summary', spaceForm.summary);
    formData.append('details_text', spaceForm.detailsText);
    formData.append('homepage_visible', spaceForm.homepageVisible ? '1' : '0');
    if (spaceForm.lightFile) formData.append('light_image', spaceForm.lightFile);
    if (spaceForm.darkFile) formData.append('dark_image', spaceForm.darkFile);

    try {
      const payload = editingSpaceId
        ? await apiFormSubmit<{ message: string; item: SpaceRow }>(`/admin/spaces/${editingSpaceId}`, formData, 'PUT')
        : await apiFormSubmit<{ message: string; item: SpaceRow }>('/admin/spaces', formData, 'POST');

      setSpaces((prev) => {
        const exists = prev.some((item) => item.id === payload.item.id);
        return exists ? prev.map((item) => (item.id === payload.item.id ? payload.item : item)) : [payload.item, ...prev];
      });
      setNotice({ type: 'success', text: payload.message });
      resetSpaceForm();
    } catch (error) {
      setSpaceErrors(validationErrors(error, { short_description: 'shortDescription', details_text: 'detailsText', light_image: 'lightFile', dark_image: 'darkFile', homepage_visible: 'homepageVisible' }));
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  const saveStat = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setStatErrors({});

    try {
      const payload = editingStatId
        ? await apiJson<{ message: string; item: StatRow }>(`/admin/stats/${editingStatId}`, 'PUT', statForm)
        : await apiJson<{ message: string; item: StatRow }>('/admin/stats', 'POST', statForm);

      setStats((prev) => {
        const exists = prev.some((item) => item.id === payload.item.id);
        return exists ? prev.map((item) => (item.id === payload.item.id ? payload.item : item)) : [payload.item, ...prev];
      });
      setNotice({ type: 'success', text: payload.message });
      resetStatForm();
    } catch (error) {
      setStatErrors(validationErrors(error));
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  const saveSiteConfig = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSiteErrors({});

    try {
      const payload = await apiJson<{ message: string; item: SiteConfigState }>('/admin/site-settings', 'PUT', {
        map_embed_url: siteConfig.mapEmbedUrl,
        open_map_url: siteConfig.openMapUrl,
        address: siteConfig.address,
        phone: siteConfig.phone,
        email: siteConfig.email,
        visita_url: siteConfig.visitaUrl,
        creative_baguio_url: siteConfig.creativeBaguioUrl,
        footer_description: siteConfig.footerDescription,
        footer_copyright: siteConfig.footerCopyright,
      });
      setSiteConfig(payload.item);
      setNotice({ type: 'success', text: payload.message });
    } catch (error) {
      setSiteErrors(validationErrors(error, { map_embed_url: 'mapEmbedUrl', open_map_url: 'openMapUrl', visita_url: 'visitaUrl', creative_baguio_url: 'creativeBaguioUrl', footer_description: 'footerDescription', footer_copyright: 'footerCopyright' }));
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  const editEvent = (row: EventRow) => {
    setEditingEventId(row.id);
    setEventErrors({});
    setEventForm({
      scope: row.scope ?? 'bccc',
      title: row.title,
      venue: row.venue,
      date: row.date,
      time: row.time ?? '',
      description: row.description,
      note: row.note,
      highlighted: !!row.highlighted,
      isPublic: row.isPublic ?? true,
      files: [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editPackage = (row: PackageRow) => {
    setEditingPackageId(row.id);
    setPackageErrors({});
    setPackageForm({ title: row.title, description: row.description, files: [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editCalendar = (row: CalendarBlockRow) => {
    setEditingCalendarId(row.id);
    setCalendarErrors({});
    setCalendarForm({
      title: row.title,
      area: row.area,
      block: row.block,
      dateFrom: row.dateFrom,
      dateTo: row.dateTo,
      note: row.note,
      statusColor: row.statusColor,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editSpace = (row: SpaceRow) => {
    setEditingSpaceId(row.id);
    setSpaceErrors({});
    setSpaceForm({
      title: row.title,
      category: row.category,
      capacity: row.capacity,
      shortDescription: row.shortDescription,
      summary: row.summary,
      detailsText: row.details.join('\n'),
      homepageVisible: row.homepageVisible,
      lightFile: null,
      darkFile: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editStat = (row: StatRow) => {
    setEditingStatId(row.id);
    setStatErrors({});
    setStatForm({ label: row.label, value: row.value, suffix: row.suffix });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeRow = async (label: string, urlPath: string, id: RowId, onRemove: () => void) => {
    if (!window.confirm(`Delete this ${label}?`)) return;
    setNotice(null);
    try {
      const payload = await apiJson<{ message: string }>(urlPath, 'DELETE');
      onRemove();
      setNotice({ type: 'success', text: payload.message });
      if (editingEventId === id) resetEventForm();
      if (editingPackageId === id) resetPackageForm();
      if (editingCalendarId === id) resetCalendarForm();
      if (editingSpaceId === id) resetSpaceForm();
      if (editingStatId === id) resetStatForm();
    } catch (error) {
      setNotice({ type: 'error', text: normalizeErrorMessage(error) });
    }
  };

  return (
    <AdminLayout title="Content settings">
      <Head title="Admin Content" />

      <div className="space-y-5">
        <NoticeBar notice={notice} />

        {(currentTab === 'home' || currentTab === 'events' || currentTab === 'calendar' || currentTab === 'facilities') ? (
          <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#161b24]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className={inputClass(false)}
            />
          </div>
        ) : null}

        {currentTab === 'home' ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <SectionPanel title={editingPackageId ? 'Edit package' : 'New package'}>
              <form onSubmit={savePackage} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Title</label>
                  <input value={packageForm.title} onChange={(e) => setPackageForm((prev) => ({ ...prev, title: e.target.value }))} className={inputClass(!!packageErrors.title)} />
                  <FieldError error={packageErrors.title} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Description</label>
                  <textarea rows={4} value={packageForm.description} onChange={(e) => setPackageForm((prev) => ({ ...prev, description: e.target.value }))} className={inputClass(!!packageErrors.description)} />
                  <FieldError error={packageErrors.description} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Images</label>
                  <input type="file" multiple accept="image/*" onChange={handlePackageFiles} className={inputClass(!!packageErrors.files)} />
                  {packageForm.files.length ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{packageForm.files.map((file) => file.name).join(', ')}</div> : null}
                  <FieldError error={packageErrors.files} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-blue-600 dark:hover:bg-blue-500">{editingPackageId ? 'Update package' : 'Save package'}</button>
                  {editingPackageId ? <button type="button" onClick={resetPackageForm} className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><X className="mr-2 inline h-4 w-4" />Cancel</button> : null}
                </div>
              </form>
            </SectionPanel>

            <SectionPanel title="Packages">
              <div className="space-y-3">
                {filteredPackages.length === 0 ? <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No package found.</div> : null}
                {filteredPackages.map((row) => (
                  <div key={row.id} className="rounded-2xl border p-4 dark:border-white/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-semibold">{row.title}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.description}</div>
                        <ItemImageStrip images={row.images} />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editPackage(row)} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
                        <button type="button" onClick={() => removeRow('package', `/admin/packages/${row.id}`, row.id, () => setPackages((prev) => prev.filter((item) => item.id !== row.id)))} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionPanel>

            <SectionPanel title={editingStatId ? 'Edit stat' : 'New stat'}>
              <form onSubmit={saveStat} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Label</label>
                  <input value={statForm.label} onChange={(e) => setStatForm((prev) => ({ ...prev, label: e.target.value }))} className={inputClass(!!statErrors.label)} />
                  <FieldError error={statErrors.label} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Value</label>
                    <input value={statForm.value} onChange={(e) => setStatForm((prev) => ({ ...prev, value: e.target.value }))} className={inputClass(!!statErrors.value)} />
                    <FieldError error={statErrors.value} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Suffix</label>
                    <input value={statForm.suffix} onChange={(e) => setStatForm((prev) => ({ ...prev, suffix: e.target.value }))} className={inputClass(!!statErrors.suffix)} />
                    <FieldError error={statErrors.suffix} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-blue-600 dark:hover:bg-blue-500">{editingStatId ? 'Update stat' : 'Save stat'}</button>
                  {editingStatId ? <button type="button" onClick={resetStatForm} className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><X className="mr-2 inline h-4 w-4" />Cancel</button> : null}
                </div>
              </form>
            </SectionPanel>

            <SectionPanel title="Stats">
              <div className="space-y-3">
                {filteredStats.length === 0 ? <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No stat found.</div> : null}
                {filteredStats.map((row) => (
                  <div key={row.id} className="rounded-2xl border p-4 dark:border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold">{row.label}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.value}{row.suffix ? ` ${row.suffix}` : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editStat(row)} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
                        <button type="button" onClick={() => removeRow('stat', `/admin/stats/${row.id}`, row.id, () => setStats((prev) => prev.filter((item) => item.id !== row.id)))} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionPanel>
          </div>
        ) : null}

        {currentTab === 'events' ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <SectionPanel title={editingEventId ? 'Edit event' : 'New event'}>
              <form onSubmit={saveEvent} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Type</label>
                  <select value={eventForm.scope} onChange={(e) => setEventForm((prev) => ({ ...prev, scope: e.target.value as 'bccc' | 'city' }))} className={inputClass(!!eventErrors.scope)}>
                    <option value="bccc">BCCC event</option>
                    <option value="city">Baguio City event</option>
                  </select>
                  <FieldError error={eventErrors.scope} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Title</label>
                  <input value={eventForm.title} onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))} className={inputClass(!!eventErrors.title)} />
                  <FieldError error={eventErrors.title} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Venue</label>
                    <input value={eventForm.venue} onChange={(e) => setEventForm((prev) => ({ ...prev, venue: e.target.value }))} className={inputClass(!!eventErrors.venue)} />
                    <FieldError error={eventErrors.venue} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Date</label>
                    <input type="date" value={eventForm.date} onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))} className={inputClass(!!eventErrors.date)} />
                    <FieldError error={eventErrors.date} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Time</label>
                  <input value={eventForm.time} onChange={(e) => setEventForm((prev) => ({ ...prev, time: e.target.value }))} className={inputClass(!!eventErrors.time)} />
                  <FieldError error={eventErrors.time} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Description</label>
                  <textarea rows={4} value={eventForm.description} onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))} className={inputClass(!!eventErrors.description)} />
                  <FieldError error={eventErrors.description} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Note</label>
                  <textarea rows={3} value={eventForm.note} onChange={(e) => setEventForm((prev) => ({ ...prev, note: e.target.value }))} className={inputClass(!!eventErrors.note)} />
                  <FieldError error={eventErrors.note} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Images</label>
                  <input type="file" multiple accept="image/*" onChange={handleEventFiles} className={inputClass(!!eventErrors.files)} />
                  {eventForm.files.length ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{eventForm.files.map((file) => file.name).join(', ')}</div> : null}
                  <FieldError error={eventErrors.files} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium dark:border-white/10">
                    <input type="checkbox" checked={eventForm.highlighted} onChange={(e) => setEventForm((prev) => ({ ...prev, highlighted: e.target.checked }))} />
                    Highlighted
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium dark:border-white/10">
                    <input type="checkbox" checked={eventForm.isPublic} onChange={(e) => setEventForm((prev) => ({ ...prev, isPublic: e.target.checked }))} />
                    Public
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-blue-600 dark:hover:bg-blue-500">{editingEventId ? 'Update event' : 'Save event'}</button>
                  {editingEventId ? <button type="button" onClick={resetEventForm} className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><X className="mr-2 inline h-4 w-4" />Cancel</button> : null}
                </div>
              </form>
            </SectionPanel>

            <SectionPanel title={eventForm.scope === 'bccc' ? 'BCCC events' : 'Baguio City events'}>
              <div className="space-y-3">
                {filteredEvents.length === 0 ? <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No event found.</div> : null}
                {filteredEvents.map((row) => (
                  <div key={row.id} className="rounded-2xl border p-4 dark:border-white/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-semibold">{row.title}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.venue} • {row.date}{row.time ? ` • ${row.time}` : ''}</div>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{row.description}</div>
                        <ItemImageStrip images={row.images} />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editEvent(row)} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
                        <button type="button" onClick={() => removeRow('event', `/admin/events/${row.id}`, row.id, () => (row.scope === 'city' ? setCityEvents((prev) => prev.filter((item) => item.id !== row.id)) : setBcccEvents((prev) => prev.filter((item) => item.id !== row.id))))} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionPanel>
          </div>
        ) : null}

        {currentTab === 'calendar' ? (
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionPanel title={editingCalendarId ? 'Edit block' : 'New block'}>
              <form onSubmit={saveCalendar} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Title</label>
                  <input value={calendarForm.title} onChange={(e) => setCalendarForm((prev) => ({ ...prev, title: e.target.value }))} className={inputClass(!!calendarErrors.title)} />
                  <FieldError error={calendarErrors.title} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Area</label>
                  <input value={calendarForm.area} onChange={(e) => setCalendarForm((prev) => ({ ...prev, area: e.target.value }))} className={inputClass(!!calendarErrors.area)} />
                  <FieldError error={calendarErrors.area} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Block</label>
                    <select value={calendarForm.block} onChange={(e) => setCalendarForm((prev) => ({ ...prev, block: e.target.value as CalendarBlockFormState['block'] }))} className={inputClass(!!calendarErrors.block)}>
                      <option value="DAY">Whole day</option>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                      <option value="EVE">EVE</option>
                    </select>
                    <FieldError error={calendarErrors.block} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Color</label>
                    <select value={calendarForm.statusColor} onChange={(e) => setCalendarForm((prev) => ({ ...prev, statusColor: e.target.value as CalendarBlockFormState['statusColor'] }))} className={inputClass(!!calendarErrors.statusColor)}>
                      <option value="red">Red</option>
                      <option value="gold">Gold</option>
                      <option value="blue">Blue</option>
                    </select>
                    <FieldError error={calendarErrors.statusColor} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Start date</label>
                    <input type="date" value={calendarForm.dateFrom} onChange={(e) => setCalendarForm((prev) => ({ ...prev, dateFrom: e.target.value }))} className={inputClass(!!calendarErrors.dateFrom)} />
                    <FieldError error={calendarErrors.dateFrom} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">End date</label>
                    <input type="date" value={calendarForm.dateTo} onChange={(e) => setCalendarForm((prev) => ({ ...prev, dateTo: e.target.value }))} className={inputClass(!!calendarErrors.dateTo)} />
                    <FieldError error={calendarErrors.dateTo} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Note</label>
                  <textarea rows={3} value={calendarForm.note} onChange={(e) => setCalendarForm((prev) => ({ ...prev, note: e.target.value }))} className={inputClass(!!calendarErrors.note)} />
                  <FieldError error={calendarErrors.note} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-blue-600 dark:hover:bg-blue-500">{editingCalendarId ? 'Update block' : 'Save block'}</button>
                  {editingCalendarId ? <button type="button" onClick={resetCalendarForm} className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><X className="mr-2 inline h-4 w-4" />Cancel</button> : null}
                </div>
              </form>
            </SectionPanel>

            <div className="space-y-5">
              <SectionPanel title="Calendar status">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
                      <CalendarDays className="h-4 w-4" />
                      {formatMonthLabel(calendarPreviewMonth)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setCalendarPreviewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarPreviewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="-mx-1 overflow-x-auto pb-1">
                    <div className="flex min-w-max gap-2 px-1">
                      {[
                        { label: 'Available', className: 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-[#11151d] dark:text-white' },
                        { label: 'Public', className: 'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-200' },
                        { label: 'Private', className: 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200' },
                        { label: 'Blocked', className: 'border-red-300 bg-red-100 text-red-800 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-200' },
                      ].map((item) => (
                        <div key={item.label} className={`min-w-[120px] rounded-xl border px-3 py-2 text-center text-sm font-semibold ${item.className}`}>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[760px] overflow-hidden rounded-2xl border dark:border-white/10">
                      <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        {previewWeekdayLabels.map((day) => (
                          <div key={day} className="px-2 py-3">{day}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-white/10">
                        {calendarPreviewCells.map((cell, index) => {
                          if (!cell) {
                            return <div key={`empty-${index}`} className="min-h-[94px] bg-slate-50/80 dark:bg-[#11151d]/70" />;
                          }

                          const dateKey = formatDateKey(cell);
                          const rows = calendarPreviewMap.get(dateKey) ?? [];
                          const status = previewStatusFromRows(rows);
                          const isSelected = selectedCalendarDateKey === dateKey;

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              onClick={() => setSelectedCalendarDateKey(dateKey)}
                              className={`min-h-[94px] border px-2 py-2 text-left transition hover:brightness-[0.98] ${previewStatusClasses(status, isSelected)}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-xs font-bold">{cell.getDate()}</div>
                                <span className={`mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${previewStatusDotClasses(status)}`} />
                              </div>
                              <div className="mt-2 text-[11px] font-semibold opacity-90">{previewStatusLabel(status)}</div>
                              <div className="mt-2 space-y-1">
                                {rows.slice(0, 2).map((row) => (
                                  <div key={`${row.id}-${row.title}`} className="truncate rounded-md bg-black/5 px-2 py-1 text-[11px] font-medium dark:bg-white/10">
                                    {row.title}
                                  </div>
                                ))}
                                {rows.length > 2 ? <div className="text-[11px] font-semibold">+{rows.length - 2} more</div> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-sm font-semibold">
                      {selectedCalendarDate ? formatLongDateLabel(selectedCalendarDate) : 'Select a date'}
                    </div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {selectedCalendarRows.length > 0 ? `${selectedCalendarRows.length} item(s) found on this date.` : 'Click any date to see the blocks for that day.'}
                    </div>
                    {selectedCalendarRows.length > 0 ? (
                      <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                        {selectedCalendarRows.map((row) => (
                          <div key={`selected-${row.id}`} className="rounded-xl border bg-white p-3 dark:border-white/10 dark:bg-[#11151d]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-block h-2.5 w-2.5 rounded-full ${row.statusColor === 'red' ? 'bg-red-600 dark:bg-red-300' : row.statusColor === 'gold' ? 'bg-amber-500 dark:bg-amber-300' : 'bg-blue-600 dark:bg-blue-300'}`} />
                              <div className="text-sm font-semibold">{row.title}</div>
                              <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                                row.statusColor === 'red'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                                  : row.statusColor === 'gold'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                              }`}>
                                {row.statusColor}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                              {row.area || 'All areas'} • {row.block} • {row.dateFrom} to {row.dateTo}
                            </div>
                            {row.note ? <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{row.note}</div> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel title="Blocks">
                <div className="space-y-3">
                  {filteredBlocks.length === 0 ? <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No block found.</div> : null}
                  {filteredBlocks.map((row) => (
                    <div key={row.id} className="rounded-2xl border p-4 dark:border-white/10">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-lg font-semibold">{row.title}</div>
                            <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                              row.statusColor === 'red'
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                                : row.statusColor === 'gold'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                            }`}>
                              {row.statusColor}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.area || 'All areas'} • {row.block} • {row.dateFrom} to {row.dateTo}</div>
                          {row.note ? <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{row.note}</div> : null}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => editCalendar(row)} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
                          <button type="button" onClick={() => removeRow('block', `/calendar-blocks/${row.id}`, row.id, () => setCalendarBlocks((prev) => prev.filter((item) => item.id !== row.id)))} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionPanel>
            </div>
          </div>
        ) : null}

        {currentTab === 'facilities' ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <SectionPanel title={editingSpaceId ? 'Edit space' : 'New space'}>
              <form onSubmit={saveSpace} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Title</label>
                  <input value={spaceForm.title} onChange={(e) => setSpaceForm((prev) => ({ ...prev, title: e.target.value }))} className={inputClass(!!spaceErrors.title)} />
                  <FieldError error={spaceErrors.title} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Category</label>
                    <input value={spaceForm.category} onChange={(e) => setSpaceForm((prev) => ({ ...prev, category: e.target.value }))} className={inputClass(!!spaceErrors.category)} />
                    <FieldError error={spaceErrors.category} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Capacity</label>
                    <input value={spaceForm.capacity} onChange={(e) => setSpaceForm((prev) => ({ ...prev, capacity: e.target.value }))} className={inputClass(!!spaceErrors.capacity)} />
                    <FieldError error={spaceErrors.capacity} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Short description</label>
                  <textarea rows={3} value={spaceForm.shortDescription} onChange={(e) => setSpaceForm((prev) => ({ ...prev, shortDescription: e.target.value }))} className={inputClass(!!spaceErrors.shortDescription)} />
                  <FieldError error={spaceErrors.shortDescription} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Summary</label>
                  <textarea rows={3} value={spaceForm.summary} onChange={(e) => setSpaceForm((prev) => ({ ...prev, summary: e.target.value }))} className={inputClass(!!spaceErrors.summary)} />
                  <FieldError error={spaceErrors.summary} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Details</label>
                  <textarea rows={4} value={spaceForm.detailsText} onChange={(e) => setSpaceForm((prev) => ({ ...prev, detailsText: e.target.value }))} className={inputClass(!!spaceErrors.detailsText)} />
                  <FieldError error={spaceErrors.detailsText} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Light image</label>
                    <input type="file" accept="image/*" onChange={handleLightFile} className={inputClass(!!spaceErrors.lightFile)} />
                    {spaceForm.lightFile ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{spaceForm.lightFile.name}</div> : null}
                    <FieldError error={spaceErrors.lightFile} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Dark image</label>
                    <input type="file" accept="image/*" onChange={handleDarkFile} className={inputClass(!!spaceErrors.darkFile)} />
                    {spaceForm.darkFile ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{spaceForm.darkFile.name}</div> : null}
                    <FieldError error={spaceErrors.darkFile} />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium dark:border-white/10">
                  <input type="checkbox" checked={spaceForm.homepageVisible} onChange={(e) => setSpaceForm((prev) => ({ ...prev, homepageVisible: e.target.checked }))} />
                  Show on home page
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-blue-600 dark:hover:bg-blue-500">{editingSpaceId ? 'Update space' : 'Save space'}</button>
                  {editingSpaceId ? <button type="button" onClick={resetSpaceForm} className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><X className="mr-2 inline h-4 w-4" />Cancel</button> : null}
                </div>
              </form>
            </SectionPanel>

            <SectionPanel title="Spaces">
              <div className="space-y-3">
                {filteredSpaces.length === 0 ? <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">No space found.</div> : null}
                {filteredSpaces.map((row) => (
                  <div key={row.id} className="rounded-2xl border p-4 dark:border-white/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-semibold">{row.title}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{row.category}{row.capacity ? ` • ${row.capacity}` : ''}</div>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{row.shortDescription}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.lightImage ? <img src={row.lightImage} alt="Light" className="h-16 w-24 rounded-lg border object-cover dark:border-white/10" /> : null}
                          {row.darkImage ? <img src={row.darkImage} alt="Dark" className="h-16 w-24 rounded-lg border object-cover dark:border-white/10" /> : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editSpace(row)} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"><Edit3 className="mr-2 inline h-4 w-4" />Edit</button>
                        <button type="button" onClick={() => removeRow('space', `/admin/spaces/${row.id}`, row.id, () => setSpaces((prev) => prev.filter((item) => item.id !== row.id)))} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionPanel>
          </div>
        ) : null}

        {currentTab === 'tourism-office' ? <TourismMemberManager initialMembers={initialTourismMembers} /> : null}

        {currentTab === 'contact' ? (
          <SectionPanel title="Contact and site settings">
            <form onSubmit={saveSiteConfig} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Map embed URL</label>
                <input value={siteConfig.mapEmbedUrl} onChange={(e) => setSiteConfig((prev) => ({ ...prev, mapEmbedUrl: e.target.value }))} className={inputClass(!!siteErrors.mapEmbedUrl)} />
                <FieldError error={siteErrors.mapEmbedUrl} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Open map URL</label>
                <input value={siteConfig.openMapUrl} onChange={(e) => setSiteConfig((prev) => ({ ...prev, openMapUrl: e.target.value }))} className={inputClass(!!siteErrors.openMapUrl)} />
                <FieldError error={siteErrors.openMapUrl} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Address</label>
                <input value={siteConfig.address} onChange={(e) => setSiteConfig((prev) => ({ ...prev, address: e.target.value }))} className={inputClass(!!siteErrors.address)} />
                <FieldError error={siteErrors.address} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Phone</label>
                <input value={siteConfig.phone} onChange={(e) => setSiteConfig((prev) => ({ ...prev, phone: e.target.value }))} className={inputClass(!!siteErrors.phone)} />
                <FieldError error={siteErrors.phone} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Email</label>
                <input value={siteConfig.email} onChange={(e) => setSiteConfig((prev) => ({ ...prev, email: e.target.value }))} className={inputClass(!!siteErrors.email)} />
                <FieldError error={siteErrors.email} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Visita URL</label>
                <input value={siteConfig.visitaUrl} onChange={(e) => setSiteConfig((prev) => ({ ...prev, visitaUrl: e.target.value }))} className={inputClass(!!siteErrors.visitaUrl)} />
                <FieldError error={siteErrors.visitaUrl} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Creative Baguio URL</label>
                <input value={siteConfig.creativeBaguioUrl} onChange={(e) => setSiteConfig((prev) => ({ ...prev, creativeBaguioUrl: e.target.value }))} className={inputClass(!!siteErrors.creativeBaguioUrl)} />
                <FieldError error={siteErrors.creativeBaguioUrl} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Footer copyright</label>
                <input value={siteConfig.footerCopyright} onChange={(e) => setSiteConfig((prev) => ({ ...prev, footerCopyright: e.target.value }))} className={inputClass(!!siteErrors.footerCopyright)} />
                <FieldError error={siteErrors.footerCopyright} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Footer description</label>
                <textarea rows={4} value={siteConfig.footerDescription} onChange={(e) => setSiteConfig((prev) => ({ ...prev, footerDescription: e.target.value }))} className={inputClass(!!siteErrors.footerDescription)} />
                <FieldError error={siteErrors.footerDescription} />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-blue-600 dark:hover:bg-blue-500">Save settings</button>
              </div>
            </form>
          </SectionPanel>
        ) : null}
      </div>
    </AdminLayout>
  );
}
