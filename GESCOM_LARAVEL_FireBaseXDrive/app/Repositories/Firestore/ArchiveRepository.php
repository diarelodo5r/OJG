<?php

namespace App\Repositories\Firestore;

use App\Repositories\Contracts\ArchiveRepositoryInterface;
use App\Services\Firebase\FirestoreService;
use Carbon\Carbon;
use Google\Cloud\Core\Timestamp;
use Google\Cloud\Firestore\CollectionReference;
use Google\Cloud\Firestore\DocumentSnapshot;
use Google\Cloud\Firestore\Transaction;

class ArchiveRepository implements ArchiveRepositoryInterface
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

    public function create(array $attributes, ?Transaction $transaction = null): array
    {
        $now = Carbon::now();

        $data = [
            'stock_id' => $attributes['stock_id'] ?? null,
            'article_id' => $attributes['article_id'] ?? null,
            'fournisseur_id' => $attributes['fournisseur_id'] ?? null,
            'motif' => $attributes['motif'] ?? null,
            'quantite' => $attributes['quantite'] ?? null,
            'montant_vente' => $attributes['montant_vente'] ?? null,
            'date_archivage' => $attributes['date_archivage'] ?? $now,
            'commentaire' => $attributes['commentaire'] ?? null,
            'utilisateur_id' => $attributes['utilisateur_id'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
            'deleted_at' => null,
        ];

        $document = $this->collection()->newDocument();

        if ($transaction) {
            $transaction->create($document, $data);
            $snapshot = $transaction->snapshot($document);
        } else {
            $document->set($data);
            $snapshot = $document->snapshot();
        }

        return $snapshot ? ($this->formatSnapshot($snapshot) ?? $this->normalizeDocumentData($document->id(), $data)) : $this->normalizeDocumentData($document->id(), $data);
    }

    public function find(string $id): ?array
    {
        $snapshot = $this->collection()->document($id)->snapshot();

        return $this->formatSnapshot($snapshot);
    }

    public function findWithinTransaction(Transaction $transaction, string $id): ?array
    {
        $snapshot = $transaction->snapshot($this->collection()->document($id));

        return $snapshot ? $this->formatSnapshot($snapshot) : null;
    }

    public function update(string $id, array $attributes, ?Transaction $transaction = null): ?array
    {
        $updates = [];

        foreach (['stock_id', 'article_id', 'fournisseur_id', 'motif', 'quantite', 'montant_vente', 'date_archivage', 'commentaire', 'utilisateur_id'] as $field) {
            if (array_key_exists($field, $attributes)) {
                $updates[] = ['path' => $field, 'value' => $attributes[$field]];
            }
        }

        if (array_key_exists('deleted_at', $attributes)) {
            $updates[] = ['path' => 'deleted_at', 'value' => $attributes['deleted_at']];
        }

        if ($updates === []) {
            return $transaction
                ? $this->findWithinTransaction($transaction, $id)
                : $this->find($id);
        }

        $updates[] = ['path' => 'updated_at', 'value' => Carbon::now()];

        $document = $this->collection()->document($id);

        if ($transaction) {
            $transaction->update($document, $updates);

            return $this->findWithinTransaction($transaction, $id);
        }

        $document->update($updates);

        return $this->find($id);
    }

    public function delete(string $id, ?Transaction $transaction = null): void
    {
        $document = $this->collection()->document($id);

        if ($transaction) {
            $transaction->delete($document);

            return;
        }

        $document->delete();
    }

    private function collection(): CollectionReference
    {
        return $this->firestore->collection('archives');
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

    private function normalizeDocumentData(string $id, array $data): array
    {
        $normalized = ['id' => $id];

        foreach ($data as $key => $value) {
            $normalized[$key] = $this->normalizeValue($value);
        }

        return $normalized;
    }

    private function normalizeValue(mixed $value): mixed
    {
        if ($value instanceof Timestamp) {
            return Carbon::instance($value->get())->toISOString();
        }

        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        return $value;
    }
}
