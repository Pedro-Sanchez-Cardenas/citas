<?php

namespace App\Services;

use App\Models\Branch;
use App\Repositories\Contracts\BranchRepositoryInterface;
use Illuminate\Support\Collection;

class BranchService
{
    public function __construct(
        protected BranchRepositoryInterface $branches
    ) {
    }

    /**
     * @return Collection<int, Branch>
     */
    public function listForBusiness(int $businessId): Collection
    {
        return $this->branches->listForBusiness($businessId);
    }
}

