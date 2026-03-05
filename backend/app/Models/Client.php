<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'default_branch_id',
        'name',
        'email',
        'phone',
        'birthday',
        'gender',
        'preferred_stylist',
        'notes',
        'allergies',
        'preferences',
        'last_visit_at',
    ];

    protected $casts = [
        'birthday' => 'date',
        'preferences' => 'array',
        'last_visit_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function defaultBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'default_branch_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(ClientMedia::class);
    }
}

