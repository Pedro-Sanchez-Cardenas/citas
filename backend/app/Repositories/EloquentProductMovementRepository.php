<?php

namespace App\Repositories;

use App\Models\ProductMovement;
use App\Repositories\Contracts\ProductMovementRepositoryInterface;

class EloquentProductMovementRepository implements ProductMovementRepositoryInterface
{
    public function create(ProductMovement $movement): ProductMovement
    {
        $movement->save();

        return $movement;
    }
}

