<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CombinedServiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'combined_service_id',
        'service_id',
        'position',
        'offset_minutes',
    ];

    protected $casts = [
        'position' => 'integer',
        'offset_minutes' => 'integer',
    ];

    public function combinedService(): BelongsTo
    {
        return $this->belongsTo(CombinedService::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}

