<?php
namespace App\Http\Controllers;

use App\Models\Fournisseur;
use Illuminate\Http\Request;

class FournisseursController extends Controller
{
    public function index(){ $fournisseurs = Fournisseur::latest()->paginate(25); return view('fournisseurs.index', compact('fournisseurs')); }
    public function create(){ return view('fournisseurs.create'); }
    public function store(Request $request){ Fournisseur::create($request->all()); return redirect()->route('fournisseurs.index'); }
    public function show(Fournisseur $fournisseur){ return view('fournisseurs.show', compact('fournisseur')); }
    public function edit(Fournisseur $fournisseur){ return view('fournisseurs.edit', compact('fournisseur')); }
    public function update(Request $request, Fournisseur $fournisseur){ $fournisseur->update($request->all()); return redirect()->route('fournisseurs.show',$fournisseur); }
    public function destroy(Fournisseur $fournisseur){ $fournisseur->delete(); return redirect()->route('fournisseurs.index'); }

    // API
    public function apiIndex(){ return response()->json(Fournisseur::latest()->paginate(50)); }
}
