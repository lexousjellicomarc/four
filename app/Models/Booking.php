<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'booking_date_from' => 'datetime',
        'booking_date_to' => 'datetime',
        'flexible_date_from' => 'datetime',
        'flexible_date_to' => 'datetime',

        'expired_at' => 'datetime',
        'payment_balance_due_at' => 'datetime',
        'auto_declined_at' => 'datetime',

        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'declined_at' => 'datetime',
        'archived_at' => 'datetime',

        'is_public_calendar_visible' => 'boolean',
        'number_of_guests' => 'integer',
        'payment_meta' => 'array',
    ];

    protected $appends = [
        'display_title',
        'display_client',
        'deadline_state',
        'deadline_label',
        'deadline_at',
        'deadline_seconds_remaining',
        'deadline_is_expired',
        'deadline_is_due_soon',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function miceRecord(): HasOne
    {
        return $this->hasOne(MiceRecord::class);
    }

    public function bookingServices(): HasMany
    {
        return $this->hasMany(BookingService::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BookingPayment::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function lifecycleEvents(): HasMany
    {
        return $this->hasMany(BookingLifecycleEvent::class);
    }

    public function views(): HasMany
    {
        return $this->hasMany(BookingView::class);
    }

    public function getDisplayTitleAttribute(): string
    {
        return trim((string) (
            $this->public_calendar_title
            ?: $this->type_of_event
            ?: $this->company_name
            ?: $this->client_name
            ?: 'Booking'
        ));
    }

    public function getDisplayClientAttribute(): string
    {
        return trim((string) (
            $this->company_name
            ?: $this->client_name
            ?: $this->client_email
            ?: 'Client'
        ));
    }

    public function getDeadlineAtAttribute(): ?string
    {
        $deadline = $this->payment_balance_due_at ?: $this->expired_at;

        return $deadline ? $deadline->toISOString() : null;
    }

    public function getDeadlineSecondsRemainingAttribute(): ?int
    {
        $deadline = $this->payment_balance_due_at ?: $this->expired_at;

        if (! $deadline) {
            return null;
        }

        return now()->diffInSeconds($deadline, false);
    }

    public function getDeadlineIsExpiredAttribute(): bool
    {
        $remaining = $this->deadline_seconds_remaining;

        return $remaining !== null && $remaining <= 0;
    }

    public function getDeadlineIsDueSoonAttribute(): bool
    {
        $remaining = $this->deadline_seconds_remaining;

        if ($remaining === null) {
            return false;
        }

        return $remaining > 0 && $remaining <= 60 * 60 * 3;
    }

    public function getDeadlineStateAttribute(): string
    {
        $bookingStatus = strtolower((string) ($this->booking_status ?? ''));
        $paymentStatus = strtolower((string) ($this->payment_status ?? ''));

        $bookingStatus = str_replace(['-', ' '], '_', $bookingStatus);
        $paymentStatus = str_replace(['-', ' '], '_', $paymentStatus);

        if (
            filled($this->auto_declined_at)
            || in_array($bookingStatus, ['declined', 'rejected'], true)
        ) {
            return 'auto_declined';
        }

        if (
            in_array($paymentStatus, ['paid', 'verified', 'completed', 'settled', 'approved'], true)
            || in_array($bookingStatus, ['approved', 'confirmed', 'completed', 'active'], true)
        ) {
            return 'protected';
        }

        if ($this->deadline_is_expired) {
            return 'expired';
        }

        if ($this->deadline_is_due_soon) {
            return 'due_soon';
        }

        if ($this->deadline_at) {
            return 'active';
        }

        return 'none';
    }

    public function getDeadlineLabelAttribute(): string
    {
        return match ($this->deadline_state) {
            'auto_declined' => 'Auto-declined',
            'protected' => 'Settled / Protected',
            'expired' => 'Deadline expired',
            'due_soon' => 'Due soon',
            'active' => 'Deadline active',
            default => 'No deadline',
        };
    }

    public function scopeActiveForCalendar($query)
    {
        return $query->whereIn('booking_status', [
            'active',
            'confirmed',
            'approved',
        ]);
    }

    public function scopePublicVisible($query)
    {
        return $query->where('is_public_calendar_visible', true);
    }

    public function scopePendingDeadline($query)
    {
        return $query
            ->whereNotNull('expired_at')
            ->whereIn('booking_status', [
                'pending',
                'submitted',
                'pencil_booked',
                'pencil-booked',
                'for_review',
                'for review',
            ]);
    }

    public function scopeAutoDeclined($query)
    {
        return $query
            ->whereNotNull('auto_declined_at')
            ->orWhereIn('booking_status', ['declined', 'rejected']);
    }
}
