<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Professional extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'branch_id',
        'name',
        'email',
        'phone',
        'color',
        'commission_rate',
        'base_salary_cents',
        'is_active',
        'photo_path',
    ];

    protected $appends = ['photo_url'];

    protected $casts = [
        'commission_rate' => 'float',
        'base_salary_cents' => 'integer',
        'is_active' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class)
            ->withTimestamps();
    }

    public function workingHours(): HasMany
    {
        return $this->hasMany(WorkingHour::class);
    }

    public function timeBlocks(): HasMany
    {
        return $this->hasMany(TimeBlock::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'professional_id');
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (empty($this->photo_path)) {
            return null;
        }

        return '/storage/' . ltrim($this->photo_path, '/');
    }
}

