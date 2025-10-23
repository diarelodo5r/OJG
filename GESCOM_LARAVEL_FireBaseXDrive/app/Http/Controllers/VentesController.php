<?php
namespace App\Http\Controllers;

use App\Http\Requests\Ventes\StoreVenteRequest;
use App\Models\{Stock, Vente, Client};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VentesController extends Controller
{
    public function index()
    {
        $ventes = Vente::latest()->paginate(25);
        return view('ventes.index', compact('ventes'));
    }

    public function create()
    {
        $stocks = Stock::with(['article.famille','fournisseur'])->where('quantite','>',0)->latest()->get();
        $clients = Client::orderBy('nom')->get();
        return view('ventes.create', compact('stocks','clients'));
    }

    public function store(StoreVenteRequest $request)
    {
        $payload = $request->validated();
        DB::transaction(function () use ($payload) {
            $client = $this->resolveClient($payload['client']);
            foreach ($payload['sales'] as $sale) {
                $stock = Stock::with(['article.famille','fournisseur'])->lockForUpdate()->findOrFail($sale['id']);
                $qty = (int) $sale['quantity'];
                if ($qty > $stock->quantite) {
                    throw ValidationException::withMessages(['sales' => 'Quantité supérieure au stock disponible.']);
                }
                $montant = $qty * $stock->article->prix_vente;

                Vente::create([
                    'client_id'               => $client->id,
                    'quantite'                => $qty,
                    'montant'                 => $montant,
                    'image_article_snapshot'  => $stock->article->image_path,
                    'lot_snapshot'            => $stock->lot,
                    'reference_snapshot'      => $stock->reference,
                    'nom_article_snapshot'    => $stock->article->nom_article,
                    'nom_famille_snapshot'    => $stock->article->famille->nom_famille,
                    'prix_vente_snapshot'     => $stock->article->prix_vente,
                    'prix_achat_snapshot'     => $stock->fournisseur?->prix_article,
                    'nom_fournisseur_snapshot'=> $stock->fournisseur?->nom,
                ]);

                $stock->decrement('quantite', $qty);
            }
        });
        return redirect()->route('ventes.index')->with('success','Vente enregistrée.');
    }

    private function resolveClient(array $clientInfo): Client
    {
        if (($clientInfo['type'] ?? '') === 'existant' && !empty($clientInfo['id'])) {
            return Client::findOrFail($clientInfo['id']);
        }
        if (($clientInfo['type'] ?? '') === 'nouveau' && !empty($clientInfo['nom'])) {
            return Client::firstOrCreate(['nom' => trim($clientInfo['nom'])]);
        }
        return Client::firstOrCreate(['nom' => 'Client Divers']);
    }

    // API
    public function apiIndex()
    {
        return response()->json(
            Vente::latest()->paginate(50)
        );
    }

    public function apiStore(StoreVenteRequest $request)
    {
        $payload = $request->validated();
        DB::transaction(function () use ($payload) {
            $client = $this->resolveClient($payload['client']);
            foreach ($payload['sales'] as $sale) {
                $stock = Stock::with(['article.famille','fournisseur'])->lockForUpdate()->findOrFail($sale['id']);
                $qty = (int) $sale['quantity'];
                if ($qty > $stock->quantite) {
                    throw ValidationException::withMessages(['sales' => 'Quantité supérieure au stock disponible.']);
                }
                $montant = $qty * $stock->article->prix_vente;

                Vente::create([
                    'client_id'               => $client->id,
                    'quantite'                => $qty,
                    'montant'                 => $montant,
                    'image_article_snapshot'  => $stock->article->image_path,
                    'lot_snapshot'            => $stock->lot,
                    'reference_snapshot'      => $stock->reference,
                    'nom_article_snapshot'    => $stock->article->nom_article,
                    'nom_famille_snapshot'    => $stock->article->famille->nom_famille,
                    'prix_vente_snapshot'     => $stock->article->prix_vente,
                    'prix_achat_snapshot'     => $stock->fournisseur?->prix_article,
                    'nom_fournisseur_snapshot'=> $stock->fournisseur?->nom,
                ]);

                $stock->decrement('quantite', $qty);
            }
        });

        return response()->json(['message' => 'Vente(s) enregistrée(s)'], 201);
    }
}
