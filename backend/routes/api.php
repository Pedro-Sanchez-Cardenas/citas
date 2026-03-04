<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');
Route::post('/logout', [AuthController::class, 'logout']);

Route::middleware(['auth', 'throttle:60,1'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
