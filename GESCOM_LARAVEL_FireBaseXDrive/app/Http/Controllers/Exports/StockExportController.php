<?php
namespace App\Http\Controllers\Exports;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Illuminate\Http\Request;

class StockExportController extends Controller
{
    public function export(Request $request)
    {
        // TODO: brancher vers Excel/PDF
        $rows = Stock::with(['article.famille','fournisseur'])->latest()->get();
        return response()->json(['status' => 'ok', 'count' => $rows->count()]);
    }
}
