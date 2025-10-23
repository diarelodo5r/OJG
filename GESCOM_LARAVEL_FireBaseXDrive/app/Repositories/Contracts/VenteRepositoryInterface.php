<?php

namespace App\Repositories\Contracts;

use Google\Cloud\Firestore\Transaction;

interface VenteRepositoryInterface
{
    public function paginate(int $limit, ?string $startAfter = null): array;

    public function create(array $attributes, ?Transaction $transaction = null): array;

    public function find(string $id): ?array;

    public function update(string $id, array $attributes, ?Transaction $transaction = null): ?array;

    public function delete(string $id, ?Transaction $transaction = null): void;
}
