<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Cashier\Billable;

class Business extends Model
{
    use Billable, HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'owner_name',
        'owner_email',
        'phone',
        'industry',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
        'trial_ends_at' => 'datetime',
    ];

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Email usado por Cashier para el cliente en Stripe (owner_email).
     */
    public function stripeEmail(): ?string
    {
        return $this->owner_email;
    }
}

