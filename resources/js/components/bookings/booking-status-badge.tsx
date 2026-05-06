import { cleanLabel, statusTone } from '@/lib/booking-role-ui';

type BookingStatusBadgeProps = {
  value?: string | null;
  label?: string;
  compact?: boolean;
};

export function BookingStatusBadge({
  value,
  label,
  compact = false,
}: BookingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(
        value,
      )} ${compact ? 'px-2 py-1 text-[9px]' : ''}`}
    >
      {label || cleanLabel(value)}
    </span>
  );
}
