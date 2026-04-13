<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingLifecycleEvent extends Model
{
    use HasFactory;

    protected $table = 'booking_lifecycle_events';

    protected $fillable = [
        'booking_id',
        'actor_user_id',
        'event_key',
        'title',
        'from_status',
        'to_status',
        'from_payment_status',
        'to_payment_status',
        'reason',
        'meta',
        'event_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'event_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
