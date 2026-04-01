<?php

namespace Tests\Feature\Support;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Client;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Models\WorkingHour;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;

trait CreatesTenantData
{
    protected function createBusiness(array $overrides = []): Business
    {
        $suffix = Str::lower(Str::random(6));

        return Business::create(array_merge([
            'name' => 'Negocio '.$suffix,
            'slug' => 'negocio-'.$suffix,
            'owner_name' => 'Owner '.$suffix,
            'owner_email' => $suffix.'@example.com',
            'industry' => 'beauty',
            'auto_confirm_appointments' => true,
            'max_overbooking_per_slot' => 1,
        ], $overrides));
    }

    protected function createUserForBusiness(Business $business, array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'business_id' => $business->id,
        ], $overrides));

        // Para endpoints protegidos por permisos/roles en tests.
        if (! $user->hasAnyRole(['business_owner', 'manager', 'worker'])) {
            $user->assignRole('business_owner');
        }

        return $user;
    }

    protected function createBranch(Business $business, array $overrides = []): Branch
    {
        $suffix = Str::upper(Str::random(6));

        return Branch::create(array_merge([
            'business_id' => $business->id,
            'name' => 'Sucursal '.$suffix,
            'code' => 'BR-'.$suffix,
            'timezone' => 'UTC',
        ], $overrides));
    }

    protected function createServiceCategory(Business $business, ?Branch $branch = null, array $overrides = []): ServiceCategory
    {
        return ServiceCategory::create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch?->id,
            'name' => 'Categoria '.Str::random(4),
            'position' => 1,
            'is_active' => true,
        ], $overrides));
    }

    protected function createService(Business $business, ?Branch $branch = null, ?ServiceCategory $category = null, array $overrides = []): Service
    {
        $suffix = Str::upper(Str::random(6));

        return Service::create(array_merge([
            'business_id' => $business->id,
            'service_category_id' => $category?->id,
            'branch_id' => $branch?->id,
            'name' => 'Servicio '.$suffix,
            'code' => 'SVC-'.$suffix,
            'duration_minutes' => 30,
            'price_cents' => 1000,
            'currency' => 'USD',
            'is_active' => true,
        ], $overrides));
    }

    protected function createProfessional(Business $business, Branch $branch, array $overrides = []): Professional
    {
        return Professional::create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'name' => 'Profesional '.Str::random(4),
            'email' => Str::random(8).'@example.com',
            'is_active' => true,
        ], $overrides));
    }

    protected function createClient(Business $business, ?Branch $branch = null, array $overrides = []): Client
    {
        return Client::create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch?->id,
            'name' => 'Cliente '.Str::random(4),
            'email' => Str::random(8).'@example.com',
        ], $overrides));
    }

    protected function createWorkingHour(Business $business, Branch $branch, ?Professional $professional, CarbonImmutable $date): WorkingHour
    {
        $weekday = $date->dayOfWeekIso % 7;

        return WorkingHour::create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'professional_id' => $professional?->id,
            'weekday' => $weekday,
            'start_time' => '00:00',
            'end_time' => '23:59',
            'is_active' => true,
        ]);
    }

    protected function createAppointment(
        Business $business,
        Branch $branch,
        Professional $professional,
        ?Service $service = null,
        ?Client $client = null,
        ?CarbonImmutable $start = null,
        ?CarbonImmutable $end = null,
        array $overrides = []
    ): Appointment {
        $start ??= CarbonImmutable::now()->addDay()->setTime(10, 0);
        $end ??= $start->addMinutes(30);

        return Appointment::create(array_merge([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'professional_id' => $professional->id,
            'service_id' => $service?->id,
            'client_id' => $client?->id,
            'start_at' => $start,
            'end_at' => $end,
            'status' => 'scheduled',
        ], $overrides));
    }

    /**
     * @return array{business: Business, user: User, branch: Branch}
     */
    protected function authenticatedTenant(): array
    {
        $business = $this->createBusiness();
        $user = $this->createUserForBusiness($business);
        $branch = $this->createBranch($business);
        $this->actingAs($user);

        return compact('business', 'user', 'branch');
    }
}
