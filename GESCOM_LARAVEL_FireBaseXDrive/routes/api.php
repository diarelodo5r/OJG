<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{StockController, VentesController, ArticlesController, ClientsController, FournisseursController};
use App\Http\Controllers\Api\{AuthController, FamilleController as ApiFamilleController, ArticleController as ApiArticleController, ClientController as ApiClientController, FournisseurController as ApiFournisseurController, StockController as ApiStockController, VenteController as ApiVenteController, HistoriqueController as ApiHistoriqueController, ArchiveController as ApiArchiveController, UtilisateurController as ApiUtilisateurController, PhotoController, CompanySettingController, DossierController, ContenuController};

// Public auth endpoints
Route::post('/auth/register', [AuthController::class, 'register'])->name('api.auth.register');
Route::post('/auth/login', [AuthController::class, 'login'])->name('api.auth.login');

// Routes publiques temporaires pour tests (À SUPPRIMER EN PRODUCTION)
Route::prefix('public')->group(function () {
    Route::get('/dossiers', [DossierController::class, 'index'])->name('api.public.dossiers.index');
    Route::post('/dossiers/sync', [DossierController::class, 'sync'])->name('api.public.dossiers.sync');
    Route::get('/dossiers/{type}', [DossierController::class, 'show'])->name('api.public.dossiers.show');

    Route::get('/contenus', [ContenuController::class, 'index'])->name('api.public.contenus.index');
    Route::get('/contenus/type/{type}', [ContenuController::class, 'getByType'])->name('api.public.contenus.by-type');
    Route::get('/contenus/{id}', [ContenuController::class, 'show'])->name('api.public.contenus.show');
    Route::post('/contenus/sync/{type}', [ContenuController::class, 'sync'])->name('api.public.contenus.sync');

    Route::get('/config', [\App\Http\Controllers\Api\ConfigController::class, 'show'])->name('api.public.config.show');
});

Route::middleware('firebase')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.auth.logout');

    // Upload temporaire de fichiers (étape 1)
    Route::post('/upload/temp/article', [ApiArticleController::class, 'uploadTempFile'])->name('api.upload.temp.article');
    Route::post('/upload/temp/utilisateur', [ApiUtilisateurController::class, 'uploadTempFile'])->name('api.upload.temp.utilisateur');

    // Gestion des photos d'articles
    Route::prefix('articles/{article}')->group(function () {
        Route::post('/photo', [ApiArticleController::class, 'uploadPhoto'])->name('api.articles.photo.upload');
        Route::get('/photo', [ApiArticleController::class, 'getPhoto'])->name('api.articles.photo');
        Route::delete('/photo', [ApiArticleController::class, 'deletePhoto'])->name('api.articles.photo.delete');
    });

    // Gestion des photos de profils utilisateurs
    Route::prefix('utilisateurs/{utilisateur}')->group(function () {
        Route::post('/photo', [ApiUtilisateurController::class, 'uploadPhoto'])->name('api.utilisateurs.photo.upload');
        Route::get('/photo', [ApiUtilisateurController::class, 'getPhoto'])->name('api.utilisateurs.photo');
        Route::delete('/photo', [ApiUtilisateurController::class, 'deletePhoto'])->name('api.utilisateurs.photo.delete');
    });

    // Route spéciale pour ventes en lot avec déstockage automatique
    Route::post('/ventes/batch', [ApiVenteController::class, 'storeBatch'])->name('api.ventes.batch');

    // Route spéciale pour réinitialiser les paramètres entreprise
    Route::post('/company-settings/reset', [CompanySettingController::class, 'reset'])->name('api.company-settings.reset');

    // ========== Routes pour la gestion des contenus Drive/Firestore ==========
    
    // Initialiser et synchroniser les dossiers
    Route::post('/dossiers/sync', [DossierController::class, 'sync'])->name('api.dossiers.sync');
    
    // Récupérer les fichiers d'un dossier depuis Drive
    Route::get('/dossiers/{type}/files', [DossierController::class, 'getFiles'])->name('api.dossiers.files');
    
    // Gestion des contenus
    Route::get('/contenus/type/{type}', [ContenuController::class, 'getByType'])->name('api.contenus.by-type');
    Route::post('/contenus/upload', [ContenuController::class, 'upload'])->name('api.contenus.upload');
    Route::post('/contenus/sync/{type}', [ContenuController::class, 'sync'])->name('api.contenus.sync');

    // API Resources - Gèrent automatiquement toutes les routes CRUD
    Route::apiResources([
        'familles' => ApiFamilleController::class,
        'articles' => ApiArticleController::class,
        'clients' => ApiClientController::class,
        'fournisseurs' => ApiFournisseurController::class,
        'stocks' => ApiStockController::class,
        'ventes' => ApiVenteController::class,
        'historiques' => ApiHistoriqueController::class,
        'archives' => ApiArchiveController::class,
        'utilisateurs' => ApiUtilisateurController::class,
        'company-settings' => CompanySettingController::class,
        'dossiers' => DossierController::class,
        'contenus' => ContenuController::class,
    ]);
});
