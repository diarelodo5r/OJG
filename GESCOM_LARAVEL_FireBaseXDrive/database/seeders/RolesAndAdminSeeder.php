<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RolesAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $suser = Role::firstOrCreate(['name' => 's_user']);

        $user = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => bcrypt('password')]
        );
        $user->assignRole('admin');
    }
}
