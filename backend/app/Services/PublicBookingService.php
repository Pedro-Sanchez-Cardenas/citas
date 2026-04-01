<?php

namespace App\Services;

use App\Repositories\Contracts\BranchRepositoryInterface;
use App\Repositories\Contracts\BusinessRepositoryInterface;
use App\Repositories\Contracts\ProfessionalRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class PublicBookingService
{
    public function __construct(
        protected BusinessRepositoryInterface $businesses,
        protected BranchRepositoryInterface $branches,
        protected ProfessionalRepositoryInterface $professionals,
        protected CalendarService $calendarService
    ) {}

    public function getCatalog(string $businessSlug): array
    {
        $business = $this->businesses->findBySlugOrFail($businessSlug)->loadMissing('branding');
        $branches = $this->branches->getBranchesWithActiveServices($business->id);
        $branding = $business->branding;

        return [
            'business' => [
                'id' => $business->id,
                'name' => $business->name,
                'slug' => $business->slug,
                'branding' => [
                    'logo_url' => $branding?->logo_path ? Storage::disk('public')->url($branding->logo_path) : null,
                    'hero_image_url' => $branding?->hero_image_path ? Storage::disk('public')->url($branding->hero_image_path) : null,
                    'primary_color' => $branding?->primary_color,
                    'public_booking_title' => $branding?->public_booking_title,
                    'public_booking_subtitle' => $branding?->public_booking_subtitle,
                ],
            ],
            'branches' => $branches,
        ];
    }

    public function getProfessionals(string $businessSlug): Collection
    {
        $business = $this->businesses->findBySlugOrFail($businessSlug);

        return $this->professionals->listActiveForPublicBooking($business->id);
    }

    public function getAvailability(string $businessSlug, Request $request): array
    {
        $business = $this->businesses->findBySlugOrFail($businessSlug);

        $date = $request->query('date')
            ? new CarbonImmutable($request->query('date'))
            : CarbonImmutable::now();

        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $professionalId = $request->query('professional_id') ? (int) $request->query('professional_id') : null;

        if ($branchId && ! $this->branches->existsForBusiness($branchId, $business->id)) {
            abort(404);
        }

        if ($professionalId && ! $this->professionals->findForBusiness($business->id, $professionalId)) {
            abort(404);
        }

        $calendar = $this->calendarService->getDayView($business->id, $date, $branchId, $professionalId);

        return [
            'business' => $business,
            'calendar' => $calendar,
        ];
    }
}
