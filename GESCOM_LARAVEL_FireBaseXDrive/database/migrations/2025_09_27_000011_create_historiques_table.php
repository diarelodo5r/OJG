<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('historiques', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('stock_id')->nullable()->constrained('stock')->cascadeOnDelete();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->foreignId('utilisateur_id')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->enum('type_mouvement', ['entrée','sortie','retour','ajustement']);
            $table->foreignId('quantite_standard_id')->nullable()->constrained('historique_quantite_standard')->nullOnDelete();
            $table->foreignId('prix_achat_id')->nullable()->constrained('historique_prix_achat')->nullOnDelete();
            $table->foreignId('prix_vente_id')->nullable()->constrained('historique_prix_vente')->nullOnDelete();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historiques');
    }
};
