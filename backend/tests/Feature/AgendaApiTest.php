<?php

namespace Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Feature\Support\CreatesTenantData;

class AgendaApiTest extends TestCase
{
    use RefreshDatabase;
    use CreatesTenantData;

    public function test_day_view_requires_authentication(): void
    {
        $this->getJson('/api/agenda/day')->assertStatus(401);
    }

    public function test_day_view_returns_appointments_for_authenticated_user(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $professional = $this->createProfessional($business, $branch);

        $start = CarbonImmutable::now()->addDay()->setTime(10, 0);
        $end = $start->addMinutes(30);
        $this->createWorkingHour($business, $branch, $professional, $start);
        $this->createAppointment($business, $branch, $professional, null, null, $start, $end);

        $response = $this->getJson('/api/agenda/day?date=' . $start->toDateString() . '&branch_id=' . $branch->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'range' => ['start', 'end'],
                'appointments',
                'working_hours',
                'blocks',
            ]);
    }

    public function test_week_view_returns_ok_with_authentication(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $professional = $this->createProfessional($business, $branch);
        $start = CarbonImmutable::now()->addDay()->setTime(9, 0);
        $this->createWorkingHour($business, $branch, $professional, $start);
        $this->createAppointment($business, $branch, $professional, null, null, $start, $start->addMinutes(30));

        $this->getJson('/api/agenda/week?start=' . $start->startOfWeek()->toDateString())
            ->assertStatus(200)
            ->assertJsonStructure(['range', 'appointments', 'working_hours', 'blocks']);
    }
}

