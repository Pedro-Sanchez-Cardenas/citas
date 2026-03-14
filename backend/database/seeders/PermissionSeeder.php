<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissionNames = [
            'manage_business_settings',
            'manage_branches',
            'manage_professionals',
            'manage_services',
            'manage_inventory',
            'manage_appointments',
            'manage_clients',
            'view_reports',
        ];

        $permissions = [];
        foreach ($permissionNames as $name) {
            $permissions[] = Permission::findOrCreate($name, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $owner = Role::findOrCreate('business_owner', 'web');
        $manager = Role::findOrCreate('manager', 'web');
        $worker = Role::findOrCreate('worker', 'web');

        $owner->syncPermissions($permissions);

        $managerPerms = collect($permissions)->whereNotIn('name', ['manage_business_settings'])->all();
        $manager->syncPermissions($managerPerms);

        $workerPerms = collect($permissions)->whereIn('name', ['manage_appointments', 'manage_clients'])->all();
        $worker->syncPermissions($workerPerms);
    }
}
