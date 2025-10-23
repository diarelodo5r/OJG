<?php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'ventes_total' => DB::table('ventes')->count(),
            'clients_total' => DB::table('clients')->count(),
            'articles_total' => DB::table('articles')->count(),
        ];
        return view('dashboard.index', compact('stats'));
    }
}
