<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth.api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
    });
});
