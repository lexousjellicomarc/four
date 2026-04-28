import { cleanLabel, statusTone } from '@/lib/booking-role-ui';

type BookingStatusBadgeProps = {
  value?: string | null;
};

export function BookingStatusBadge({ value }: BookingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusTone(
        value,
      )}`}
    >
      {cleanLabel(value)}
    </span>
  );
}
