<?php

namespace App\Repositories\Contracts;

interface ArticleRepositoryInterface
{
    public function paginate(int $limit, ?string $startAfter = null): array;

    public function create(array $attributes): array;

    public function find(string $id): ?array;

    public function update(string $id, array $attributes): ?array;

    public function delete(string $id): void;

    public function updatePhoto(string $id, ?string $path): ?array;
}
