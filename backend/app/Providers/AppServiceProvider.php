<?php

namespace App\Providers;

use App\Listeners\StoreStripeInvoiceAsBill;
use App\Models\Business;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use App\Repositories\Contracts\AutomationRepositoryInterface;
use App\Repositories\Contracts\BusinessRepositoryInterface;
use App\Repositories\Contracts\ClientAccountRepositoryInterface;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\ClientMediaRepositoryInterface;
use App\Repositories\Contracts\CombinedServiceRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\ProductMovementRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\ProductStockRepositoryInterface;
use App\Repositories\Contracts\ProfessionalRepositoryInterface;
use App\Repositories\Contracts\BranchRepositoryInterface;
use App\Repositories\Contracts\TimeBlockRepositoryInterface;
use App\Repositories\Contracts\WorkingHourRepositoryInterface;
use App\Repositories\Contracts\ServiceCategoryRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\EloquentAppointmentRepository;
use App\Repositories\EloquentAutomationRepository;
use App\Repositories\EloquentBusinessRepository;
use App\Repositories\EloquentClientAccountRepository;
use App\Repositories\EloquentClientRepository;
use App\Repositories\EloquentClientMediaRepository;
use App\Repositories\EloquentCombinedServiceRepository;
use App\Repositories\EloquentPaymentRepository;
use App\Repositories\EloquentProductMovementRepository;
use App\Repositories\EloquentProductRepository;
use App\Repositories\EloquentProductStockRepository;
use App\Repositories\EloquentProfessionalRepository;
use App\Repositories\EloquentBranchRepository;
use App\Repositories\EloquentTimeBlockRepository;
use App\Repositories\EloquentWorkingHourRepository;
use App\Repositories\EloquentServiceCategoryRepository;
use App\Repositories\EloquentServiceRepository;
use App\Repositories\EloquentUserRepository;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookHandled;

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
        $this->app->bind(BusinessRepositoryInterface::class, EloquentBusinessRepository::class);
        $this->app->bind(ClientAccountRepositoryInterface::class, EloquentClientAccountRepository::class);
        $this->app->bind(ClientMediaRepositoryInterface::class, EloquentClientMediaRepository::class);
        $this->app->bind(PaymentRepositoryInterface::class, EloquentPaymentRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->bind(ProductStockRepositoryInterface::class, EloquentProductStockRepository::class);
        $this->app->bind(ProductMovementRepositoryInterface::class, EloquentProductMovementRepository::class);
        $this->app->bind(AutomationRepositoryInterface::class, EloquentAutomationRepository::class);
        $this->app->bind(WorkingHourRepositoryInterface::class, EloquentWorkingHourRepository::class);
        $this->app->bind(CombinedServiceRepositoryInterface::class, EloquentCombinedServiceRepository::class);
        $this->app->bind(TimeBlockRepositoryInterface::class, EloquentTimeBlockRepository::class);
        $this->app->bind(BranchRepositoryInterface::class, EloquentBranchRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Cashier::useCustomerModel(Business::class);

        Event::listen(WebhookHandled::class, StoreStripeInvoiceAsBill::class);
    }
}
