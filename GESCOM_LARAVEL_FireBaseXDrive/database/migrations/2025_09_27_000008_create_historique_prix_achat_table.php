<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('historique_prix_achat', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('fournisseur_id')->constrained('fournisseurs')->cascadeOnDelete();
            $table->decimal('valeur', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_prix_achat');
    }
};
