<?php
namespace App\Http\Controllers\Exports;

use App\Http\Controllers\Controller;
use App\Models\Vente;
use Illuminate\Http\Request;

class VentesExportController extends Controller
{
    public function export(Request $request)
    {
        // TODO: brancher vers Excel/PDF
        $rows = Vente::latest()->get();
        return response()->json(['status' => 'ok', 'count' => $rows->count()]);
    }
}
