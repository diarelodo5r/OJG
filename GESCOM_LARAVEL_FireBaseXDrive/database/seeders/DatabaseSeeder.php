<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Import full SQL dump (place file at database/sql/gestion_stock_dump.sql)
        $this->call([
            ImportSqlSeeder::class,
        ]);
    }
}
