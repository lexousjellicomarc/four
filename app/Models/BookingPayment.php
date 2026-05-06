<?php

namespace App\Models;

use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class BookingPayment extends Model
{
    protected $fillable = [
        'booking_id',
        'payment_method',
        'payment_gateway',
        'payment_type',
        'amount',
        'transaction_reference',
        'status',
        'proof_image_path',
        'proof_image_name',
        'proof_image_mime',
        'remarks',
        'payer_name',
        'card_holder_name',
        'card_last_four',
        'card_expiration',
        'marketing_consent',
        'payment_meta',
        'paid_at',
        'verified_at',
        'approved_at',
        'declined_at',
        'failed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'marketing_consent' => 'boolean',
        'payment_meta' => 'array',
        'paid_at' => 'datetime',
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
        'declined_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    protected $appends = [
        'proof_image_url',
    ];

    public array $notificationChanges = [];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function getProofImageUrlAttribute(): ?string
    {
        if (! $this->proof_image_path || ! $this->booking_id || ! $this->id) {
            return null;
        }

        $version = $this->updated_at?->timestamp ?? $this->created_at?->timestamp ?? time();

        return url("/my-bookings/{$this->booking_id}/payments/{$this->id}/proof") . '?v=' . $version;
    }

    protected static function booted(): void
    {
        static::created(function (BookingPayment $payment) {
            if (app()->runningInConsole()) {
                return;
            }

            $booking = method_exists($payment, 'booking')
                ? $payment->booking()->first()
                : Booking::find($payment->booking_id);

            if (! $booking) {
                return;
            }

            try {
                app(NotificationService::class)->paymentCreated($payment, $booking, Auth::user());
            } catch (\Throwable $exception) {
                report($exception);
            }
        });

        static::updating(function (BookingPayment $payment) {
            $changes = [];

            foreach ($payment->getDirty() as $field => $newValue) {
                if ($field === 'updated_at') {
                    continue;
                }

                $changes[$field] = [$payment->getOriginal($field), $newValue];
            }

            $payment->notificationChanges = $changes;
        });

        static::updated(function (BookingPayment $payment) {
            if (app()->runningInConsole()) {
                return;
            }

            $changes = $payment->notificationChanges ?? [];

            if (empty($changes)) {
                return;
            }

            $booking = method_exists($payment, 'booking')
                ? $payment->booking()->first()
                : Booking::find($payment->booking_id);

            if (! $booking) {
                return;
            }

            try {
                app(NotificationService::class)->paymentUpdated($payment, $booking, Auth::user(), $changes);
            } catch (\Throwable $exception) {
                report($exception);
            }
        });
    }
}
