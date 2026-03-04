<?php

use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

Route::get('/', function () {
    return view('welcome');
});

// Sanctum SPA: el frontend debe llamar a esta ruta antes de login para obtener la cookie CSRF
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show'])->name('sanctum.csrf-cookie');
