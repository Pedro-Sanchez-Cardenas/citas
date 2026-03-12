<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected Guard $guard
    ) {}

    /**
     * Intenta autenticar al usuario y regenerar la sesión.
     *
     * @return array{user: array|null, message?: string}
     */
    public function attemptLogin(string $email, string $password, Request $request): array
    {
        $user = $this->userRepository->findByEmail($email);

        if (! $user || ! Hash::check($password, $user->password)) {
            return ['user' => null, 'message' => 'Credenciales inválidas'];
        }

        $this->guard->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return ['user' => $user];
    }

    public function logout(Request $request): void
    {
        $this->guard->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }

    public function currentUser(): ?User
    {
        return $this->guard->user();
    }
}
