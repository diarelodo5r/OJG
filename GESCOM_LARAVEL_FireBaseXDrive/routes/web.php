<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

use App\Http\Controllers\{
    DashboardController, StockController, VentesController,
    ArticlesController, FournisseursController, ClientsController
};
use App\Http\Controllers\Exports\{
    StockExportController, VentesExportController, CommandesExportController
};

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('role:admin')->name('dashboard');

    // Stock
    Route::get('/stock', [StockController::class, 'index'])->name('stock.index');
    Route::get('/stock/create', [StockController::class, 'create'])->name('stock.create');
    Route::post('/stock', [StockController::class, 'store'])->name('stock.store');
    Route::get('/stock/{stock}', [StockController::class, 'show'])->name('stock.show');
    Route::post('/stock/export', [StockExportController::class, 'export'])->name('stock.export');

    // Ventes
    Route::get('/ventes', [VentesController::class, 'index'])->name('ventes.index');
    Route::get('/ventes/create', [VentesController::class, 'create'])->name('ventes.create');
    Route::post('/ventes', [VentesController::class, 'store'])->name('ventes.store');
    Route::post('/ventes/export', [VentesExportController::class, 'export'])->name('ventes.export');

    // Commandes (controllers not available yet) — routes disabled to avoid errors
    // Route::get('/commandes', [CommandesController::class, 'index'])->name('commandes.index');
    // Route::post('/commandes/export', [CommandesExportController::class, 'export'])->name('commandes.export');

    // Référentiels
    Route::resource('/articles', ArticlesController::class);
    Route::resource('/fournisseurs', FournisseursController::class);
    Route::resource('/clients', ClientsController::class);
});

