import type { ChangeEvent, FormEvent } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Edit3,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  MapPin,
  Megaphone,
  Package2,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import TourismMemberManager, { type TourismMemberRow } from '@/components/admin/tourism-member-manager';


type TourismMemberState = TourismMemberRow;

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
  initialTourismMembers?: TourismMemberState[];
};

type NoticeState =
  | {
      type: 'success' | 'error';
      text: string;
    }
  | null;

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
  mapEmbedUrl:
    'https://www.google.com/maps?q=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines&z=16&output=embed',
  openMapUrl:
    'https://www.google.com/maps/search/?api=1&query=CH3X%2BRRW%2C%20Baguio%2C%20Benguet%2C%20Philippines',
  address: 'CH3X+RRW, Baguio, Benguet, Philippines',
  phone: '(074) 446 2009',
  email: 'info@bccc-ease.com',
  footerDescription:
    'A public-facing venue platform for space discovery, event highlights, schedule visibility, and booking guidance for the Baguio Convention and Cultural Center.',
  footerCopyright:
    '© 2026 BCCC EASE • City Government of Baguio • All Rights Reserved',
    visitaUrl: 'https://visita.baguio.gov.ph/',
    creativeBaguioUrl: 'https://creativebaguio.com/',

};

function getCsrfToken() {
  return (
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute('content')
      ?.trim() ?? ''
  );
}

function confirmDeleteAction(label: string) {
  return window.confirm(`Are you sure you want to delete this ${label}? This action cannot be undone.`);
}


async function parseApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'Unexpected server response.' };
  }
}

function normalizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return 'Something went wrong while processing the request.';
}

async function apiJson<T>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const csrf = getCsrfToken();

  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await parseApiResponse(response);

  if (!response.ok) {
    throw payload;
  }

  return payload as T;
}

async function apiFormSubmit<T>(
  url: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST',
): Promise<T> {
  const csrf = getCsrfToken();

  if (method !== 'POST') {
    formData.append('_method', method);
  }

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

  if (!response.ok) {
    throw payload;
  }

  return payload as T;
}

function fileListToFiles(files: FileList | null, max = 3) {
  if (!files) return [];

  return Array.from(files).slice(0, max);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);

  return next;
}

function replaceById<T extends { id: RowId }>(items: T[], row: T) {
  return items.map((item) => (item.id === row.id ? row : item));
}

function removeById<T extends { id: RowId }>(items: T[], id: RowId) {
  return items.filter((item) => item.id !== id);
}

function upsertById<T extends { id: RowId }>(items: T[], row: T) {
  const exists = items.some((item) => item.id === row.id);

  if (exists) {
    return replaceById(items, row);
  }

  return [row, ...items];
}

function NoticeBanner({ notice }: { notice: NoticeState }) {
  if (!notice) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        notice.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
          : 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200'
      }`}
    >
      {notice.text}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318] sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#8ea3ff]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function ImageStrip({
  images,
  emptyLabel,
}: {
  images: string[];
  emptyLabel: string;
}) {
  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 px-4 py-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((image, index) => (
        <img
          key={`${image}-${index}`}
          src={image}
          alt={`Preview ${index + 1}`}
          className="h-20 w-28 rounded-2xl border border-black/10 object-cover dark:border-white/10"
        />
      ))}
    </div>
  );
}

export default function AdminHomePage({
  initialBcccEvents = [],
  initialCityEvents = [],
  initialPackages = [],
  initialCalendarBlocks = [],
  initialSpaces = [],
  initialStats = [],
  initialTourismMembers = [],
  initialSiteConfig = fallbackSiteConfig,
}: AdminHomePageProps) {
  const [notice, setNotice] = useState<NoticeState>(null);

  const page = usePage();
  const pageUrl = String(page.url || '');
  const queryString = pageUrl.includes('?') ? pageUrl.split('?')[1] : '';
  const params = new URLSearchParams(queryString);
  const activeTab = params.get('tab') || 'home';


  const [bcccEvents, setBcccEvents] = useState<EventRow[]>(initialBcccEvents);
  const [cityEvents, setCityEvents] = useState<EventRow[]>(initialCityEvents);
  const [packages, setPackages] = useState<PackageRow[]>(initialPackages);
  const [calendarBlocks, setCalendarBlocks] =
    useState<CalendarBlockRow[]>(initialCalendarBlocks);
  const [spaces, setSpaces] = useState<SpaceRow[]>(initialSpaces);
  const [stats, setStats] = useState<StatRow[]>(initialStats);
  const [siteConfig, setSiteConfig] =
    useState<SiteConfigState>(initialSiteConfig);

  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState<RowId | null>(null);
  const [editingEventOriginalScope, setEditingEventOriginalScope] = useState<
    'bccc' | 'city' | null
  >(null);

  const [packageForm, setPackageForm] = useState<PackageFormState>(emptyPackageForm);
  const [editingPackageId, setEditingPackageId] = useState<RowId | null>(null);

  const [calendarBlockForm, setCalendarBlockForm] =
    useState<CalendarBlockFormState>(emptyCalendarBlockForm);
  const [editingCalendarBlockId, setEditingCalendarBlockId] =
    useState<RowId | null>(null);

  const [spaceForm, setSpaceForm] = useState<SpaceFormState>(emptySpaceForm);
  const [editingSpaceId, setEditingSpaceId] = useState<RowId | null>(null);

  const [statForm, setStatForm] = useState<StatFormState>(emptyStatForm);
  const [editingStatId, setEditingStatId] = useState<RowId | null>(null);

  const summary = useMemo(
    () => ({
      events: bcccEvents.length + cityEvents.length,
      packages: packages.length,
      calendarBlocks: calendarBlocks.length,
      spaces: spaces.length,
      stats: stats.length,
    }),
    [bcccEvents.length, cityEvents.length, packages.length, calendarBlocks.length, spaces.length, stats.length],
  );

  const resetEventForm = () => {
    setEventForm(emptyEventForm);
    setEditingEventId(null);
    setEditingEventOriginalScope(null);
  };

  const resetPackageForm = () => {
    setPackageForm(emptyPackageForm);
    setEditingPackageId(null);
  };

  const resetCalendarBlockForm = () => {
    setCalendarBlockForm(emptyCalendarBlockForm);
    setEditingCalendarBlockId(null);
  };

  const resetSpaceForm = () => {
    setSpaceForm(emptySpaceForm);
    setEditingSpaceId(null);
  };

  const resetStatForm = () => {
    setStatForm(emptyStatForm);
    setEditingStatId(null);
  };

  const setSuccess = (text: string) => setNotice({ type: 'success', text });
  const setError = (text: string) => setNotice({ type: 'error', text });

  const handleEventFiles = (e: ChangeEvent<HTMLInputElement>) => {
    setEventForm((prev) => ({
      ...prev,
      files: fileListToFiles(e.target.files),
    }));
  };

  const handlePackageFiles = (e: ChangeEvent<HTMLInputElement>) => {
    setPackageForm((prev) => ({
      ...prev,
      files: fileListToFiles(e.target.files),
    }));
  };

  const handleSpaceLightFile = (e: ChangeEvent<HTMLInputElement>) => {
    setSpaceForm((prev) => ({
      ...prev,
      lightFile: e.target.files?.[0] ?? null,
    }));
  };

  const handleSpaceDarkFile = (e: ChangeEvent<HTMLInputElement>) => {
    setSpaceForm((prev) => ({
      ...prev,
      darkFile: e.target.files?.[0] ?? null,
    }));
  };

  const submitEvent = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    try {
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

      const payload = await apiFormSubmit<{
        message: string;
        item: EventRow;
      }>(
        editingEventId ? `/admin/events/${editingEventId}` : '/admin/events',
        formData,
        editingEventId ? 'PUT' : 'POST',
      );

      const nextBccc = removeById(bcccEvents, payload.item.id);
      const nextCity = removeById(cityEvents, payload.item.id);

      if (payload.item.scope === 'city') {
        setBcccEvents(nextBccc);
        setCityEvents(upsertById(nextCity, payload.item));
      } else {
        setBcccEvents(upsertById(nextBccc, payload.item));
        setCityEvents(nextCity);
      }

      resetEventForm();
      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const editEvent = (row: EventRow) => {
    setEditingEventId(row.id);
    setEditingEventOriginalScope(row.scope ?? 'bccc');
    setEventForm({
      scope: row.scope ?? 'bccc',
      title: row.title,
      venue: row.venue,
      date: row.date,
      time: row.time ?? '',
      description: row.description,
      note: row.note,
      highlighted: row.highlighted,
      isPublic: row.isPublic ?? true,
      files: [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteEvent = async (id: RowId) => {
    setNotice(null);

    try {
      const payload = await apiJson<{ message: string; id: RowId }>(
        `/admin/events/${id}`,
        'DELETE',
      );

      setBcccEvents((prev) => removeById(prev, payload.id));
      setCityEvents((prev) => removeById(prev, payload.id));
      if (editingEventId === payload.id) {
        resetEventForm();
      }
      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const moveEvent = (scope: 'bccc' | 'city', index: number, direction: -1 | 1) => {
    if (scope === 'bccc') {
      setBcccEvents((prev) => moveItem(prev, index, direction));
      return;
    }

    setCityEvents((prev) => moveItem(prev, index, direction));
  };

  const saveEventSort = async (scope: 'bccc' | 'city') => {
    setNotice(null);

    try {
      const rows = scope === 'bccc' ? bcccEvents : cityEvents;

      await apiJson('/admin/sort/events', 'POST', {
        scope,
        ordered_ids: rows.map((row) => row.id),
      });

      setSuccess(`${scope === 'bccc' ? 'BCCC' : 'City'} event order saved.`);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const submitPackage = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append('title', packageForm.title);
      formData.append('description', packageForm.description);
      packageForm.files.forEach((file) => formData.append('images[]', file));

      const payload = await apiFormSubmit<{
        message: string;
        item: PackageRow;
      }>(
        editingPackageId ? `/admin/packages/${editingPackageId}` : '/admin/packages',
        formData,
        editingPackageId ? 'PUT' : 'POST',
      );

      setPackages((prev) => upsertById(prev, payload.item));
      resetPackageForm();
      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const editPackage = (row: PackageRow) => {
    setEditingPackageId(row.id);
    setPackageForm({
      title: row.title,
      description: row.description,
      files: [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePackage = async (id: RowId) => {
    setNotice(null);

    try {
      const payload = await apiJson<{ message: string; id: RowId }>(
        `/admin/packages/${id}`,
        'DELETE',
      );

      setPackages((prev) => removeById(prev, payload.id));

      if (editingPackageId === payload.id) {
        resetPackageForm();
      }

      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const movePackage = (index: number, direction: -1 | 1) => {
    setPackages((prev) => moveItem(prev, index, direction));
  };

  const savePackageSort = async () => {
    setNotice(null);

    try {
      await apiJson('/admin/sort/packages', 'POST', {
        ordered_ids: packages.map((row) => row.id),
      });

      setSuccess('Package order saved.');
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const submitCalendarBlock = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    try {
      const payload = await apiJson<{
        message: string;
        item: CalendarBlockRow;
      }>(
        editingCalendarBlockId
          ? `/calendar-blocks/${editingCalendarBlockId}`
          : '/calendar-blocks',
        editingCalendarBlockId ? 'PUT' : 'POST',
        {
          title: calendarBlockForm.title,
          area: calendarBlockForm.area,
          notes: calendarBlockForm.note,
          block: calendarBlockForm.block,
          public_status: calendarBlockForm.statusColor,
          date_from: calendarBlockForm.dateFrom,
          date_to: calendarBlockForm.dateTo,
        },
      );

      setCalendarBlocks((prev) => upsertById(prev, payload.item));
      resetCalendarBlockForm();
      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const editCalendarBlock = (row: CalendarBlockRow) => {
    setEditingCalendarBlockId(row.id);
    setCalendarBlockForm({
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

  const deleteCalendarBlock = async (id: RowId) => {
    setNotice(null);

    try {
      const payload = await apiJson<{ message: string; id: RowId }>(
        `/calendar-blocks/${id}`,
        'DELETE',
      );

      setCalendarBlocks((prev) => removeById(prev, payload.id));

      if (editingCalendarBlockId === payload.id) {
        resetCalendarBlockForm();
      }

      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const submitSpace = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append('title', spaceForm.title);
      formData.append('category', spaceForm.category);
      formData.append('capacity', spaceForm.capacity);
      formData.append('short_description', spaceForm.shortDescription);
      formData.append('summary', spaceForm.summary);
      formData.append('details_text', spaceForm.detailsText);
      formData.append('homepage_visible', spaceForm.homepageVisible ? '1' : '0');

      if (spaceForm.lightFile) {
        formData.append('light_image', spaceForm.lightFile);
      }

      if (spaceForm.darkFile) {
        formData.append('dark_image', spaceForm.darkFile);
      }

      const payload = await apiFormSubmit<{
        message: string;
        item: SpaceRow;
      }>(
        editingSpaceId ? `/admin/spaces/${editingSpaceId}` : '/admin/spaces',
        formData,
        editingSpaceId ? 'PUT' : 'POST',
      );

      setSpaces((prev) => upsertById(prev, payload.item));
      resetSpaceForm();
      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const editSpace = (row: SpaceRow) => {
    setEditingSpaceId(row.id);
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

  const deleteSpace = async (id: RowId) => {
    setNotice(null);

    try {
      const payload = await apiJson<{ message: string; id: RowId }>(
        `/admin/spaces/${id}`,
        'DELETE',
      );

      setSpaces((prev) => removeById(prev, payload.id));

      if (editingSpaceId === payload.id) {
        resetSpaceForm();
      }

      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const moveSpace = (index: number, direction: -1 | 1) => {
    setSpaces((prev) => moveItem(prev, index, direction));
  };

  const saveSpaceSort = async () => {
    setNotice(null);

    try {
      await apiJson('/admin/sort/spaces', 'POST', {
        ordered_ids: spaces.map((row) => row.id),
      });

      setSuccess('Venue space order saved.');
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const submitStat = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    try {
      const payload = await apiJson<{
        message: string;
        item: StatRow;
      }>(
        editingStatId ? `/admin/stats/${editingStatId}` : '/admin/stats',
        editingStatId ? 'PUT' : 'POST',
        statForm,
      );

      setStats((prev) => upsertById(prev, payload.item));
      resetStatForm();
      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const editStat = (row: StatRow) => {
    setEditingStatId(row.id);
    setStatForm({
      label: row.label,
      value: row.value,
      suffix: row.suffix,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteStat = async (id: RowId) => {
    setNotice(null);

    try {
      const payload = await apiJson<{ message: string; id: RowId }>(
        `/admin/stats/${id}`,
        'DELETE',
      );

      setStats((prev) => removeById(prev, payload.id));

      if (editingStatId === payload.id) {
        resetStatForm();
      }

      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const moveStat = (index: number, direction: -1 | 1) => {
    setStats((prev) => moveItem(prev, index, direction));
  };

  const saveStatSort = async () => {
    setNotice(null);

    try {
      await apiJson('/admin/sort/stats', 'POST', {
        ordered_ids: stats.map((row) => row.id),
      });

      setSuccess('Homepage stat order saved.');
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  const showHomeSection = activeTab === 'home';
  const showEventsSection = activeTab === 'events';
  const showCalendarSection = activeTab === 'calendar';
  const showFacilitiesSection = activeTab === 'facilities' || activeTab === 'tourism-office';
  const showContactSection = activeTab === 'contact';

  const submitSiteConfig = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    
    try {
      const payload = await apiJson<{
        message: string;
        item: SiteConfigState;
      }>('/admin/site-settings', 'PUT', {
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
      setSuccess(payload.message);
    } catch (error) {
      setError(normalizeErrorMessage(error));
    }
  };

  return (
    <AdminLayout title="Frontend configuration" subtitle="Manage the public website in separated sections so editing is cleaner, clearer, and easier to monitor.">

      <Head title="Admin Home" />

      <div className="space-y-8">
        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.34em] text-[#174f40] dark:text-[#8ea3ff]">
                Config Home
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Frontend content and schedule management
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-300">
                Manage public events, packages, venue spaces, homepage stats,
                calendar blocks, and footer/contact information from one admin console.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Events', value: summary.events.toString(), icon: Megaphone },
              { label: 'Packages', value: summary.packages.toString(), icon: Package2 },
              { label: 'Calendar Blocks', value: summary.calendarBlocks.toString(), icon: CalendarDays },
              { label: 'Venue Spaces', value: summary.spaces.toString(), icon: LayoutGrid },
              { label: 'Homepage Stats', value: summary.stats.toString(), icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#8ea3ff]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-4 text-3xl font-semibold">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <NoticeBanner notice={notice} />
        {showContactSection ? (
        <SectionCard
          title="Site Settings"
          subtitle="Footer, map, address, phone, and email used by the public pages."
          icon={MapPin}
        >
          <form onSubmit={submitSiteConfig} className="grid gap-4 lg:grid-cols-2">
            <input
              value={siteConfig.mapEmbedUrl}
              onChange={(e) =>
                setSiteConfig((prev) => ({ ...prev, mapEmbedUrl: e.target.value }))
              }
              placeholder="Map embed URL"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            />
            <input
              value={siteConfig.openMapUrl}
              onChange={(e) =>
                setSiteConfig((prev) => ({ ...prev, openMapUrl: e.target.value }))
              }
              placeholder="Open map URL"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            />
            <input
              value={siteConfig.address}
              onChange={(e) =>
                setSiteConfig((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Address"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            />
            <input
              value={siteConfig.phone}
              onChange={(e) =>
                setSiteConfig((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Phone"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            />
            <input
              value={siteConfig.email}
              onChange={(e) =>
                setSiteConfig((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Email"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            />
            <input
              value={siteConfig.footerCopyright}
              onChange={(e) =>
                setSiteConfig((prev) => ({
                  ...prev,
                  footerCopyright: e.target.value,
                }))
              }
              placeholder="Footer copyright"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            />
            <textarea
              value={siteConfig.footerDescription}
              onChange={(e) =>
                setSiteConfig((prev) => ({
                  ...prev,
                  footerDescription: e.target.value,
                }))
              }
              placeholder="Footer description"
              rows={4}
              className="lg:col-span-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5"
            />

            <div className="lg:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
              >
                <Save className="h-4 w-4" />
                Save Site Settings
              </button>
            </div>
          </form>
        </SectionCard>
) : null}

        {showEventsSection ? (
        <SectionCard
          title="Public Events"
          subtitle="Manage BCCC events and Baguio City public events from one form."
          icon={Megaphone}
        >
          <form onSubmit={submitEvent} className="grid gap-4 rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5 lg:grid-cols-2">
            <select
              value={eventForm.scope}
              onChange={(e) =>
                setEventForm((prev) => ({
                  ...prev,
                  scope: e.target.value as 'bccc' | 'city',
                }))
              }
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            >
              <option value="bccc">BCCC Events</option>
              <option value="city">Baguio City Events</option>
            </select>

            <input
              value={eventForm.title}
              onChange={(e) =>
                setEventForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Event title"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

              <input
  value={siteConfig.visitaUrl}
  onChange={(e) =>
    setSiteConfig((prev) => ({ ...prev, visitaUrl: e.target.value }))
  }
  placeholder="Baguio VISITA URL"
  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
/>

<input
  value={siteConfig.creativeBaguioUrl}
  onChange={(e) =>
    setSiteConfig((prev) => ({ ...prev, creativeBaguioUrl: e.target.value }))
  }
  placeholder="Creative Baguio URL"
  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
/>

            <input
              value={eventForm.venue}
              onChange={(e) =>
                setEventForm((prev) => ({ ...prev, venue: e.target.value }))
              }
              placeholder="Venue"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />
            <TourismMemberManager initialMembers={initialTourismMembers} />

            <input
              type="date"
              value={eventForm.date}
              onChange={(e) =>
                setEventForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <input
              value={eventForm.time}
              onChange={(e) =>
                setEventForm((prev) => ({ ...prev, time: e.target.value }))
              }
              placeholder="Event time"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            />

            <div className="flex items-center gap-6 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#121318]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventForm.highlighted}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      highlighted: e.target.checked,
                    }))
                  }
                />
                Highlighted
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventForm.isPublic}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      isPublic: e.target.checked,
                    }))
                  }
                />
                Public
              </label>
            </div>

            <textarea
              value={eventForm.description}
              onChange={(e) =>
                setEventForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Description"
              rows={4}
              className="lg:col-span-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <textarea
              value={eventForm.note}
              onChange={(e) =>
                setEventForm((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="Note"
              rows={3}
              className="lg:col-span-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            />

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold">Images (max 3)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleEventFiles}
                className="block w-full text-sm"
              />
              {eventForm.files.length > 0 && (
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {eventForm.files.map((file) => file.name).join(', ')}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
              >
                {editingEventId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingEventId ? 'Update Event' : 'Create Event'}
              </button>

              {editingEventId && (
                <button
                  type="button"
                  onClick={resetEventForm}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {[
              {
                title: 'BCCC Events',
                scope: 'bccc' as const,
                rows: bcccEvents,
              },
              {
                title: 'Baguio City Events',
                scope: 'city' as const,
                rows: cityEvents,
              },
            ].map((group) => (
              <div key={group.scope} className="space-y-4 rounded-3xl border border-black/5 p-5 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">{group.title}</h3>
                  <button
                    type="button"
                    onClick={() => saveEventSort(group.scope)}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
                  >
                    Save Order
                  </button>
                </div>

                <div className="space-y-4">
                  {group.rows.map((row, index) => (
                    <div
                      key={row.id}
                      className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                              {row.date}
                            </div>
                            <h4 className="mt-1 text-lg font-semibold">{row.title}</h4>
                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                              {row.venue}
                              {row.time ? ` • ${row.time}` : ''}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                                {row.highlighted ? 'Highlighted' : 'Standard'}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                                {row.isPublic ? 'Public' : 'Hidden'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => moveEvent(group.scope, index, -1)}
                              className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveEvent(group.scope, index, 1)}
                              className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => editEvent(row)}
                              className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (confirmDeleteAction('calendar block')) { deleteCalendarBlock(row.id); } }}
                              className="rounded-full border border-red-200 bg-white p-2 text-red-600 dark:border-red-400/20 dark:bg-[#17181c]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {row.description}
                        </p>

                        <ImageStrip images={row.images} emptyLabel="No event images uploaded." />
                      </div>
                    </div>
                  ))}

                  {group.rows.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                      No events added yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
) : null}
{showCalendarSection ? (
        <SectionCard
          title="Calendar Blocks"
          subtitle="Manage public status colors and blocked/private/public schedule windows."
          icon={CalendarDays}
        >
          <form
            onSubmit={submitCalendarBlock}
            className="grid gap-4 rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5 lg:grid-cols-2"
          >
            <input
              value={calendarBlockForm.title}
              onChange={(e) =>
                setCalendarBlockForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Block title"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <input
              value={calendarBlockForm.area}
              onChange={(e) =>
                setCalendarBlockForm((prev) => ({ ...prev, area: e.target.value }))
              }
              placeholder="Area"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            />

            <select
              value={calendarBlockForm.block}
              onChange={(e) =>
                setCalendarBlockForm((prev) => ({
                  ...prev,
                  block: e.target.value as CalendarBlockFormState['block'],
                }))
              }
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            >
              <option value="DAY">DAY</option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
              <option value="EVE">EVE</option>
            </select>

            <select
              value={calendarBlockForm.statusColor}
              onChange={(e) =>
                setCalendarBlockForm((prev) => ({
                  ...prev,
                  statusColor: e.target.value as CalendarBlockFormState['statusColor'],
                }))
              }
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            >
              <option value="red">Red - Blocked</option>
              <option value="gold">Gold - Private Booking</option>
              <option value="blue">Blue - Public Event</option>
            </select>

            <input
              type="date"
              value={calendarBlockForm.dateFrom}
              onChange={(e) =>
                setCalendarBlockForm((prev) => ({ ...prev, dateFrom: e.target.value }))
              }
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <input
              type="date"
              value={calendarBlockForm.dateTo}
              onChange={(e) =>
                setCalendarBlockForm((prev) => ({ ...prev, dateTo: e.target.value }))
              }
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <textarea
              value={calendarBlockForm.note}
              onChange={(e) =>
                setCalendarBlockForm((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="Notes"
              rows={3}
              className="lg:col-span-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            />

            <div className="lg:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
              >
                {editingCalendarBlockId ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingCalendarBlockId ? 'Update Block' : 'Create Block'}
              </button>

              {editingCalendarBlockId && (
                <button
                  type="button"
                  onClick={resetCalendarBlockForm}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 grid gap-4">
            {calendarBlocks.map((row) => (
              <div
                key={row.id}
                className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                        {row.block}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                        {row.statusColor}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{row.title}</h3>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      {row.area || 'No area specified'} • {row.dateFrom} to {row.dateTo}
                    </div>
                    {row.note && (
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {row.note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => editCalendarBlock(row)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCalendarBlock(row.id)}
                      className="rounded-full border border-red-200 bg-white p-2 text-red-600 dark:border-red-400/20 dark:bg-[#17181c]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {calendarBlocks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                No calendar blocks added yet.
              </div>
            )}
          </div>
        </SectionCard>
) : null}
{showHomeSection ? (
        <SectionCard
          title="Feature Packages"
          subtitle="Manage package cards shown on the public side."
          icon={Package2}
        >
          <form
            onSubmit={submitPackage}
            className="grid gap-4 rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5"
          >
            <input
              value={packageForm.title}
              onChange={(e) =>
                setPackageForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Package title"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <textarea
              value={packageForm.description}
              onChange={(e) =>
                setPackageForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Package description"
              rows={4}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <div>
              <label className="mb-2 block text-sm font-semibold">Images (max 3)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePackageFiles}
                className="block w-full text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
              >
                {editingPackageId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingPackageId ? 'Update Package' : 'Create Package'}
              </button>

              <button
                type="button"
                onClick={savePackageSort}
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
              >
                Save Order
              </button>

              {editingPackageId && (
                <button
                  type="button"
                  onClick={resetPackageForm}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {packages.map((row, index) => (
              <div
                key={row.id}
                className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <h3 className="text-lg font-semibold">{row.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => movePackage(index, -1)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePackage(index, 1)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editPackage(row)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirmDeleteAction('package')) { deletePackage(row.id); } }}
                      className="rounded-full border border-red-200 bg-white p-2 text-red-600 dark:border-red-400/20 dark:bg-[#17181c]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {row.description}
                </p>

                <div className="mt-4">
                  <ImageStrip images={row.images} emptyLabel="No package images uploaded." />
                </div>
              </div>
            ))}

            {packages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                No packages added yet.
              </div>
            )}
          </div>
        </SectionCard>
) : null}
        {showFacilitiesSection ? (
        <SectionCard
          title="Venue Spaces"
          subtitle="Manage facilities, tourism office cards, and homepage visibility."
          icon={LayoutGrid}
        >
          <form
            onSubmit={submitSpace}
            className="grid gap-4 rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5 lg:grid-cols-2"
          >
            <input
              value={spaceForm.title}
              onChange={(e) =>
                setSpaceForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Space title"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <input
              value={spaceForm.category}
              onChange={(e) =>
                setSpaceForm((prev) => ({ ...prev, category: e.target.value }))
              }
              placeholder="Category"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <input
              value={spaceForm.capacity}
              onChange={(e) =>
                setSpaceForm((prev) => ({ ...prev, capacity: e.target.value }))
              }
              placeholder="Capacity"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            />

            <label className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#121318]">
              <input
                type="checkbox"
                checked={spaceForm.homepageVisible}
                onChange={(e) =>
                  setSpaceForm((prev) => ({
                    ...prev,
                    homepageVisible: e.target.checked,
                  }))
                }
              />
              Show on homepage
            </label>

            <textarea
              value={spaceForm.shortDescription}
              onChange={(e) =>
                setSpaceForm((prev) => ({
                  ...prev,
                  shortDescription: e.target.value,
                }))
              }
              placeholder="Short description"
              rows={3}
              className="lg:col-span-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />

            <textarea
              value={spaceForm.summary}
              onChange={(e) =>
                setSpaceForm((prev) => ({ ...prev, summary: e.target.value }))
              }
              placeholder="Summary"
              rows={3}
              className="lg:col-span-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            />

            <textarea
              value={spaceForm.detailsText}
              onChange={(e) =>
                setSpaceForm((prev) => ({
                  ...prev,
                  detailsText: e.target.value,
                }))
              }
              placeholder="Details, one per line"
              rows={5}
              className="lg:col-span-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold">Light image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleSpaceLightFile}
                className="block w-full text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Dark image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleSpaceDarkFile}
                className="block w-full text-sm"
              />
            </div>

            <div className="lg:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
              >
                {editingSpaceId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingSpaceId ? 'Update Space' : 'Create Space'}
              </button>

              <button
                type="button"
                onClick={saveSpaceSort}
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
              >
                Save Order
              </button>

              {editingSpaceId && (
                <button
                  type="button"
                  onClick={resetSpaceForm}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 grid gap-4">
            {spaces.map((row, index) => (
              <div
                key={row.id}
                className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                        {row.category}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                        {row.capacity || 'No capacity'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10">
                        {row.homepageVisible ? 'Homepage Visible' : 'Hidden from Homepage'}
                      </span>
                    </div>

                    <h3 className="mt-2 text-lg font-semibold">{row.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {row.shortDescription}
                    </p>
                    {row.summary && (
                      <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                        {row.summary}
                      </p>
                    )}

                    {row.details.length > 0 && (
                      <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        {row.details.slice(0, 4).map((detail) => (
                          <li key={detail}>• {detail}</li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {row.lightImage && (
                        <img
                          src={row.lightImage}
                          alt={`${row.title} light`}
                          className="h-20 w-28 rounded-2xl border border-black/10 object-cover dark:border-white/10"
                        />
                      )}
                      {row.darkImage && (
                        <img
                          src={row.darkImage}
                          alt={`${row.title} dark`}
                          className="h-20 w-28 rounded-2xl border border-black/10 object-cover dark:border-white/10"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveSpace(index, -1)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSpace(index, 1)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editSpace(row)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirmDeleteAction('space')) { deleteSpace(row.id); } }}
                      className="rounded-full border border-red-200 bg-white p-2 text-red-600 dark:border-red-400/20 dark:bg-[#17181c]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {spaces.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                No spaces added yet.
              </div>
            )}
          </div>
        </SectionCard>
) : null}
        {showHomeSection ? (
        <SectionCard
          title="Homepage Stats"
          subtitle="Manage the counters and quick stats shown on the homepage."
          icon={ShieldCheck}
        >
          <form
            onSubmit={submitStat}
            className="grid gap-4 rounded-3xl border border-black/5 bg-[#f7f5ef] p-5 dark:border-white/10 dark:bg-white/5 lg:grid-cols-3"
          >
            <input
              value={statForm.label}
              onChange={(e) =>
                setStatForm((prev) => ({ ...prev, label: e.target.value }))
              }
              placeholder="Label"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />
            <input
              value={statForm.value}
              onChange={(e) =>
                setStatForm((prev) => ({ ...prev, value: e.target.value }))
              }
              placeholder="Value"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
              required
            />
            <input
              value={statForm.suffix}
              onChange={(e) =>
                setStatForm((prev) => ({ ...prev, suffix: e.target.value }))
              }
              placeholder="Suffix"
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-[#121318]"
            />

            <div className="lg:col-span-3 flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#174f40] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-[#2d47ff]"
              >
                {editingStatId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingStatId ? 'Update Stat' : 'Create Stat'}
              </button>

              <button
                type="button"
                onClick={saveStatSort}
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
              >
                Save Order
              </button>

              {editingStatId && (
                <button
                  type="button"
                  onClick={resetStatForm}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold dark:border-white/10 dark:bg-[#17181c]"
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((row, index) => (
              <div
                key={row.id}
                className="rounded-3xl border border-black/5 bg-[#f7f5ef] p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-3xl font-semibold">
                      {row.value}
                      {row.suffix}
                    </div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      {row.label}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveStat(index, -1)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStat(index, 1)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editStat(row)}
                      className="rounded-full border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#17181c]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirmDeleteAction('homepage stat')) { deleteStat(row.id); } }}
                      className="rounded-full border border-red-200 bg-white p-2 text-red-600 dark:border-red-400/20 dark:bg-[#17181c]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {stats.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                No homepage stats added yet.
              </div>
            )}
          </div>
        </SectionCard>
        ) :null}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#8ea3ff]">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Address</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
              {siteConfig.address || 'No address saved yet.'}
            </p>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#8ea3ff]">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Phone</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
              {siteConfig.phone || 'No phone saved yet.'}
            </p>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#121318]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#174f40] dark:bg-[#18231f] dark:text-[#8ea3ff]">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Email</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
              {siteConfig.email || 'No email saved yet.'}
            </p>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
