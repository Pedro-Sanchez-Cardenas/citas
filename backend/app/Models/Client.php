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
        'branch_id',
        'created_by_user_id',
        'name',
        'email',
        'phone',
        'birthday',
        'gender',
        'notes',
        'allergies',
        'photo_path',
        'preferences',
        'last_visit_at',
    ];

    protected $appends = ['photo_url'];

    protected $casts = [
        'birthday' => 'date',
        'preferences' => 'array',
        'last_visit_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
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

    /**
     * Ruta relativa de la foto para que el frontend la una con su API base URL
     * y la imagen se cargue desde el mismo origen que el API.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (empty($this->photo_path)) {
            return null;
        }

        return '/storage/' . ltrim($this->photo_path, '/');
    }
}

