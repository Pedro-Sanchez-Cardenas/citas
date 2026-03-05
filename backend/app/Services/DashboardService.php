<?php

namespace App\Services;

use App\Models\User;
use App\Models\Appointment;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

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
        $cards = $user
            ? $this->getBusinessDashboardCards((int) $user->business_id)
            : $this->getDashboardCards();

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

    /**
     * Dashboard real para el dueño: finanzas, operación y personal a alto nivel.
     *
     * @return array<int, array{title: string, value: float|int|string}>
     */
    protected function getBusinessDashboardCards(int $businessId): array
    {
        $today = CarbonImmutable::today();

        $todayAppointments = Appointment::query()
            ->where('business_id', $businessId)
            ->whereDate('start_at', $today->toDateString())
            ->count();

        $cancelledToday = Appointment::query()
            ->where('business_id', $businessId)
            ->whereDate('start_at', $today->toDateString())
            ->where('status', 'cancelled')
            ->count();

        $clientsCount = DB::table('clients')
            ->where('business_id', $businessId)
            ->count();

        $todayRevenueCents = Payment::query()
            ->where('business_id', $businessId)
            ->whereDate('created_at', $today->toDateString())
            ->where('status', 'paid')
            ->sum('amount_cents');

        $avgTicketCents = 0;
        if ($todayAppointments > 0) {
            $avgTicketCents = (int) ($todayRevenueCents / $todayAppointments);
        }

        return [
            ['title' => 'Citas de hoy', 'value' => $todayAppointments],
            ['title' => 'Clientes activos', 'value' => $clientsCount],
            ['title' => 'Citas canceladas hoy', 'value' => $cancelledToday],
            ['title' => 'Ingresos hoy', 'value' => $todayRevenueCents / 100],
            ['title' => 'Ticket promedio hoy', 'value' => $avgTicketCents / 100],
        ];
    }
}
