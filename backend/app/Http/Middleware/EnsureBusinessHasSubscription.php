<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBusinessHasSubscription
{
    /**
     * Comprueba que el negocio del usuario tenga suscripción activa o en trial.
     * Útil para proteger rutas que requieren plan de pago.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user || ! $user->business_id) {
            return response()->json(['message' => 'Usuario sin negocio asociado'], 403);
        }

        $business = $user->business;
        if ($business->subscribed('default') || $business->onGenericTrial()) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Se requiere una suscripción activa.',
            'requires_subscription' => true,
        ], 402);
    }
}
