<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ventes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('stock_id')->constrained('stock')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->integer('quantite')->nullable();
            $table->decimal('montant', 10, 2)->nullable();
            $table->string('nom_article_snapshot')->nullable();
            $table->string('nom_famille_snapshot')->nullable();
            $table->decimal('prix_vente_snapshot', 10, 2)->nullable();
            $table->decimal('prix_achat_snapshot', 10, 2)->nullable();
            $table->string('nom_fournisseur_snapshot')->nullable();
            $table->string('lot_snapshot')->nullable();
            $table->string('reference_snapshot')->nullable();
            $table->string('conditionnement_snapshot')->nullable();
            $table->string('image_article_snapshot')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ventes');
    }
};
