<?php

namespace App\Repositories\Contracts;

use Google\Cloud\Firestore\Transaction;

interface StockRepositoryInterface
{
    public function paginate(int $limit, ?string $startAfter = null): array;

    public function find(string $id): ?array;

    public function findWithinTransaction(Transaction $transaction, string $id): ?array;

    public function create(array $attributes, ?Transaction $transaction = null): array;

    public function update(string $id, array $attributes, ?Transaction $transaction = null): ?array;

    public function softDelete(string $id, array $options = [], ?Transaction $transaction = null): void;
}
