<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MiceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'btc_group_code',
        'record_no',
        'establishment_name',
        'business_type',
        'seats_unit',
        'total_employees',
        'year_recorded',
        'region',
        'province_huc',
        'city_municipality',
        'month_added',
        'female_employees',
        'male_employees',
        'classification',
        'enterprise_group',
        'permit_to_engage',
        'dot_accredited',
        'active_member',
        'remarks',
    ];

    protected $casts = [
        'booking_id' => 'integer',
        'record_no' => 'integer',
        'total_employees' => 'integer',
        'year_recorded' => 'integer',
        'female_employees' => 'integer',
        'male_employees' => 'integer',
        'permit_to_engage' => 'boolean',
        'dot_accredited' => 'boolean',
        'active_member' => 'boolean',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
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
}
