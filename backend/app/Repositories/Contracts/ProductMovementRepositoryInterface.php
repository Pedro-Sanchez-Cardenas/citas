<?php

namespace App\Repositories\Contracts;

use App\Models\ProductMovement;

interface ProductMovementRepositoryInterface
{
    public function create(ProductMovement $movement): ProductMovement;
}

