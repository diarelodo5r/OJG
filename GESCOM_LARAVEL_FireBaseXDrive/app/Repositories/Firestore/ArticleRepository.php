<?php

namespace App\Repositories\Firestore;

use App\Repositories\Contracts\ArticleRepositoryInterface;
use App\Services\Firebase\FirestoreService;
use Carbon\Carbon;
use Google\Cloud\Core\Timestamp;
use Google\Cloud\Firestore\CollectionReference;
use Google\Cloud\Firestore\DocumentSnapshot;

class ArticleRepository implements ArticleRepositoryInterface
{
    public function __construct(private readonly FirestoreService $firestore)
    {
    }

    public function paginate(int $limit, ?string $startAfter = null): array
    {
        $query = $this->collection()
            ->orderBy('created_at', 'DESC')
            ->limit($limit);

        if ($startAfter) {
            $snapshot = $this->collection()->document($startAfter)->snapshot();
            if ($snapshot->exists()) {
                $query = $query->startAfter($snapshot);
            }
        }

        $documents = $query->documents();
        $items = [];
        $last = null;

        foreach ($documents as $document) {
            if (!$document->exists()) {
                continue;
            }
            $items[] = $this->formatSnapshot($document);
            $last = $document;
        }

        return [
            'data' => $items,
            'nextPageToken' => $last?->id(),
        ];
    }

    public function create(array $attributes): array
    {
        $now = Carbon::now();

        $data = [
            'famille_id' => $attributes['famille_id'] ?? null,
            'nom_article' => $attributes['nom_article'],
            'image_article' => $attributes['image_article'] ?? null,
            'prixVente' => $attributes['prixVente'] ?? null,
            'quantite_standard' => $attributes['quantite_standard'] ?? null,
            'Conditionnement' => $attributes['Conditionnement'] ?? null,
            'description' => $attributes['description'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $document = $this->collection()->newDocument();
        $document->set($data);

        return $this->formatSnapshot($document->snapshot());
    }

    public function find(string $id): ?array
    {
        $snapshot = $this->collection()->document($id)->snapshot();

        return $this->formatSnapshot($snapshot);
    }

    public function update(string $id, array $attributes): ?array
    {
        $updates = [];

        foreach (['famille_id', 'nom_article', 'image_article', 'prixVente', 'quantite_standard', 'Conditionnement', 'description'] as $field) {
            if (array_key_exists($field, $attributes)) {
                $updates[] = ['path' => $field, 'value' => $attributes[$field]];
            }
        }

        if ($updates === []) {
            return $this->find($id);
        }

        $updates[] = ['path' => 'updated_at', 'value' => Carbon::now()];

        $this->collection()->document($id)->update($updates);

        return $this->find($id);
    }

    public function delete(string $id): void
    {
        $this->collection()->document($id)->delete();
    }

    public function updatePhoto(string $id, ?string $path): ?array
    {
        $this->collection()->document($id)->update([
            ['path' => 'image_article', 'value' => $path],
            ['path' => 'updated_at', 'value' => Carbon::now()],
        ]);

        return $this->find($id);
    }

    private function collection(): CollectionReference
    {
        return $this->firestore->collection('articles');
    }

    private function formatSnapshot(DocumentSnapshot $snapshot): ?array
    {
        if (!$snapshot->exists()) {
            return null;
        }

        $data = $snapshot->data();
        $normalized = ['id' => $snapshot->id()];

        foreach ($data as $key => $value) {
            $normalized[$key] = $this->normalizeValue($value);
        }

        return $normalized;
    }

    private function normalizeValue(mixed $value): mixed
    {
        if ($value instanceof Timestamp) {
            return Carbon::instance($value->get());
        }

        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        return $value;
    }
}
