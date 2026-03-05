<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'branch_id',
        'professional_id',
        'service_id',
        'combined_service_id',
        'client_id',
        'client_name',
        'client_phone',
        'client_email',
        'start_at',
        'end_at',
        'status',
        'source',
        'deposit_amount_cents',
        'deposit_status',
        'overbooking_allowed',
        'buffer_before_minutes',
        'buffer_after_minutes',
        'notes',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'deposit_amount_cents' => 'integer',
        'overbooking_allowed' => 'boolean',
        'buffer_before_minutes' => 'integer',
        'buffer_after_minutes' => 'integer',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function combinedService(): BelongsTo
    {
        return $this->belongsTo(CombinedService::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}

