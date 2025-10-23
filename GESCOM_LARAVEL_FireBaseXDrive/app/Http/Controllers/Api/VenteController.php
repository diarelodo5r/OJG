<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\StockRepositoryInterface;
use App\Repositories\Contracts\VenteRepositoryInterface;
use App\Services\Firebase\FirestoreService;
use App\Services\FirestoreEntityValidator;
use Google\Cloud\Firestore\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use RuntimeException;
use Throwable;

class VenteController extends Controller
{
    public function __construct(
        private readonly VenteRepositoryInterface $ventes,
        private readonly StockRepositoryInterface $stocks,
        private readonly FirestoreService $firestore,
        private readonly FirestoreEntityValidator $validator,
    ) {
    }

    public function index(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 50), 1), 100);
        $result = $this->ventes->paginate($limit, $request->query('startAfter'));

        return response()->json([
            'data' => array_map(fn (array $vente) => $this->formatVente($vente), $result['data']),
            'nextPageToken' => $result['nextPageToken'],
        ]);
    }

    /**
     * Enregistrer une seule vente avec déstockage automatique.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'stock_id' => ['required', 'string'],
            'client_id' => ['required', 'string'],
            'quantite' => ['required', 'integer', 'min:1'],
            'montant' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        try {
            $vente = $this->firestore->runTransaction(function (Transaction $transaction) use ($data) {
                $stock = $this->fetchStock($transaction, $data['stock_id']);
                $quantiteDemandee = (int) $data['quantite'];
                $quantiteDisponible = (int) ($stock['quantite'] ?? 0);

                if ($quantiteDisponible < $quantiteDemandee) {
                    throw new RuntimeException("Quantité en stock insuffisante. Disponible: {$quantiteDisponible}, Demandé: {$quantiteDemandee}");
                }

                $client = $this->validator->ensureDocumentExists('clients', $data['client_id'], $transaction);
                $article = $this->tryFetchDocument($transaction, 'articles', $stock['article_id'] ?? null);
                $famille = $this->tryFetchDocument($transaction, 'familles', $article['famille_id'] ?? null);
                $fournisseur = $this->tryFetchDocument($transaction, 'fournisseurs', $stock['fournisseur_id'] ?? null);

                $newQuantity = $quantiteDisponible - $quantiteDemandee;
                $stockUpdates = ['quantite' => $newQuantity];
                $etat = $this->computeEtat($article['quantite_standard'] ?? null, $newQuantity);
                if ($etat !== null) {
                    $stockUpdates['etat'] = $etat;
                }
                if ($newQuantity <= 0) {
                    $stockUpdates['etat_stock'] = 'épuisé';
                }

                $this->stocks->update($stock['id'], $stockUpdates, $transaction);

                $snapshots = $this->buildSnapshots($stock, $article, $famille, $fournisseur, $client);

                return $this->ventes->create([
                    'stock_id' => $stock['id'],
                    'client_id' => $client['id'],
                    'quantite' => $quantiteDemandee,
                    'montant' => (float) $data['montant'],
                    'description' => $data['description'] ?? null,
                    'snapshots' => $snapshots,
                ], $transaction);
            });

            return response()->json([
                'message' => 'Vente enregistrée avec succès',
                'data' => $this->formatVente($vente),
            ], Response::HTTP_CREATED);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la création de la vente.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Enregistrer plusieurs ventes en lot avec déstockage automatique.
     */
    public function storeBatch(Request $request)
    {
        $data = $request->validate([
            'ventes' => ['required', 'array', 'min:1'],
            'ventes.*.stock_id' => ['required', 'string'],
            'ventes.*.client_id' => ['required', 'string'],
            'ventes.*.quantite' => ['required', 'integer', 'min:1'],
            'ventes.*.montant' => ['required', 'numeric', 'min:0'],
            'ventes.*.description' => ['nullable', 'string'],
        ]);

        try {
            $ventes = $this->firestore->runTransaction(function (Transaction $transaction) use ($data) {
                $created = [];

                foreach ($data['ventes'] as $ligneVente) {
                    $stock = $this->fetchStock($transaction, $ligneVente['stock_id']);
                    $quantiteDemandee = (int) $ligneVente['quantite'];
                    $quantiteDisponible = (int) ($stock['quantite'] ?? 0);

                    if ($quantiteDisponible < $quantiteDemandee) {
                        throw new RuntimeException("Quantité insuffisante pour le stock {$stock['id']}. Disponible: {$quantiteDisponible}, Demandé: {$quantiteDemandee}");
                    }

                    $client = $this->validator->ensureDocumentExists('clients', $ligneVente['client_id'], $transaction);
                    $article = $this->tryFetchDocument($transaction, 'articles', $stock['article_id'] ?? null);
                    $famille = $this->tryFetchDocument($transaction, 'familles', $article['famille_id'] ?? null);
                    $fournisseur = $this->tryFetchDocument($transaction, 'fournisseurs', $stock['fournisseur_id'] ?? null);

                    $newQuantity = $quantiteDisponible - $quantiteDemandee;
                    $stockUpdates = ['quantite' => $newQuantity];
                    $etat = $this->computeEtat($article['quantite_standard'] ?? null, $newQuantity);
                    if ($etat !== null) {
                        $stockUpdates['etat'] = $etat;
                    }
                    if ($newQuantity <= 0) {
                        $stockUpdates['etat_stock'] = 'épuisé';
                    }

                    $this->stocks->update($stock['id'], $stockUpdates, $transaction);

                    $snapshots = $this->buildSnapshots($stock, $article, $famille, $fournisseur, $client);

                    $created[] = $this->ventes->create([
                        'stock_id' => $stock['id'],
                        'client_id' => $client['id'],
                        'quantite' => $quantiteDemandee,
                        'montant' => (float) $ligneVente['montant'],
                        'description' => $ligneVente['description'] ?? null,
                        'snapshots' => $snapshots,
                    ], $transaction);
                }

                return $created;
            });

            return response()->json([
                'message' => 'Ventes enregistrées avec succès',
                'data' => array_map(fn (array $vente) => $this->formatVente($vente), $ventes),
            ], Response::HTTP_CREATED);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la création des ventes.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $venteId)
    {
        $vente = $this->ventes->find($venteId);

        if ($vente === null) {
            return response()->json(['message' => 'Vente introuvable'], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'data' => $this->formatVente($vente),
        ]);
    }

    public function update(Request $request, string $venteId)
    {
        $vente = $this->ventes->find($venteId);
        if ($vente === null) {
            return response()->json(['message' => 'Vente introuvable'], Response::HTTP_NOT_FOUND);
        }

        $data = $request->validate([
            'stock_id' => ['sometimes', 'string'],
            'client_id' => ['sometimes', 'string'],
            'quantite' => ['sometimes', 'integer', 'min:1'],
            'montant' => ['sometimes', 'numeric', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
            'snapshots' => ['sometimes', 'array'],
        ]);

        $updates = [];

        if (array_key_exists('stock_id', $data)) {
            $this->validator->ensureDocumentExists('stocks', $data['stock_id']);
            $updates['stock_id'] = $data['stock_id'];
        }

        if (array_key_exists('client_id', $data)) {
            $this->validator->ensureDocumentExists('clients', $data['client_id']);
            $updates['client_id'] = $data['client_id'];
        }

        foreach (['quantite', 'montant', 'description', 'snapshots'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }

        if ($updates === []) {
            return response()->json([
                'message' => 'Aucune modification détectée',
                'data' => $this->formatVente($vente),
            ]);
        }

        $updated = $this->ventes->update($venteId, $updates);

        return response()->json([
            'message' => 'Vente mise à jour avec succès',
            'data' => $this->formatVente($updated ?? $vente),
        ]);
    }

    public function destroy(string $venteId)
    {
        $vente = $this->ventes->find($venteId);
        if ($vente === null) {
            return response()->json(['message' => 'Vente introuvable'], Response::HTTP_NOT_FOUND);
        }

        $this->ventes->delete($venteId);

        return response()->json(status: Response::HTTP_NO_CONTENT);
    }

    private function fetchStock(Transaction $transaction, string $stockId): array
    {
        $stock = $this->stocks->findWithinTransaction($transaction, $stockId);

        if ($stock === null) {
            throw new RuntimeException('Stock introuvable');
        }

        return $stock;
    }

    private function computeEtat(mixed $quantiteStandard, int $quantite): ?int
    {
        $standard = (int) ($quantiteStandard ?? 0);
        if ($standard <= 0) {
            return null;
        }

        $ratio = ($quantite / $standard) * 100;

        return (int) round(max(0, min(100, $ratio)));
    }

    private function buildSnapshots(array $stock, ?array $article, ?array $famille, ?array $fournisseur, array $client): array
    {
        return [
            'nom_article_snapshot' => $article['nom_article'] ?? null,
            'nom_famille_snapshot' => $famille['nom_famille'] ?? null,
            'prix_vente_snapshot' => $article['prixVente'] ?? null,
            'prix_achat_snapshot' => $fournisseur['prixArticle'] ?? null,
            'nom_fournisseur_snapshot' => $fournisseur['nom'] ?? null,
            'lot_snapshot' => $stock['lot'] ?? null,
            'reference_snapshot' => $stock['reference'] ?? null,
            'conditionnement_snapshot' => $article['Conditionnement'] ?? null,
            'image_article_snapshot' => $article['image_article'] ?? null,
            'client_snapshot' => [
                'id' => $client['id'],
                'nom' => $client['nom'] ?? null,
                'telephone' => $client['telephone'] ?? null,
            ],
        ];
    }

    private function tryFetchDocument(Transaction $transaction, ?string $collection, ?string $id): ?array
    {
        if ($collection === null || $id === null) {
            return null;
        }

        try {
            return $this->validator->ensureDocumentExists($collection, $id, $transaction);
        } catch (RuntimeException) {
            return null;
        }
    }

    private function formatVente(array $vente): array
    {
        $snapshots = $vente['snapshots'] ?? [];

        return [
            'id' => $vente['id'],
            'stock_id' => $vente['stock_id'] ?? null,
            'client_id' => $vente['client_id'] ?? null,
            'quantite' => isset($vente['quantite']) ? (int) $vente['quantite'] : null,
            'montant' => isset($vente['montant']) ? (float) $vente['montant'] : null,
            'description' => $vente['description'] ?? null,
            'snapshots' => $snapshots,
            'nom_article_snapshot' => $snapshots['nom_article_snapshot'] ?? null,
            'nom_famille_snapshot' => $snapshots['nom_famille_snapshot'] ?? null,
            'prix_vente_snapshot' => $snapshots['prix_vente_snapshot'] ?? null,
            'prix_achat_snapshot' => $snapshots['prix_achat_snapshot'] ?? null,
            'nom_fournisseur_snapshot' => $snapshots['nom_fournisseur_snapshot'] ?? null,
            'lot_snapshot' => $snapshots['lot_snapshot'] ?? null,
            'reference_snapshot' => $snapshots['reference_snapshot'] ?? null,
            'conditionnement_snapshot' => $snapshots['conditionnement_snapshot'] ?? null,
            'image_article_snapshot' => $snapshots['image_article_snapshot'] ?? null,
            'client_snapshot' => $snapshots['client_snapshot'] ?? null,
            'created_at' => $vente['created_at'] ?? null,
            'updated_at' => $vente['updated_at'] ?? null,
        ];
    }
}
