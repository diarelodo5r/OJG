<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Firebase\FirestoreService;
use App\Services\PricingService;
use Google\Cloud\Core\Timestamp;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

class FournisseurController extends Controller
{
    public function __construct(
        private readonly FirestoreService $firestore,
        private readonly PricingService $pricing
    ) {
    }

    public function index(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 20), 1), 100);

        $query = $this->firestore
            ->collection('fournisseurs')
            ->orderBy('created_at', 'DESC')
            ->limit($limit);

        if ($request->filled('startAfter')) {
            $start = $this->firestore->document('fournisseurs', $request->query('startAfter'))->snapshot();
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
            $items[] = $this->mapFournisseur($document->id(), $document->data());
            $last = $document;
        }

        return response()->json([
            'data' => $items,
            'nextPageToken' => $last?->id(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'article_id' => 'required|string',
            'prixArticle' => 'required|numeric',
            'nom' => 'required|string|max:60',
            'telephone' => 'nullable|string|max:30',
            'adresse' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $payload = [
            'article_id' => $data['article_id'],
            'prixArticle' => (float) $data['prixArticle'],
            'nom' => $data['nom'],
            'telephone' => $data['telephone'] ?? null,
            'adresse' => $data['adresse'] ?? null,
            'description' => $data['description'] ?? null,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];

        $document = $this->firestore->createDocument('fournisseurs', $payload);

        return response()->json(
            $this->mapFournisseur($document->id(), $payload, includeArticle: true),
            Response::HTTP_CREATED
        );
    }

    public function show(string $fournisseurId)
    {
        $snapshot = $this->firestore->document('fournisseurs', $fournisseurId)->snapshot();
        if (!$snapshot->exists()) {
            return response()->json(['message' => 'Fournisseur introuvable'], 404);
        }

        return response()->json($this->mapFournisseur($snapshot->id(), $snapshot->data(), includeArticle: true));
    }

    public function update(Request $request, string $fournisseurId)
    {
        $document = $this->firestore->document('fournisseurs', $fournisseurId);
        $snapshot = $document->snapshot();

        if (!$snapshot->exists()) {
            return response()->json(['message' => 'Fournisseur introuvable'], 404);
        }

        $data = $request->validate([
            'article_id' => 'sometimes|string',
            'prixArticle' => 'nullable|numeric',
            'nom' => 'sometimes|string|max:60',
            'telephone' => 'nullable|string|max:30',
            'adresse' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $updates = [];
        foreach (['article_id', 'nom', 'telephone', 'adresse', 'description'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }

        $userId = auth()->id();

        if (array_key_exists('prixArticle', $data) && $data['prixArticle'] !== null) {
            $this->pricing->changerPrixAchat(
                $fournisseurId,
                (float) $data['prixArticle'],
                $userId ? (string) $userId : null,
                $request->input('description')
            );
        }

        if (!empty($updates)) {
            $updates['updated_at'] = Carbon::now();
            $document->update($updates);
        }

        $updated = $document->snapshot();

        return response()->json($this->mapFournisseur($updated->id(), $updated->data(), includeArticle: true));
    }

    public function destroy(string $fournisseurId)
    {
        $document = $this->firestore->document('fournisseurs', $fournisseurId);
        if (!$document->snapshot()->exists()) {
            return response()->json(['message' => 'Fournisseur introuvable'], 404);
        }

        $document->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    private function mapFournisseur(string $id, array $data, bool $includeArticle = false): array
    {
        $result = [
            'id' => $id,
            'article_id' => $data['article_id'] ?? null,
            'prixArticle' => isset($data['prixArticle']) ? (float) $data['prixArticle'] : null,
            'nom' => $data['nom'] ?? null,
            'telephone' => $data['telephone'] ?? null,
            'adresse' => $data['adresse'] ?? null,
            'description' => $data['description'] ?? null,
            'created_at' => $this->castTimestamp($data['created_at'] ?? null),
            'updated_at' => $this->castTimestamp($data['updated_at'] ?? null),
        ];

        if ($includeArticle && !empty($result['article_id'])) {
            $articleSnapshot = $this->firestore->document('articles', $result['article_id'])->snapshot();
            if ($articleSnapshot->exists()) {
                $result['article'] = [
                    'id' => $articleSnapshot->id(),
                    ...$articleSnapshot->data(),
                ];
            }
        }

        return $result;
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