<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Definir permisos base por funcionalidad del sistema
        $permissions = [
            'manage_business_settings',
            'manage_branches',
            'manage_professionals',
            'manage_services',
            'manage_inventory',
            'manage_appointments',
            'manage_clients',
            'view_reports',
        ];

        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        // Crear roles
        $owner = Role::findOrCreate('business_owner', 'web');
        $manager = Role::findOrCreate('manager', 'web');
        $worker = Role::findOrCreate('worker', 'web');

        // Asignar permisos a cada rol
        $owner->syncPermissions($permissions);

        $manager->syncPermissions([
            'manage_branches',
            'manage_professionals',
            'manage_services',
            'manage_inventory',
            'manage_appointments',
            'manage_clients',
            'view_reports',
        ]);

        $worker->syncPermissions([
            'manage_appointments',
            'manage_clients',
        ]);
    }
}

