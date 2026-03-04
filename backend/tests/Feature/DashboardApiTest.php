<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_401_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(401);
    }

    public function test_dashboard_returns_data_when_authenticated(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'user', 'cards'])
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['cards' => [['title', 'value']]]);
    }
}
