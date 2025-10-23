<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StoreStockRequest;
use App\Services\ArchiveService;
use App\Services\Firebase\FirestoreService;
use App\Services\InventoryService;
use Google\Cloud\Core\Timestamp;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

class StockController extends Controller
{
    public function __construct(
        private readonly FirestoreService $firestore,
        private readonly InventoryService $inventory,
        private readonly ArchiveService $archive
    ) {
    }

    public function index(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 50), 1), 100);

        $query = $this->firestore
            ->collection('stocks')
            ->orderBy('created_at', 'DESC')
            ->limit($limit);

        if ($request->filled('startAfter')) {
            $start = $this->firestore->document('stocks', $request->query('startAfter'))->snapshot();
            if ($start->exists()) {
                $query = $query->startAfter($start);
            }
        }

        $documents = $query->documents();
        $items = [];
        $last = null;

        foreach ($documents as $document) {
            if (!$document->exists()) {
                continue;
            }
            $items[] = $this->mapStock($document->id(), $document->data());
            $last = $document;
        }

        return response()->json([
            'data' => $items,
            'nextPageToken' => $last?->id(),
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
        $snapshot = $this->firestore->document('stocks', $stockId)->snapshot();
        if (!$snapshot->exists()) {
            return response()->json(['message' => 'Stock introuvable'], 404);
        }

        return response()->json([
            'data' => $this->mapStock($snapshot->id(), $snapshot->data()),
        ]);
    }

    public function update(Request $request, string $stockId)
    {
        $document = $this->firestore->document('stocks', $stockId);
        $snapshot = $document->snapshot();

        if (!$snapshot->exists()) {
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

        if (array_key_exists('quantite', $data)) {
            $userId = auth()->id();
            $this->inventory->ajustementStock(
                $stockId,
                (int) $data['quantite'],
                $userId ? (string) $userId : null,
                $request->input('description')
            );
            $updates['quantite'] = (int) $data['quantite'];
        }

        if (!empty($updates)) {
            $updates['updated_at'] = Carbon::now();
            $document->update($updates);
        }

        $updated = $document->snapshot();

        return response()->json([
            'message' => 'Stock mis à jour avec succès',
            'data' => $this->mapStock($updated->id(), $updated->data()),
        ]);
    }

    public function destroy(Request $request, string $stockId)
    {
        $snapshot = $this->firestore->document('stocks', $stockId)->snapshot();
        if (!$snapshot->exists()) {
            return response()->json(['message' => 'Stock introuvable'], 404);
        }

        $motif = $request->input('motif', 'archivage');
        $options = [
            'quantite' => $snapshot->get('quantite'),
            'description' => $request->input('description'),
            'utilisateur_id' => auth()->id() ? (string) auth()->id() : null,
        ];

        $this->archive->archiverStock($stockId, $motif, $options);

        return response()->json([
            'message' => 'Stock archivé avec succès',
            'id' => $stockId,
        ]);
    }

    private function mapStock(string $id, array $data): array
    {
        return [
            'id' => $id,
            'article_id' => $data['article_id'] ?? null,
            'fournisseur_id' => $data['fournisseur_id'] ?? null,
            'lot' => $data['lot'] ?? null,
            'reference' => $data['reference'] ?? null,
            'quantite' => isset($data['quantite']) ? (int) $data['quantite'] : null,
            'montant' => isset($data['montant']) ? (float) $data['montant'] : null,
            'etat' => isset($data['etat']) ? (int) $data['etat'] : null,
            'date_fabrication' => $this->castTimestamp($data['date_fabrication'] ?? null),
            'date_peremption' => $this->castTimestamp($data['date_peremption'] ?? null),
            'description' => $data['description'] ?? null,
            'etat_stock' => $data['etat_stock'] ?? null,
            'created_at' => $this->castTimestamp($data['created_at'] ?? null),
            'updated_at' => $this->castTimestamp($data['updated_at'] ?? null),
        ];
    }

    private function castTimestamp($value): ?string
    {
        if ($value instanceof Timestamp) {
            return $value->get()->format('c');
        }

        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        return $value ? Carbon::parse($value)->toISOString() : null;
    }
}