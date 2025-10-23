<?php

namespace App\Services;

use App\Services\Firebase\FirestoreService;
use Google\Cloud\Firestore\Transaction;
use RuntimeException;

class FirestoreEntityValidator
{
    public function __construct(private readonly FirestoreService $firestore)
    {
    }

    public function ensureDocumentExists(string $collection, string $id, ?Transaction $transaction = null): array
    {
        if ($id === '') {
            throw new RuntimeException("Identifiant manquant pour la collection {$collection}");
        }

        $reference = $this->firestore->document($collection, $id);
        $snapshot = $transaction
            ? $transaction->snapshot($reference)
            : $reference->snapshot();

        if ($snapshot === null || !$snapshot->exists()) {
            throw new RuntimeException("Document introuvable dans la collection {$collection}");
        }

        return ['id' => $snapshot->id(), ...$snapshot->data()];
    }
}
