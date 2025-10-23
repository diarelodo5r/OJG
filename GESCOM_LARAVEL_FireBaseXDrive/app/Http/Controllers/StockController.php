<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StoreStockRequest;
use App\Repositories\Contracts\StockRepositoryInterface;
use App\Services\ArchiveService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

class StockController extends Controller
{
    public function __construct(
        private readonly StockRepositoryInterface $stocks,
        private readonly InventoryService $inventory,
        private readonly ArchiveService $archive
    ) {
    }

    public function index(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 50), 1), 100);

        $result = $this->stocks->paginate($limit, $request->query('startAfter'));

        return response()->json([
            'data' => array_map(fn (array $stock) => $this->formatStock($stock), $result['data']),
            'nextPageToken' => $result['nextPageToken'],
        ]);
    }

    public function store(StoreStockRequest $request)
    {
        $data = $request->validated();
        $quantite = (int) $data['quantite'];
        $prixUnitaire = (float) $data['prix_unitaire'];
        $montant = $quantite * $prixUnitaire;

        $payload = [
            'article_id' => $data['article_id'],
            'fournisseur_id' => $data['fournisseur_id'] ?? null,
            'lot' => $data['lot'] ?? null,
            'reference' => $data['reference'] ?? null,
            'quantite' => $quantite,
            'montant' => $montant,
            'etat' => $data['etat'] ?? 100,
            'date_fabrication' => $data['date_fabrication'] ?? null,
            'date_peremption' => $data['date_peremption'] ?? null,
            'description' => $data['description'] ?? null,
        ];

        $result = $this->inventory->entreeStock($payload);

        return response()->json([
            'message' => 'Stock créé avec succès',
            'data' => $this->mapStock($result['id'], $result),
        ], Response::HTTP_CREATED);
    }

    public function show(string $stockId)
    {
        $stock = $this->stocks->find($stockId);
        if ($stock === null) {
            return response()->json(['message' => 'Stock introuvable'], 404);
        }

        return response()->json([
            'data' => $this->formatStock($stock),
        ]);
    }

    public function update(Request $request, string $stockId)
    {
        $existing = $this->stocks->find($stockId);
        if ($existing === null) {
            return response()->json(['message' => 'Stock introuvable'], 404);
        }

        $data = $request->validate([
            'lot' => ['sometimes', 'nullable', 'string', 'max:190'],
            'reference' => ['sometimes', 'nullable', 'string', 'max:190'],
            'quantite' => ['sometimes', 'integer', 'min:0'],
            'etat' => ['sometimes', 'numeric', 'between:0,100'],
            'date_fabrication' => ['sometimes', 'nullable', 'date'],
            'date_peremption' => ['sometimes', 'nullable', 'date'],
            'description' => ['sometimes', 'nullable', 'string'],
            'etat_stock' => ['sometimes', 'string'],
        ]);

        $updates = [];
        foreach (['lot', 'reference', 'etat', 'date_fabrication', 'date_peremption', 'description', 'etat_stock'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }

        if (!empty($updates)) {
            $this->stocks->update($stockId, $updates);
        }

        if (array_key_exists('quantite', $data)) {
            $userId = auth()->id();
            $this->inventory->ajustementStock(
                $stockId,
                (int) $data['quantite'],
                $userId ? (string) $userId : null,
                $request->input('description')
            );
        }

        $updated = $this->stocks->find($stockId);

        return response()->json([
            'message' => 'Stock mis à jour avec succès',
            'data' => $this->formatStock($updated ?? $existing),
        ]);
    }

    public function destroy(Request $request, string $stockId)
    {
        $stock = $this->stocks->find($stockId);
        if ($stock === null) {
            return response()->json(['message' => 'Stock introuvable'], 404);
        }

        $motif = $request->input('motif', 'archivage');
        $options = [
            'quantite' => $stock['quantite'] ?? null,
            'description' => $request->input('description'),
            'utilisateur_id' => auth()->id() ? (string) auth()->id() : null,
            'article_id' => $stock['article_id'] ?? null,
            'fournisseur_id' => $stock['fournisseur_id'] ?? null,
        ];

        $this->archive->archiverStock($stockId, $motif, $options);

        return response()->json([
            'message' => 'Stock archivé avec succès',
            'id' => $stockId,
        ]);
    }

    private function formatStock(array $stock): array
    {
        return [
            'id' => $stock['id'],
            'article_id' => $stock['article_id'] ?? null,
            'fournisseur_id' => $stock['fournisseur_id'] ?? null,
            'lot' => $stock['lot'] ?? null,
            'reference' => $stock['reference'] ?? null,
            'quantite' => isset($stock['quantite']) ? (int) $stock['quantite'] : null,
            'montant' => isset($stock['montant']) ? (float) $stock['montant'] : null,
            'etat' => isset($stock['etat']) ? (int) $stock['etat'] : null,
            'date_fabrication' => $stock['date_fabrication'] ?? null,
            'date_peremption' => $stock['date_peremption'] ?? null,
            'description' => $stock['description'] ?? null,
            'etat_stock' => $stock['etat_stock'] ?? null,
            'created_at' => $stock['created_at'] ?? null,
            'updated_at' => $stock['updated_at'] ?? null,
        ];
    }
}