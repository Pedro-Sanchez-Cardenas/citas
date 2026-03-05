<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ProfessionalController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\AutomationController;
use App\Http\Controllers\PublicBookingController;
use App\Http\Controllers\WorkingHourController;
use App\Http\Controllers\CombinedServiceController;
use App\Http\Controllers\ServiceProfessionalController;
use App\Http\Controllers\ServiceMaterialController;
use App\Http\Controllers\ClientMediaController;
use App\Http\Controllers\TimeBlockController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\BusinessSetupController;

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');
Route::post('/logout', [AuthController::class, 'logout']);

// Rutas públicas para reservas online (por negocio)
Route::prefix('public/{business}')->group(function () {
    Route::get('/services', [PublicBookingController::class, 'services']);
    Route::get('/availability', [PublicBookingController::class, 'availability']);
    Route::post('/book', [PublicBookingController::class, 'book']);
});

Route::middleware(['auth', 'throttle:60,1'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/business-setup', [BusinessSetupController::class, 'show']);

    Route::prefix('agenda')->group(function () {
        Route::get('/day', [AgendaController::class, 'day']);
        Route::get('/week', [AgendaController::class, 'week']);
    });

    Route::apiResource('appointments', AppointmentController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::patch('appointments/{appointment}/move', [AppointmentController::class, 'move']);

    Route::apiResource('service-categories', ServiceCategoryController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('services', ServiceController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('professionals', ProfessionalController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('clients', ClientController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show']);
    Route::apiResource('products', ProductController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::get('/inventory/stocks', [InventoryController::class, 'stocks']);
    Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
    Route::apiResource('automations', AutomationController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('working-hours', WorkingHourController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('combined-services', CombinedServiceController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('blocks', TimeBlockController::class)->only(['index', 'store', 'show', 'destroy']);

    Route::get('services/{service}/professionals', [ServiceProfessionalController::class, 'index']);
    Route::put('services/{service}/professionals', [ServiceProfessionalController::class, 'sync']);
    Route::get('services/{service}/materials', [ServiceMaterialController::class, 'index']);
    Route::put('services/{service}/materials', [ServiceMaterialController::class, 'sync']);

    Route::get('clients/{client}/media', [ClientMediaController::class, 'index']);
    Route::post('clients/{client}/media', [ClientMediaController::class, 'store']);
    Route::delete('client-media/{media}', [ClientMediaController::class, 'destroy']);
    Route::get('clients/{client}/history', [ClientController::class, 'history']);

    Route::get('reports/business-summary', [ReportController::class, 'businessSummary']);
    Route::get('reports/professionals', [ReportController::class, 'professionals']);
    Route::get('reports/services', [ReportController::class, 'services']);
});
