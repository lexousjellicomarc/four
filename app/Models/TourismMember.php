<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TourismMember extends Model
{
    protected $fillable = [
        'full_name',
        'designation',
        'unit_name',
        'email',
        'phone',
        'short_bio',
        'details',
        'photo_path',
        'is_active',
        'is_featured',
        'sort_order',
    ];

    protected $casts = [
        'details' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];
}
