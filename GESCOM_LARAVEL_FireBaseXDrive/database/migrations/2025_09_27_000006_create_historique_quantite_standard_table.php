<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('historique_quantite_standard', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->integer('valeur');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_quantite_standard');
    }
};
