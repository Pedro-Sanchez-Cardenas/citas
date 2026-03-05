<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Login por sesión (cookie). SPA con Sanctum.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $result = $this->authService->attemptLogin(
            $validated['email'],
            $validated['password'],
            $request
        );

        if ($result['user'] === null) {
            return response()->json([
                'message' => $result['message'] ?? 'Credenciales inválidas',
            ], 401);
        }

        return response()->json([
            'user' => new UserResource($result['user']),
        ]);
    }

    /**
     * Cerrar sesión e invalidar la cookie de sesión.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request);

        return response()->json(['message' => 'Sesión cerrada']);
    }

    /**
     * Usuario autenticado actual (para SPA).
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->authService->currentUser();

        return response()->json([
            'user' => $user ? new UserResource($user) : null,
        ]);
    }

    /**
     * Actualizar perfil del usuario (nombre, email, contraseña).
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if (! empty($data['name'])) {
            $user->name = $data['name'];
        }
        if (array_key_exists('email', $data) && $data['email'] !== null) {
            $user->email = $data['email'];
        }
        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        return response()->json([
            'user' => new UserResource($user->fresh()),
        ]);
    }
}
