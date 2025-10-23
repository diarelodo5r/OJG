<?php
namespace App\Http\Controllers\Exports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CommandesExportController extends Controller
{
    public function export(Request $request)
    {
        // TODO: brancher vers Excel/PDF
        return response()->json(['status' => 'ok']);
    }
}
