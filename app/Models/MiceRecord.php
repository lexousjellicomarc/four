<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class MiceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'record_no',
        'year_recorded',
        'enterprise_group',
        'btc_group_code',

        'establishment_name',
        'event_name',
        'event_category',
        'type_of_event',
        'venue_area',
        'event_date_from',
        'event_date_to',

        'organization_name',
        'organizer_name',
        'organizer_type',
        'contact_person',
        'contact_number',
        'email',
        'address',

        'local_male_participants',
        'local_female_participants',
        'domestic_male_participants',
        'domestic_female_participants',
        'foreign_male_participants',
        'foreign_female_participants',

        'main_origin_country',
        'main_origin_province',
        'main_origin_city',

        'same_day_visitors',
        'overnight_visitors',
        'estimated_room_nights',
        'estimated_tourism_receipts',

        'total_employees',
        'female_employees',
        'male_employees',

        'permit_to_engage',
        'dot_accredited',
        'active_member',

        'remarks',
        'event_days',
        'total_participants',

        'status',
        'submitted_at',
        'submitted_by_user_id',
        'updated_by_user_id',
    ];

    protected $casts = [
        'booking_id' => 'integer',
        'year_recorded' => 'integer',

        'event_date_from' => 'datetime',
        'event_date_to' => 'datetime',
        'submitted_at' => 'datetime',

        'local_male_participants' => 'integer',
        'local_female_participants' => 'integer',
        'domestic_male_participants' => 'integer',
        'domestic_female_participants' => 'integer',
        'foreign_male_participants' => 'integer',
        'foreign_female_participants' => 'integer',

        'same_day_visitors' => 'integer',
        'overnight_visitors' => 'integer',
        'estimated_room_nights' => 'integer',
        'estimated_tourism_receipts' => 'decimal:2',

        'total_employees' => 'integer',
        'female_employees' => 'integer',
        'male_employees' => 'integer',

        'permit_to_engage' => 'boolean',
        'dot_accredited' => 'boolean',
        'active_member' => 'boolean',

        'event_days' => 'integer',
        'total_participants' => 'integer',

        'submitted_by_user_id' => 'integer',
        'updated_by_user_id' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (MiceRecord $record): void {
            $record->applySafeDefaults();
        });

        static::updating(function (MiceRecord $record): void {
            $record->applySafeDefaults();
        });
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    public function applySafeDefaults(): void
    {
        if (blank($this->establishment_name)) {
            $this->establishment_name = $this->organization_name
                ?: $this->organizer_name
                ?: $this->event_name
                ?: 'Baguio Convention and Cultural Center';
        }

        if (blank($this->event_name)) {
            $this->event_name = $this->establishment_name ?: 'Untitled Event';
        }

        if (blank($this->type_of_event)) {
            $this->type_of_event = $this->event_category ?: $this->event_name;
        }

        if (blank($this->venue_area)) {
            $this->venue_area = 'Baguio Convention and Cultural Center';
        }

        if (blank($this->enterprise_group)) {
            $this->enterprise_group = 'UNCLASSIFIED';
        }

        if (blank($this->main_origin_country)) {
            $this->main_origin_country = 'Philippines';
        }

        if (blank($this->status)) {
            $this->status = 'submitted';
        }

        if (blank($this->submitted_at)) {
            $this->submitted_at = now();
        }

        if (blank($this->event_date_from)) {
            $this->event_date_from = now()->startOfDay();
        }

        if (blank($this->event_date_to)) {
            $this->event_date_to = $this->event_date_from;
        }

        if (blank($this->year_recorded)) {
            $this->year_recorded = Carbon::parse($this->event_date_from)->year;
        }

        if (blank($this->event_days) || (int) $this->event_days <= 0) {
            $this->event_days = max(
                1,
                Carbon::parse($this->event_date_from)->startOfDay()
                    ->diffInDays(Carbon::parse($this->event_date_to)->startOfDay()) + 1
            );
        }

        $calculatedParticipants =
            (int) $this->local_male_participants
            + (int) $this->local_female_participants
            + (int) $this->domestic_male_participants
            + (int) $this->domestic_female_participants
            + (int) $this->foreign_male_participants
            + (int) $this->foreign_female_participants;

        if (blank($this->total_participants) || (int) $this->total_participants <= 0) {
            $this->total_participants = $calculatedParticipants;
        }

        $calculatedEmployees = (int) $this->female_employees + (int) $this->male_employees;

        if ((blank($this->total_employees) || (int) $this->total_employees <= 0) && $calculatedEmployees > 0) {
            $this->total_employees = $calculatedEmployees;
        }
    }
}
