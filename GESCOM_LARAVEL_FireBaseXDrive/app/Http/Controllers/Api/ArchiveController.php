<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ArchiveRepositoryInterface;
use App\Services\Firebase\FirestoreService;
use App\Services\FirestoreEntityValidator;
use Google\Cloud\Firestore\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use RuntimeException;
use Throwable;

class ArchiveController extends Controller
{
    private const REFERENCE_COLLECTIONS = [
        'stock_id' => 'stocks',
        'article_id' => 'articles',
        'fournisseur_id' => 'fournisseurs',
        'utilisateur_id' => 'utilisateurs',
    ];

    public function __construct(
        private readonly ArchiveRepositoryInterface $archives,
        private readonly FirestoreService $firestore,
        private readonly FirestoreEntityValidator $validator,
    ) {
    }

    public function index(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 50), 1), 100);
        $result = $this->archives->paginate($limit, $request->query('startAfter'));

        return response()->json([
            'data' => array_map(fn (array $archive) => $this->formatArchive($archive), $result['data']),
            'nextPageToken' => $result['nextPageToken'],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'stock_id' => ['nullable', 'string'],
            'article_id' => ['nullable', 'string'],
            'fournisseur_id' => ['nullable', 'string'],
            'motif' => ['required', 'string', 'in:vendu,périmé,retrait manuel,autre'],
            'quantite' => ['nullable', 'integer'],
            'montant_vente' => ['nullable', 'numeric'],
            'date_archivage' => ['nullable', 'date'],
            'commentaire' => ['nullable', 'string'],
            'utilisateur_id' => ['nullable', 'string'],
        ]);

        try {
            $archive = $this->firestore->runTransaction(function (Transaction $transaction) use ($data) {
                $payload = $this->prepareAttributes($data, $transaction, true);

                return $this->archives->create($payload, $transaction);
            });

            return response()->json([
                'message' => 'Archive créée avec succès',
                'data' => $this->formatArchive($archive),
            ], Response::HTTP_CREATED);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la création de l\'archive.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $archiveId)
    {
        $archive = $this->archives->find($archiveId);

        if ($archive === null) {
            return response()->json(['message' => 'Archive introuvable'], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'data' => $this->formatArchive($archive),
        ]);
    }

    public function update(Request $request, string $archiveId)
    {
        $existing = $this->archives->find($archiveId);
        if ($existing === null) {
            return response()->json(['message' => 'Archive introuvable'], Response::HTTP_NOT_FOUND);
        }

        $data = $request->validate([
            'stock_id' => ['sometimes', 'nullable', 'string'],
            'article_id' => ['sometimes', 'nullable', 'string'],
            'fournisseur_id' => ['sometimes', 'nullable', 'string'],
            'motif' => ['sometimes', 'string', 'in:vendu,périmé,retrait manuel,autre'],
            'quantite' => ['sometimes', 'nullable', 'integer'],
            'montant_vente' => ['sometimes', 'nullable', 'numeric'],
            'date_archivage' => ['sometimes', 'nullable', 'date'],
            'commentaire' => ['sometimes', 'nullable', 'string'],
            'utilisateur_id' => ['sometimes', 'nullable', 'string'],
        ]);

        try {
            $updated = $this->firestore->runTransaction(function (Transaction $transaction) use ($archiveId, $data) {
                $attributes = $this->prepareAttributes($data, $transaction, false);

                if ($attributes === []) {
                    return $this->archives->findWithinTransaction($transaction, $archiveId);
                }

                return $this->archives->update($archiveId, $attributes, $transaction);
            });

            return response()->json([
                'message' => 'Archive mise à jour avec succès',
                'data' => $this->formatArchive($updated ?? $existing),
            ]);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la mise à jour de l\'archive.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(string $archiveId)
    {
        $archive = $this->archives->find($archiveId);
        if ($archive === null) {
            return response()->json(['message' => 'Archive introuvable'], Response::HTTP_NOT_FOUND);
        }

        $this->archives->delete($archiveId);

        return response()->json(status: Response::HTTP_NO_CONTENT);
    }

    private function prepareAttributes(array $data, ?Transaction $transaction, bool $isCreate): array
    {
        $payload = [];

        foreach (self::REFERENCE_COLLECTIONS as $field => $collection) {
            if (!array_key_exists($field, $data)) {
                continue;
            }

            $value = $data[$field];
            if ($value !== null) {
                $this->validator->ensureDocumentExists($collection, (string) $value, $transaction);
            }

            $payload[$field] = $value;
        }

        if ($isCreate || array_key_exists('motif', $data)) {
            $payload['motif'] = $data['motif'];
        }

        if (array_key_exists('quantite', $data)) {
            $payload['quantite'] = $data['quantite'] !== null ? (int) $data['quantite'] : null;
        }

        if (array_key_exists('montant_vente', $data)) {
            $payload['montant_vente'] = $data['montant_vente'] !== null ? (float) $data['montant_vente'] : null;
        }

        if (array_key_exists('date_archivage', $data)) {
            $payload['date_archivage'] = $data['date_archivage'] !== null
                ? Carbon::parse($data['date_archivage'])
                : null;
        }

        if (array_key_exists('commentaire', $data)) {
            $payload['commentaire'] = $data['commentaire'];
        }

        return $payload;
    }

    private function formatArchive(array $archive): array
    {
        $article = $this->tryFetchDocument('articles', $archive['article_id'] ?? null);
        $fournisseur = $this->tryFetchDocument('fournisseurs', $archive['fournisseur_id'] ?? null);
        $utilisateur = $this->tryFetchDocument('utilisateurs', $archive['utilisateur_id'] ?? null);
        $stock = $this->tryFetchDocument('stocks', $archive['stock_id'] ?? null);

        return [
            'id' => $archive['id'],
            'stock_id' => $archive['stock_id'] ?? null,
            'article_id' => $archive['article_id'] ?? null,
            'fournisseur_id' => $archive['fournisseur_id'] ?? null,
            'utilisateur_id' => $archive['utilisateur_id'] ?? null,
            'motif' => $archive['motif'] ?? null,
            'quantite' => isset($archive['quantite']) ? (int) $archive['quantite'] : null,
            'montant_vente' => isset($archive['montant_vente']) ? (float) $archive['montant_vente'] : null,
            'date_archivage' => $archive['date_archivage'] ?? null,
            'commentaire' => $archive['commentaire'] ?? null,
            'created_at' => $archive['created_at'] ?? null,
            'updated_at' => $archive['updated_at'] ?? null,
            'deleted_at' => $archive['deleted_at'] ?? null,
            'article' => $article,
            'fournisseur' => $fournisseur,
            'utilisateur' => $utilisateur,
            'stock' => $stock,
        ];
    }

    private function tryFetchDocument(string $collection, ?string $id): ?array
    {
        if ($id === null) {
            return null;
        }

        try {
            return $this->validator->ensureDocumentExists($collection, $id);
        } catch (RuntimeException) {
            return null;
        }
    }
}
