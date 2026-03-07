<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Http\Requests\SetExtraUsersRequest;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {}

    /**
     * Listar planes y addons disponibles (público o autenticado).
     */
    public function plans(Request $request): JsonResponse
    {
        return response()->json([
            'plans' => $this->subscriptionService->getPlans(),
            'addons' => $this->subscriptionService->getAddons(),
        ]);
    }

    /**
     * Estado de suscripción del negocio del usuario actual.
     */
    public function status(Request $request): JsonResponse
    {
        $business = $request->user()?->business;
        if (! $business) {
            return response()->json(['message' => 'Usuario sin negocio asociado'], 403);
        }

        return response()->json($this->subscriptionService->getStatus($business));
    }

    /**
     * Crear sesión de Stripe Checkout; redirige al usuario a Stripe.
     */
    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $business = $request->user()->business;
        $validated = $request->validated();

        try {
            $url = $this->subscriptionService->createCheckoutSession(
                $business,
                $validated['plan'],
                $validated['success_url'],
                $validated['cancel_url'],
                $validated['addons'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['checkout_url' => $url]);
    }

    /**
     * Crear sesión del portal de facturación de Stripe (gestionar método de pago, facturas, cancelar).
     */
    public function billingPortal(Request $request): JsonResponse
    {
        $request->validate(['return_url' => 'required|string|url']);
        $business = $request->user()?->business;
        if (! $business) {
            return response()->json(['message' => 'Usuario sin negocio asociado'], 403);
        }

        if (! $business->hasStripeId()) {
            return response()->json(['message' => 'Sin suscripción activa'], 422);
        }

        $url = $this->subscriptionService->createBillingPortalSession(
            $business,
            $request->input('return_url')
        );

        return response()->json(['portal_url' => $url]);
    }

    /**
     * Añadir addon a la suscripción actual.
     */
    public function addAddon(Request $request, string $addonSlug): JsonResponse
    {
        $business = $request->user()?->business;
        if (! $business) {
            return response()->json(['message' => 'Usuario sin negocio asociado'], 403);
        }

        try {
            $this->subscriptionService->addAddon($business, $addonSlug);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Addon añadido',
            'status' => $this->subscriptionService->getStatus($business),
        ]);
    }

    /**
     * Quitar addon de la suscripción.
     */
    public function removeAddon(Request $request, string $addonSlug): JsonResponse
    {
        $business = $request->user()?->business;
        if (! $business) {
            return response()->json(['message' => 'Usuario sin negocio asociado'], 403);
        }

        try {
            $this->subscriptionService->removeAddon($business, $addonSlug);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Addon eliminado',
            'status' => $this->subscriptionService->getStatus($business),
        ]);
    }

    /**
     * Establecer cantidad de usuarios extra (slots adicionales).
     */
    public function setExtraUsers(SetExtraUsersRequest $request): JsonResponse
    {
        $business = $request->user()?->business;
        if (! $business) {
            return response()->json(['message' => 'Usuario sin negocio asociado'], 403);
        }

        try {
            $this->subscriptionService->setExtraUsers($business, (int) $request->input('quantity'));
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Cantidad de usuarios extra actualizada',
            'status' => $this->subscriptionService->getStatus($business),
        ]);
    }
}
