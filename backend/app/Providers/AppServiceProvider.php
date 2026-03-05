<?php

namespace App\Providers;

use App\Repositories\Contracts\AppointmentRepositoryInterface;
use App\Repositories\Contracts\AutomationRepositoryInterface;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\ProductMovementRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\ProductStockRepositoryInterface;
use App\Repositories\Contracts\ProfessionalRepositoryInterface;
use App\Repositories\Contracts\WorkingHourRepositoryInterface;
use App\Repositories\Contracts\ServiceCategoryRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\EloquentAppointmentRepository;
use App\Repositories\EloquentAutomationRepository;
use App\Repositories\EloquentClientRepository;
use App\Repositories\EloquentPaymentRepository;
use App\Repositories\EloquentProductMovementRepository;
use App\Repositories\EloquentProductRepository;
use App\Repositories\EloquentProductStockRepository;
use App\Repositories\EloquentProfessionalRepository;
use App\Repositories\EloquentWorkingHourRepository;
use App\Repositories\EloquentServiceCategoryRepository;
use App\Repositories\EloquentServiceRepository;
use App\Repositories\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
        $this->app->bind(AppointmentRepositoryInterface::class, EloquentAppointmentRepository::class);
        $this->app->bind(ServiceCategoryRepositoryInterface::class, EloquentServiceCategoryRepository::class);
        $this->app->bind(ServiceRepositoryInterface::class, EloquentServiceRepository::class);
        $this->app->bind(ProfessionalRepositoryInterface::class, EloquentProfessionalRepository::class);
        $this->app->bind(ClientRepositoryInterface::class, EloquentClientRepository::class);
        $this->app->bind(PaymentRepositoryInterface::class, EloquentPaymentRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->bind(ProductStockRepositoryInterface::class, EloquentProductStockRepository::class);
        $this->app->bind(ProductMovementRepositoryInterface::class, EloquentProductMovementRepository::class);
        $this->app->bind(AutomationRepositoryInterface::class, EloquentAutomationRepository::class);
        $this->app->bind(WorkingHourRepositoryInterface::class, EloquentWorkingHourRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
