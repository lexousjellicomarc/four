<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;

class Booking extends Model
{
    use HasFactory;

    protected $table = 'bookings';

    protected $fillable = [
        'created_by_user_id',
        'service_id',
        'company_name',
        'client_name',
        'client_contact_number',
        'client_email',
        'client_address',
        'head_of_organization',
        'type_of_event',
        'booking_date_from',
        'booking_date_to',
        'flexible_date_from',
        'flexible_date_to',
        'number_of_guests',
        'booking_status',
        'payment_status',
        'survey_email',
        'survey_proof_image_path',
        'survey_proof_image',
        'survey_proof_image_mime',
        'survey_proof_image_name',
    ];

    protected $hidden = [
        'survey_proof_image',
    ];

    protected $appends = [
        'survey_proof_image_url',
    ];

    public function getSurveyProofImageUrlAttribute(): ?string
    {
        $version = $this->updated_at?->timestamp ?? $this->created_at?->timestamp ?? time();

        if (!empty($this->survey_proof_image_name)) {
            return url("/bookings/{$this->id}/survey-proof-image") . '?v=' . $version;
        }

        if (!empty($this->survey_proof_image_path)) {
            $diskUrl = Storage::disk('public')->url($this->survey_proof_image_path);
            return $diskUrl . (str_contains($diskUrl, '?') ? '&' : '?') . 'v=' . $version;
        }

        return null;
    }

    protected $casts = [
        'booking_date_from'  => 'datetime',
        'booking_date_to'    => 'datetime',
        'flexible_date_from' => 'datetime',
        'flexible_date_to'   => 'datetime',
        'number_of_guests'   => 'integer',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function bookingServices(): HasMany
    {
        return $this->hasMany(BookingService::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BookingPayment::class, 'booking_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function views(): HasMany
    {
        return $this->hasMany(BookingView::class, 'booking_id');
    }

    public function lifecycleEvents(): HasMany
    {
        return $this->hasMany(BookingLifecycleEvent::class, 'booking_id')
            ->orderBy('event_at')
            ->orderBy('id');
    }

    public array $notificationChanges = [];

    protected static function booted(): void
    {
        static::created(function (Booking $booking) {
            if (app()->runningInConsole()) return;

            try {
                app(NotificationService::class)->bookingCreated($booking, Auth::user());
            } catch (\Throwable $e) {
                report($e);
            }
        });

        static::updating(function (Booking $booking) {
            $changes = [];

            foreach ($booking->getDirty() as $field => $newValue) {
                if ($field === 'updated_at') continue;
                $changes[$field] = [$booking->getOriginal($field), $newValue];
            }

            $booking->notificationChanges = $changes;
        });

        static::updated(function (Booking $booking) {
            if (app()->runningInConsole()) return;

            $changes = $booking->notificationChanges ?? [];
            if (empty($changes)) return;

            try {
                app(NotificationService::class)->bookingUpdated($booking, Auth::user(), $changes);
            } catch (\Throwable $e) {
                report($e);
            }
        });

        static::deleted(function (Booking $booking) {
            if (app()->runningInConsole()) return;

            try {
                app(NotificationService::class)->bookingDeleted($booking, Auth::user());
            } catch (\Throwable $e) {
                report($e);
            }
        });
    }
}
