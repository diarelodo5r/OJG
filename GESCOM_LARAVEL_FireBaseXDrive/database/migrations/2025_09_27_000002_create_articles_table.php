<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('famille_id')->constrained('familles')->cascadeOnDelete();
            $table->string('nom_article');
            $table->string('image_article')->nullable();
            $table->decimal('prixVente', 10, 2)->nullable();
            $table->integer('quantite_standard')->default(0);
            $table->string('Conditionnement', 30)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // CHECK(quantite_standard >= 0)
        DB::statement('ALTER TABLE articles ADD CONSTRAINT chk_articles_quantite_standard CHECK (quantite_standard >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
