import { BLOCK_KEYS, BLOCK_META } from '@/lib/unified-schedule';

export type BlockKey = 'AM' | 'PM' | 'EVE';

export type CalendarBlockFormState = {
  title: string;
  area: string;
  notes: string;
  block: BlockKey;
  public_status: 'red' | 'gold' | 'blue';
  date_from: string;
  date_to: string;
  block_id?: number;
};

type Props = {
  open: boolean;
  title: string;
  form: CalendarBlockFormState;
  areaOptions: string[];
  busy: boolean;
  error: string;
  helperText?: string;
  saveLabel?: string;
  onChange: (patch: Partial<CalendarBlockFormState>) => void;
  onClose: () => void;
  onSave: () => void;
};

export function CalendarBlockModal({
  open,
  title,
  form,
  areaOptions,
  busy,
  error,
  helperText,
  saveLabel = 'Save calendar item',
  onChange,
  onClose,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-black/10 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.28)] dark:border-white/10 dark:bg-[#121318]">
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Calendar management
            </div>
            <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 px-3 py-1 text-sm dark:border-white/10"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold">Title</label>
            <input
              value={form.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-[#0f1117]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Area</label>
            <select
              value={form.area}
              onChange={(e) => onChange({ area: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-[#0f1117]"
            >
              <option value="">All areas</option>
              {areaOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Block</label>
            <select
              value={form.block}
              onChange={(e) => onChange({ block: e.target.value as BlockKey })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-[#0f1117]"
            >
              {BLOCK_KEYS.map((block) => (
                <option key={block} value={block}>
                  {BLOCK_META[block].label} · {BLOCK_META[block].time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Date from</label>
            <input
              type="date"
              value={form.date_from}
              onChange={(e) => onChange({ date_from: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-[#0f1117]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Date to</label>
            <input
              type="date"
              value={form.date_to}
              onChange={(e) => onChange({ date_to: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-[#0f1117]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold">Status color</label>
            <select
              value={form.public_status}
              onChange={(e) => onChange({ public_status: e.target.value as CalendarBlockFormState['public_status'] })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-[#0f1117]"
            >
              <option value="red">Red · Blocked / unavailable</option>
              <option value="gold">Gold · Private / reserved</option>
              <option value="blue">Blue · Public / visible</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold">Notes</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-[#0f1117]"
            />
          </div>
          {helperText ? (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-black/10 px-4 py-3 text-xs leading-6 text-slate-500 dark:border-white/10 dark:text-slate-300">
              {helperText}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-black/5 px-6 py-4 dark:border-white/10">
          <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onSave}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {busy ? 'Saving...' : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
