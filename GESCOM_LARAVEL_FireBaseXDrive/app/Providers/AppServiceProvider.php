<?php

namespace App\Providers;

use App\Repositories\Contracts\ArchiveRepositoryInterface;
use App\Repositories\Contracts\ArticleRepositoryInterface;
use App\Repositories\Contracts\StockRepositoryInterface;
use App\Repositories\Contracts\UtilisateurRepositoryInterface;
use App\Repositories\Contracts\VenteRepositoryInterface;
use App\Repositories\Firestore\ArchiveRepository;
use App\Repositories\Firestore\ArticleRepository;
use App\Repositories\Firestore\StockRepository;
use App\Repositories\Firestore\UtilisateurRepository;
use App\Repositories\Firestore\VenteRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UtilisateurRepositoryInterface::class, UtilisateurRepository::class);
        $this->app->bind(ArticleRepositoryInterface::class, ArticleRepository::class);
        $this->app->bind(StockRepositoryInterface::class, StockRepository::class);
        $this->app->bind(VenteRepositoryInterface::class, VenteRepository::class);
        $this->app->bind(ArchiveRepositoryInterface::class, ArchiveRepository::class);
    }

    public function boot(): void
    {
    }
}
