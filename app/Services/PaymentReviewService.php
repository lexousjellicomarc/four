<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingLifecycleEvent;
use App\Models\BookingPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PaymentReviewService
{
    public function approve(BookingPayment $payment, ?int $userId = null): BookingPayment
    {
        return DB::transaction(function () use ($payment, $userId): BookingPayment {
            $payment->loadMissing('booking');

            $this->updatePaymentStatus($payment, 'approved', $userId);
            $this->syncBookingPaymentStatus($payment->booking, $userId, 'Payment proof approved.');

            return $payment->fresh(['booking']);
        });
    }

    public function reject(BookingPayment $payment, ?int $userId = null, ?string $remarks = null): BookingPayment
    {
        return DB::transaction(function () use ($payment, $userId, $remarks): BookingPayment {
            $payment->loadMissing('booking');

            $this->updatePaymentStatus($payment, 'rejected', $userId, $remarks);
            $this->syncBookingPaymentStatus($payment->booking, $userId, 'Payment proof rejected.');

            return $payment->fresh(['booking']);
        });
    }

    public function updatePaymentStatus(
        BookingPayment $payment,
        string $status,
        ?int $userId = null,
        ?string $remarks = null
    ): void {
        $payload = [];

        if (Schema::hasColumn($payment->getTable(), 'status')) {
            $payload['status'] = $status;
        }

        if (Schema::hasColumn($payment->getTable(), 'payment_status')) {
            $payload['payment_status'] = $status;
        }

        if ($status === 'approved') {
            foreach (['approved_at', 'verified_at', 'reviewed_at'] as $column) {
                if (Schema::hasColumn($payment->getTable(), $column)) {
                    $payload[$column] = now();
                }
            }
        }

        if ($status === 'rejected') {
            foreach (['rejected_at', 'reviewed_at'] as $column) {
                if (Schema::hasColumn($payment->getTable(), $column)) {
                    $payload[$column] = now();
                }
            }
        }

        foreach (['reviewed_by_user_id', 'verified_by_user_id', 'updated_by_user_id'] as $column) {
            if ($userId && Schema::hasColumn($payment->getTable(), $column)) {
                $payload[$column] = $userId;
            }
        }

        if ($remarks !== null && Schema::hasColumn($payment->getTable(), 'remarks')) {
            $payload['remarks'] = $remarks;
        }

        $payment->forceFill($payload)->save();
    }

    public function syncBookingPaymentStatus(?Booking $booking, ?int $userId = null, ?string $eventDescription = null): void
    {
        if (! $booking) {
            return;
        }

        $booking->loadMissing('payments');

        $totalCharges = $this->bookingTotalCharges($booking);
        $approvedPayments = $this->approvedPaymentTotal($booking);
        $submittedPayments = $this->submittedPaymentTotal($booking);
        $remainingBalance = max($totalCharges - $approvedPayments, 0);

        $bookingPayload = [];

        if (Schema::hasColumn('bookings', 'payment_status')) {
            $bookingPayload['payment_status'] = $this->resolveBookingPaymentStatus(
                totalCharges: $totalCharges,
                approvedPayments: $approvedPayments,
                submittedPayments: $submittedPayments,
                currentPaymentStatus: (string) ($booking->payment_status ?? '')
            );
        }

        if ($remainingBalance <= 0 && $approvedPayments > 0) {
            if (Schema::hasColumn('bookings', 'payment_balance_due_at')) {
                $bookingPayload['payment_balance_due_at'] = null;
            }

            if (Schema::hasColumn('bookings', 'expired_at')) {
                $bookingPayload['expired_at'] = null;
            }

            if (Schema::hasColumn('bookings', 'booking_status')) {
                $currentStatus = strtolower(str_replace(['-', ' '], '_', (string) ($booking->booking_status ?? '')));

                if (in_array($currentStatus, ['pending', 'submitted', 'pencil_booked', 'for_review'], true)) {
                    $bookingPayload['booking_status'] = 'approved';
                }
            }
        }

        if ($remainingBalance > 0 && $approvedPayments > 0) {
            if (Schema::hasColumn('bookings', 'payment_balance_due_at') && blank($booking->payment_balance_due_at)) {
                $bookingPayload['payment_balance_due_at'] = now()->addHours(BookingDeadlineService::BALANCE_DEADLINE_HOURS);
            }
        }

        if ($userId && Schema::hasColumn('bookings', 'updated_by_user_id')) {
            $bookingPayload['updated_by_user_id'] = $userId;
        }

        if (! empty($bookingPayload)) {
            $booking->forceFill($bookingPayload)->save();
        }

        $this->recordLifecycleEvent(
            booking: $booking->fresh(),
            userId: $userId,
            description: $eventDescription,
            meta: [
                'total_charges' => $totalCharges,
                'approved_payments' => $approvedPayments,
                'submitted_payments' => $submittedPayments,
                'remaining_balance' => $remainingBalance,
            ]
        );
    }

    public function bookingTotalCharges(Booking $booking): float
    {
        if (isset($booking->totals) && is_array($booking->totals) && isset($booking->totals['items_total'])) {
            return (float) $booking->totals['items_total'];
        }

        foreach (['total_amount', 'grand_total', 'amount_due', 'estimated_total', 'total_price'] as $column) {
            if (Schema::hasColumn('bookings', $column) && filled($booking->{$column})) {
                return (float) $booking->{$column};
            }
        }

        if (method_exists($booking, 'bookingServices')) {
            try {
                $items = $booking->relationLoaded('bookingServices')
                    ? $booking->bookingServices
                    : $booking->bookingServices()->get();

                $sum = 0;

                foreach ($items as $item) {
                    foreach (['total', 'amount', 'price', 'subtotal', 'line_total'] as $column) {
                        if (isset($item->{$column})) {
                            $sum += (float) $item->{$column};
                            continue 2;
                        }
                    }
                }

                if ($sum > 0) {
                    return $sum;
                }
            } catch (\Throwable) {
                return 0;
            }
        }

        return 0;
    }

    public function approvedPaymentTotal(Booking $booking): float
    {
        return $this->paymentTotalByStatuses($booking, [
            'approved',
            'verified',
            'paid',
            'completed',
            'settled',
        ]);
    }

    public function submittedPaymentTotal(Booking $booking): float
    {
        return $this->paymentTotalByStatuses($booking, [
            'pending',
            'submitted',
            'for_review',
            'awaiting_review',
            'awaiting review',
        ]);
    }

    private function paymentTotalByStatuses(Booking $booking, array $statuses): float
    {
        if (! method_exists($booking, 'payments')) {
            return 0;
        }

        try {
            $payments = $booking->relationLoaded('payments')
                ? $booking->payments
                : $booking->payments()->get();

            return (float) $payments
                ->filter(function ($payment) use ($statuses): bool {
                    $status = strtolower(str_replace(['-', ' '], '_', (string) ($payment->status ?? $payment->payment_status ?? '')));

                    return in_array($status, array_map(
                        fn (string $value): string => strtolower(str_replace(['-', ' '], '_', $value)),
                        $statuses
                    ), true);
                })
                ->sum(fn ($payment): float => (float) ($payment->amount ?? 0));
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveBookingPaymentStatus(
        float $totalCharges,
        float $approvedPayments,
        float $submittedPayments,
        string $currentPaymentStatus
    ): string {
        if ($totalCharges > 0 && $approvedPayments >= $totalCharges) {
            return 'paid';
        }

        if ($approvedPayments > 0) {
            return 'partial';
        }

        if ($submittedPayments > 0) {
            return 'for_review';
        }

        $normalized = strtolower(str_replace(['-', ' '], '_', $currentPaymentStatus));

        if (in_array($normalized, ['expired', 'rejected', 'declined'], true)) {
            return $normalized;
        }

        return 'pending';
    }

    private function recordLifecycleEvent(
        ?Booking $booking,
        ?int $userId,
        ?string $description,
        array $meta = []
    ): void {
        if (! $booking || ! class_exists(BookingLifecycleEvent::class) || ! Schema::hasTable('booking_lifecycle_events')) {
            return;
        }

        try {
            $payload = [
                'booking_id' => $booking->id,
            ];

            $table = 'booking_lifecycle_events';

            if (Schema::hasColumn($table, 'label')) {
                $payload['label'] = 'payment_review';
            }

            if (Schema::hasColumn($table, 'title')) {
                $payload['title'] = 'Payment Review Updated';
            }

            if (Schema::hasColumn($table, 'description')) {
                $payload['description'] = $description ?: 'Payment review status was updated.';
            }

            if (Schema::hasColumn($table, 'from_payment_status')) {
                $payload['from_payment_status'] = null;
            }

            if (Schema::hasColumn($table, 'to_payment_status')) {
                $payload['to_payment_status'] = $booking->payment_status ?? null;
            }

            if (Schema::hasColumn($table, 'from_booking_status')) {
                $payload['from_booking_status'] = null;
            }

            if (Schema::hasColumn($table, 'to_booking_status')) {
                $payload['to_booking_status'] = $booking->booking_status ?? null;
            }

            if (Schema::hasColumn($table, 'event_at')) {
                $payload['event_at'] = now();
            }

            if (Schema::hasColumn($table, 'user_id') && $userId) {
                $payload['user_id'] = $userId;
            }

            if (Schema::hasColumn($table, 'created_by_user_id') && $userId) {
                $payload['created_by_user_id'] = $userId;
            }

            if (Schema::hasColumn($table, 'meta')) {
                $payload['meta'] = $meta;
            }

            BookingLifecycleEvent::query()->create($payload);
        } catch (\Throwable) {
            // Do not block payment review if audit logging shape differs.
        }
    }
}
