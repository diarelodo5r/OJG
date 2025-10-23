<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nom');
            $table->string('mot_de_passe');
            $table->string('role', 50)->nullable();
            $table->string('email', 120)->nullable();
            $table->text('description')->nullable();
            $table->string('adresse', 255)->nullable();
            $table->string('sexe', 20)->nullable();
            $table->string('telephone', 30)->nullable();
            $table->string('photo', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};
