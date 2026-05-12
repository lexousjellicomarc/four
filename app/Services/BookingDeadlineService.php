<?php

namespace App\Services;

use App\Models\Booking;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BookingDeadlineService
{
    public const INITIAL_DEADLINE_HOURS = 24;
    public const BALANCE_DEADLINE_HOURS = 24;

    /**
     * Run all safe deadline automation.
     *
     * @return array<string, int>
     */
    public function run(?CarbonInterface $now = null): array
    {
        $now ??= now();

        if (! Schema::hasTable('bookings')) {
            return [
                'seeded_initial_deadlines' => 0,
                'expired_initial_deadlines' => 0,
                'seeded_balance_deadlines' => 0,
                'expired_balance_deadlines' => 0,
            ];
        }

        return [
            'seeded_initial_deadlines' => $this->seedMissingInitialDeadlines($now),
            'expired_initial_deadlines' => $this->expireInitialDeadlines($now),
            'seeded_balance_deadlines' => $this->seedMissingBalanceDeadlines($now),
            'expired_balance_deadlines' => $this->expireBalanceDeadlines($now),
        ];
    }

    public function seedMissingInitialDeadlines(?CarbonInterface $now = null): int
    {
        $now ??= now();

        if (! $this->canUseInitialDeadline()) {
            return 0;
        }

        $updated = 0;

        Booking::query()
            ->whereNull('expired_at')
            ->whereIn('booking_status', $this->initialDeadlineStatuses())
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use (&$updated, $now): void {
                foreach ($bookings as $booking) {
                    $base = $booking->created_at ?: $now;

                    $booking->forceFill([
                        'expired_at' => $base->copy()->addHours(self::INITIAL_DEADLINE_HOURS),
                    ])->save();

                    $updated++;
                }
            });

        return $updated;
    }

    public function expireInitialDeadlines(?CarbonInterface $now = null): int
    {
        $now ??= now();

        if (! $this->canUseInitialDeadline()) {
            return 0;
        }

        $expired = 0;

        Booking::query()
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', $now)
            ->whereIn('booking_status', $this->initialDeadlineStatuses())
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use (&$expired, $now): void {
                foreach ($bookings as $booking) {
                    if ($this->isProtectedFromAutoDecline($booking)) {
                        continue;
                    }

                    $payload = [
                        'booking_status' => 'declined',
                    ];

                    if (Schema::hasColumn('bookings', 'payment_status')) {
                        $payload['payment_status'] = 'expired';
                    }

                    if (Schema::hasColumn('bookings', 'auto_declined_at')) {
                        $payload['auto_declined_at'] = $now;
                    }

                    if (Schema::hasColumn('bookings', 'auto_decline_reason')) {
                        $payload['auto_decline_reason'] = 'Automatically declined because the 24-hour pencil booking/payment deadline expired without completion.';
                    }

                    $booking->forceFill($payload)->save();

                    $expired++;
                }
            });

        return $expired;
    }

    public function seedMissingBalanceDeadlines(?CarbonInterface $now = null): int
    {
        $now ??= now();

        if (! $this->canUseBalanceDeadline()) {
            return 0;
        }

        $updated = 0;

        Booking::query()
            ->whereNull('payment_balance_due_at')
            ->whereIn('booking_status', $this->activeBookingStatuses())
            ->whereIn('payment_status', $this->partialPaymentStatuses())
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use (&$updated, $now): void {
                foreach ($bookings as $booking) {
                    $base = $booking->updated_at ?: $booking->created_at ?: $now;

                    $booking->forceFill([
                        'payment_balance_due_at' => $base->copy()->addHours(self::BALANCE_DEADLINE_HOURS),
                    ])->save();

                    $updated++;
                }
            });

        return $updated;
    }

    public function expireBalanceDeadlines(?CarbonInterface $now = null): int
    {
        $now ??= now();

        if (! $this->canUseBalanceDeadline()) {
            return 0;
        }

        $expired = 0;

        Booking::query()
            ->whereNotNull('payment_balance_due_at')
            ->where('payment_balance_due_at', '<=', $now)
            ->whereIn('booking_status', $this->activeBookingStatuses())
            ->whereIn('payment_status', $this->partialPaymentStatuses())
            ->orderBy('id')
            ->chunkById(100, function ($bookings) use (&$expired, $now): void {
                foreach ($bookings as $booking) {
                    if ($this->isProtectedFromAutoDecline($booking)) {
                        continue;
                    }

                    $payload = [
                        'booking_status' => 'declined',
                        'payment_status' => 'expired',
                    ];

                    if (Schema::hasColumn('bookings', 'auto_declined_at')) {
                        $payload['auto_declined_at'] = $now;
                    }

                    if (Schema::hasColumn('bookings', 'auto_decline_reason')) {
                        $payload['auto_decline_reason'] = 'Automatically declined because the balance payment deadline expired without completion.';
                    }

                    $booking->forceFill($payload)->save();

                    $expired++;
                }
            });

        return $expired;
    }

    public function assignInitialDeadline(Booking $booking, ?CarbonInterface $baseTime = null): Booking
    {
        if (! Schema::hasColumn('bookings', 'expired_at')) {
            return $booking;
        }

        $baseTime ??= $booking->created_at ?: now();

        if (blank($booking->expired_at)) {
            $booking->forceFill([
                'expired_at' => $baseTime->copy()->addHours(self::INITIAL_DEADLINE_HOURS),
            ])->save();
        }

        return $booking;
    }

    public function assignBalanceDeadline(Booking $booking, ?CarbonInterface $baseTime = null): Booking
    {
        if (! Schema::hasColumn('bookings', 'payment_balance_due_at')) {
            return $booking;
        }

        $baseTime ??= now();

        $booking->forceFill([
            'payment_balance_due_at' => $baseTime->copy()->addHours(self::BALANCE_DEADLINE_HOURS),
        ])->save();

        return $booking;
    }

    /**
     * @return array<int, string>
     */
    private function initialDeadlineStatuses(): array
    {
        return [
            'pending',
            'submitted',
            'pencil_booked',
            'pencil-booked',
            'for_review',
            'for review',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function activeBookingStatuses(): array
    {
        return [
            'pending',
            'submitted',
            'pencil_booked',
            'pencil-booked',
            'for_review',
            'for review',
            'approved',
            'confirmed',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function completedBookingStatuses(): array
    {
        return [
            'approved',
            'confirmed',
            'completed',
            'cancelled',
            'canceled',
            'declined',
            'rejected',
            'archived',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function completedPaymentStatuses(): array
    {
        return [
            'paid',
            'verified',
            'completed',
            'settled',
            'approved',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function partialPaymentStatuses(): array
    {
        return [
            'partial',
            'partially_paid',
            'downpayment_paid',
            'down_payment_paid',
            'balance_pending',
            'for_balance',
        ];
    }

    private function canUseInitialDeadline(): bool
    {
        return Schema::hasColumn('bookings', 'booking_status')
            && Schema::hasColumn('bookings', 'expired_at');
    }

    private function canUseBalanceDeadline(): bool
    {
        return Schema::hasColumn('bookings', 'booking_status')
            && Schema::hasColumn('bookings', 'payment_status')
            && Schema::hasColumn('bookings', 'payment_balance_due_at');
    }

    private function isProtectedFromAutoDecline(Booking $booking): bool
    {
        $bookingStatus = strtolower((string) ($booking->booking_status ?? ''));
        $paymentStatus = strtolower((string) ($booking->payment_status ?? ''));

        if (in_array($bookingStatus, $this->completedBookingStatuses(), true)) {
            return true;
        }

        if (in_array($paymentStatus, $this->completedPaymentStatuses(), true)) {
            return true;
        }

        if (Schema::hasColumn('bookings', 'archived_at') && filled($booking->archived_at)) {
            return true;
        }

        return false;
    }
}
