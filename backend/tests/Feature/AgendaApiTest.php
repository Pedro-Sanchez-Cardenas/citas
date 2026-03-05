<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Professional;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgendaApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_day_view_requires_authentication(): void
    {
        $this->getJson('/api/agenda/day')->assertStatus(401);
    }

    public function test_day_view_returns_appointments_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $branch = Branch::create([
            'name' => 'Sucursal Centro',
            'code' => 'CENTRO',
            'timezone' => 'UTC',
        ]);

        $professional = Professional::create([
            'branch_id' => $branch->id,
            'name' => 'Dr. Demo',
            'email' => 'demo@example.com',
        ]);

        $start = CarbonImmutable::now()->setTime(10, 0);
        $end = $start->addMinutes(30);

        Appointment::create([
            'branch_id' => $branch->id,
            'professional_id' => $professional->id,
            'client_name' => 'Paciente Demo',
            'start_at' => $start,
            'end_at' => $end,
            'status' => 'scheduled',
        ]);

        $response = $this->getJson('/api/agenda/day?date=' . $start->toDateString() . '&branch_id=' . $branch->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'range' => ['start', 'end'],
                'appointments',
                'working_hours',
                'blocks',
            ]);
    }
}

