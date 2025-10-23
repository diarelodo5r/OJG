<?php

/**
 * ROUTES PUBLIQUES TEMPORAIRES POUR TESTS
 * 
 * ⚠️ À AJOUTER DANS routes/api.php (Laravel Backend)
 * ⚠️ À SUPPRIMER EN PRODUCTION
 * 
 * Ces routes permettent de tester l'application sans authentification
 * pendant que le problème de popup Google OAuth est résolu.
 */

use App\Http\Controllers\Api\DossierController;
use App\Http\Controllers\Api\ContenuController;
use Illuminate\Support\Facades\Route;

// Routes publiques temporaires pour tests (À SUPPRIMER EN PRODUCTION)
Route::prefix('public')->group(function () {
    
    // ==================== DOSSIERS ====================
    
    /**
     * Lister tous les dossiers depuis Firestore
     * GET /api/public/dossiers
     */
    Route::get('/dossiers', [DossierController::class, 'index'])
        ->name('api.public.dossiers.index');
    
    /**
     * Synchroniser les dossiers depuis Firestore
     * POST /api/public/dossiers/sync
     */
    Route::post('/dossiers/sync', [DossierController::class, 'sync'])
        ->name('api.public.dossiers.sync');
    
    /**
     * Récupérer un dossier spécifique par type
     * GET /api/public/dossiers/{type}
     * Paramètres: type = images|videos|audio|documents
     */
    Route::get('/dossiers/{type}', [DossierController::class, 'show'])
        ->name('api.public.dossiers.show');
    
    
    // ==================== CONTENUS ====================
    
    /**
     * Récupérer tous les contenus ou filtrer par type
     * GET /api/public/contenus?type={type}
     * Paramètres optionnels: type = images|videos|audio|documents
     */
    Route::get('/contenus', [ContenuController::class, 'index'])
        ->name('api.public.contenus.index');
    
    /**
     * Récupérer les contenus par type
     * GET /api/public/contenus/type/{type}
     * Paramètres: type = images|videos|audio|documents
     */
    Route::get('/contenus/type/{type}', [ContenuController::class, 'getByType'])
        ->name('api.public.contenus.type');
    
    /**
     * Récupérer un contenu spécifique
     * GET /api/public/contenus/{id}
     */
    Route::get('/contenus/{id}', [ContenuController::class, 'show'])
        ->name('api.public.contenus.show');
    
    /**
     * Synchroniser les contenus d'un type depuis Drive et Firestore
     * POST /api/public/contenus/sync/{type}
     * Paramètres: type = images|videos|audio|documents
     */
    Route::post('/contenus/sync/{type}', [ContenuController::class, 'sync'])
        ->name('api.public.contenus.sync');
});

/**
 * EXEMPLE D'UTILISATION :
 * 
 * 1. Récupérer tous les dossiers :
 *    GET http://localhost:8000/api/public/dossiers
 * 
 * 2. Récupérer le dossier images :
 *    GET http://localhost:8000/api/public/dossiers/images
 * 
 * 3. Récupérer tous les contenus :
 *    GET http://localhost:8000/api/public/contenus
 * 
 * 4. Récupérer uniquement les images :
 *    GET http://localhost:8000/api/public/contenus?type=images
 *    OU
 *    GET http://localhost:8000/api/public/contenus/type/images
 * 
 * 5. Synchroniser les images depuis Drive :
 *    POST http://localhost:8000/api/public/contenus/sync/images
 * 
 * 6. Synchroniser tous les dossiers :
 *    POST http://localhost:8000/api/public/dossiers/sync
 */

/**
 * ROUTES DE PRODUCTION (à restaurer plus tard) :
 * 
 * Route::middleware(['auth:sanctum'])->group(function () {
 *     Route::get('/dossiers', [DossierController::class, 'index']);
 *     Route::post('/dossiers/sync', [DossierController::class, 'sync']);
 *     Route::get('/dossiers/{type}', [DossierController::class, 'show']);
 *     
 *     Route::get('/contenus', [ContenuController::class, 'index']);
 *     Route::get('/contenus/type/{type}', [ContenuController::class, 'getByType']);
 *     Route::get('/contenus/{id}', [ContenuController::class, 'show']);
 *     Route::post('/contenus/sync/{type}', [ContenuController::class, 'sync']);
 * });
 */
