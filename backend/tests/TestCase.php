<?php

namespace Tests;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Spatie roles/permissions (p. ej. business_owner) — los tests usan RefreshDatabase sin DatabaseSeeder.
        $this->seed(PermissionSeeder::class);
    }
}
