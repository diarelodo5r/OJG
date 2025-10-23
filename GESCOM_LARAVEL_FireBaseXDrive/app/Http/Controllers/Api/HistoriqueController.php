<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Historique;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class HistoriqueController extends Controller
{
    public function index()
    {
        return response()->json(
            Historique::with(['stock','fournisseur','utilisateur','quantiteStandard','prixAchat','prixVente'])
                ->latest()->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'stock_id' => 'nullable|exists:stock,id',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'utilisateur_id' => 'nullable|exists:utilisateurs,id',
            'type_mouvement' => 'required|in:entrée,sortie,retour,ajustement',
            'quantite_standard_id' => 'nullable|exists:historique_quantite_standard,id',
            'prix_achat_id' => 'nullable|exists:historique_prix_achat,id',
            'prix_vente_id' => 'nullable|exists:historique_prix_vente,id',
            'description' => 'nullable|string',
        ]);
        $item = Historique::create($data);
        return response()->json($item, Response::HTTP_CREATED);
    }

    public function show(Historique $historique)
    {
        return response()->json($historique->load(['stock','fournisseur','utilisateur','quantiteStandard','prixAchat','prixVente']));
    }

    public function update(Request $request, Historique $historique)
    {
        $data = $request->validate([
            'stock_id' => 'nullable|exists:stock,id',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
            'utilisateur_id' => 'nullable|exists:utilisateurs,id',
            'type_mouvement' => 'sometimes|in:entrée,sortie,retour,ajustement',
            'quantite_standard_id' => 'nullable|exists:historique_quantite_standard,id',
            'prix_achat_id' => 'nullable|exists:historique_prix_achat,id',
            'prix_vente_id' => 'nullable|exists:historique_prix_vente,id',
            'description' => 'nullable|string',
        ]);
        $historique->update($data);
        return response()->json($historique);
    }

    public function destroy(Historique $historique)
    {
        $historique->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
