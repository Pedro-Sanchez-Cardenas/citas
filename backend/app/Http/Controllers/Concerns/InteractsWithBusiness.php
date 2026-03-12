<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

trait InteractsWithBusiness
{
    /**
     * Obtener el ID de negocio del usuario autenticado.
     */
    protected function businessId(Request $request): int
    {
        return (int) $request->user()->business_id;
    }

    /**
     * Garantizar que un modelo pertenece al negocio del usuario autenticado.
     *
     * Responde con 404 en caso contrario para no filtrar la existencia de recursos.
     */
    protected function assertModelBelongsToRequestBusiness(
        Model $model,
        Request $request,
        string $businessKey = 'business_id',
    ): void {
        $businessId = $this->businessId($request);

        if ((int) $model->{$businessKey} !== $businessId) {
            abort(404);
        }
    }
}

