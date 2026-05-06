<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MiceRecord extends Model
{
    protected $fillable = [
        'booking_id',
        'submitted_by_user_id',
        'updated_by_user_id',

        'record_no',
        'year_recorded',
        'status',

        'enterprise_group',
        'btc_group_code',

        'event_name',
        'event_category',
        'type_of_event',
        'venue_area',
        'event_date_from',
        'event_date_to',
        'event_days',

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
        'total_participants',

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
        'submitted_at',
    ];

    protected $casts = [
        'booking_id' => 'integer',
        'submitted_by_user_id' => 'integer',
        'updated_by_user_id' => 'integer',

        'record_no' => 'integer',
        'year_recorded' => 'integer',
        'event_days' => 'integer',

        'local_male_participants' => 'integer',
        'local_female_participants' => 'integer',
        'domestic_male_participants' => 'integer',
        'domestic_female_participants' => 'integer',
        'foreign_male_participants' => 'integer',
        'foreign_female_participants' => 'integer',
        'total_participants' => 'integer',

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

        'event_date_from' => 'date',
        'event_date_to' => 'date',
        'submitted_at' => 'datetime',
    ];

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

    public function getNormalizedEnterpriseGroupAttribute(): string
    {
        $value = strtoupper(trim((string) ($this->enterprise_group ?? '')));

        return in_array($value, ['PTE', 'STE'], true) ? $value : 'UNCLASSIFIED';
    }

    public function getNormalizedGroupCodeAttribute(): string
    {
        $value = strtoupper(trim((string) ($this->btc_group_code ?? '')));

        return $value !== '' ? $value : 'UNASSIGNED';
    }

    public function getIsSubmittedAttribute(): bool
    {
        return $this->submitted_at !== null && $this->status === 'submitted';
    }
}
