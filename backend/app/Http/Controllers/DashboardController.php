<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        return response()->json([
            'message' => 'Bienvenido al dashboard',
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
            'cards' => [
                ['title' => 'Citas de hoy', 'value' => 5],
                ['title' => 'Pacientes activos', 'value' => 124],
                ['title' => 'Citas canceladas', 'value' => 2],
            ],
        ]);
    }
}

