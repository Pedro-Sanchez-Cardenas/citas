<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessBranding extends Model
{
    protected $fillable = [
        'business_id',
        'logo_path',
        'hero_image_path',
        'primary_color',
        'public_booking_title',
        'public_booking_subtitle',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
