<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class DashboardService
{
    /**
     * Datos para el dashboard del usuario autenticado.
     * Por ahora devuelve cards de ejemplo; luego se pueden obtener de DB.
     *
     * @return array{message: string, user: User|null, cards: array<int, array{title: string, value: int}>}
     */
    public function getDashboardData(?User $user): array
    {
        $cards = $this->getDashboardCards();

        return [
            'message' => 'Bienvenido al dashboard',
            'user' => $user,
            'cards' => $cards,
        ];
    }

    /**
     * Cards del dashboard. En el futuro se pueden obtener de repositorios (citas, clientes, etc.).
     *
     * @return array<int, array{title: string, value: int}>
     */
    protected function getDashboardCards(): array
    {
        return [
            ['title' => 'Citas de hoy', 'value' => 5],
            ['title' => 'Pacientes activos', 'value' => 124],
            ['title' => 'Citas canceladas', 'value' => 2],
        ];
    }
}
