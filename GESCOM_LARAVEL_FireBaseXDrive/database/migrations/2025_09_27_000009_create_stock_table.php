<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->string('lot', 40)->nullable();
            $table->string('reference', 40)->nullable();
            $table->integer('quantite')->nullable();
            $table->decimal('montant', 10, 2)->nullable();
            $table->date('date_fabrication')->nullable();
            $table->date('date_peremption')->nullable();
            $table->decimal('etat', 5, 2)->nullable();
            $table->text('description')->nullable();
            $table->enum('etat_stock', ['actif','vendu','périmé','archivé'])->default('actif');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock');
    }
};
