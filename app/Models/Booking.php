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
        'is_public_calendar_visible' => 'boolean',
        'number_of_guests' => 'integer',
        'payment_meta' => 'array',
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

    public function scopeActiveForCalendar($query)
    {
        return $query->whereIn('booking_status', ['active', 'confirmed', 'approved']);
    }

    public function scopePublicVisible($query)
    {
        return $query->where('is_public_calendar_visible', true);
    }
}
