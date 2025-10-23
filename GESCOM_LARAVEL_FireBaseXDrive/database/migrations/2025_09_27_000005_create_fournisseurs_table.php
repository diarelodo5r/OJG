<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->decimal('prixArticle', 10, 2);
            $table->string('nom', 60);
            $table->string('telephone', 30)->nullable();
            $table->string('adresse', 50)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};
