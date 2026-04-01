<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Models\WorkingHour;
use App\Repositories\Contracts\BusinessRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class BusinessSetupService
{
    public function __construct(
        protected BusinessRepositoryInterface $businesses
    ) {}

    /**
     * Devuelve el estado de onboarding/configuración inicial del negocio del usuario.
     *
     * @return array{
     *     message: string,
     *     completed: bool,
     *     business?: array<string, mixed>,
     *     steps: array<int, array{
     *         key: string,
     *         label: string,
     *         completed: bool,
     *         count: int
     *     }>
     * }
     */
    public function getSetupStatus(?User $user): array
    {
        $businessId = $user?->business_id ? (int) $user->business_id : null;

        if ($businessId === null) {
            return [
                'message' => 'El usuario aún no tiene un negocio asociado.',
                'completed' => false,
                'steps' => [],
            ];
        }

        $branchesCount = Branch::query()
            ->where('business_id', $businessId)
            ->count();

        $serviceCategoriesCount = ServiceCategory::query()
            ->where('business_id', $businessId)
            ->count();

        $servicesCount = Service::query()
            ->where('business_id', $businessId)
            ->count();

        $professionalsCount = Professional::query()
            ->where('business_id', $businessId)
            ->count();

        $workingHoursCount = WorkingHour::query()
            ->where('business_id', $businessId)
            ->count();

        $productsCount = Product::query()
            ->where('business_id', $businessId)
            ->count();

        $steps = [
            [
                'key' => 'branches',
                'label' => 'Sucursal principal configurada',
                'completed' => $branchesCount > 0,
                'count' => $branchesCount,
            ],
            [
                'key' => 'service_categories',
                'label' => 'Categorías de servicio creadas',
                'completed' => $serviceCategoriesCount > 0,
                'count' => $serviceCategoriesCount,
            ],
            [
                'key' => 'services',
                'label' => 'Servicios configurados',
                'completed' => $servicesCount > 0,
                'count' => $servicesCount,
            ],
            [
                'key' => 'professionals',
                'label' => 'Profesionales dados de alta',
                'completed' => $professionalsCount > 0,
                'count' => $professionalsCount,
            ],
            [
                'key' => 'working_hours',
                'label' => 'Horarios de trabajo configurados',
                'completed' => $workingHoursCount > 0,
                'count' => $workingHoursCount,
            ],
            [
                'key' => 'products',
                'label' => 'Productos dados de alta',
                'completed' => $productsCount > 0,
                'count' => $productsCount,
            ],
        ];

        $completed = collect($steps)->every(fn (array $step) => $step['completed'] === true);
        $business = $this->businesses->findById($businessId);
        $settings = is_array($business?->settings) ? $business->settings : [];
        $branding = is_array($settings['branding'] ?? null) ? $settings['branding'] : [];

        return [
            'message' => 'Estado de configuración del negocio',
            'completed' => $completed,
            'business' => [
                'id' => $business?->id,
                'name' => $business?->name,
                'slug' => $business?->slug,
                'branding' => [
                    'logo_url' => $this->resolveBrandingUrl($branding, 'logo'),
                    'hero_image_url' => $this->resolveBrandingUrl($branding, 'hero_image'),
                    'primary_color' => $branding['primary_color'] ?? null,
                    'public_booking_title' => $branding['public_booking_title'] ?? null,
                    'public_booking_subtitle' => $branding['public_booking_subtitle'] ?? null,
                ],
            ],
            'steps' => $steps,
        ];
    }

    /**
     * Actualiza branding público (portal de reservas) del negocio.
     *
     * @return array{logo_url: string|null, hero_image_url: string|null, primary_color: string|null, public_booking_title: string|null, public_booking_subtitle: string|null}
     */
    public function updateBranding(Business $business, array $validated, ?UploadedFile $logoFile = null, ?UploadedFile $heroImageFile = null): array
    {
        $settings = is_array($business->settings) ? $business->settings : [];
        $branding = is_array($settings['branding'] ?? null) ? $settings['branding'] : [];

        if ($logoFile) {
            $oldPath = $branding['logo_path'] ?? null;
            if (is_string($oldPath) && $oldPath !== '') {
                Storage::disk('public')->delete($oldPath);
            }
            $branding['logo_path'] = $logoFile->store(sprintf('business-branding/%d/logo', $business->id), 'public');
        }

        if ($heroImageFile) {
            $oldPath = $branding['hero_image_path'] ?? null;
            if (is_string($oldPath) && $oldPath !== '') {
                Storage::disk('public')->delete($oldPath);
            }
            $branding['hero_image_path'] = $heroImageFile->store(sprintf('business-branding/%d/hero', $business->id), 'public');
        }

        foreach (['primary_color', 'public_booking_title', 'public_booking_subtitle'] as $field) {
            if (array_key_exists($field, $validated)) {
                $branding[$field] = $validated[$field];
            }
        }

        Arr::set($settings, 'branding', $branding);

        $this->businesses->updateSettings($business, $settings);

        $branding = is_array($settings['branding'] ?? null) ? $settings['branding'] : [];

        return [
            'logo_url' => $this->resolveBrandingUrl($branding, 'logo'),
            'hero_image_url' => $this->resolveBrandingUrl($branding, 'hero_image'),
            'primary_color' => $branding['primary_color'] ?? null,
            'public_booking_title' => $branding['public_booking_title'] ?? null,
            'public_booking_subtitle' => $branding['public_booking_subtitle'] ?? null,
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{logo_url: string|null, hero_image_url: string|null, primary_color: string|null, public_booking_title: string|null, public_booking_subtitle: string|null}
     */
    public function updateBrandingForAuthenticatedUser(
        User $user,
        array $validated,
        ?UploadedFile $logoFile = null,
        ?UploadedFile $heroImageFile = null
    ): array {
        $businessId = $user->business_id ? (int) $user->business_id : null;

        if ($businessId === null) {
            abort(404, 'No se encontró negocio asociado al usuario.');
        }

        $business = $this->businesses->findById($businessId);

        if (! $business) {
            abort(404, 'No se encontró negocio asociado al usuario.');
        }

        return $this->updateBranding($business, $validated, $logoFile, $heroImageFile);
    }

    /**
     * @param  array<string, mixed>  $branding
     */
    protected function resolveBrandingUrl(array $branding, string $prefix): ?string
    {
        $pathKey = $prefix.'_path';
        $urlKey = $prefix.'_url';

        if (! empty($branding[$pathKey]) && is_string($branding[$pathKey])) {
            return Storage::disk('public')->url($branding[$pathKey]);
        }

        return isset($branding[$urlKey]) && is_string($branding[$urlKey]) ? $branding[$urlKey] : null;
    }
}
