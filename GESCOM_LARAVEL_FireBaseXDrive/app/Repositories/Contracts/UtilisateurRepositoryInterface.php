<?php

namespace App\Repositories\Contracts;

interface UtilisateurRepositoryInterface
{
    /**
     * Retrieve a user by their identifier.
     */
    public function findById(string $id): ?array;

    /**
     * Retrieve a user by their username (nom).
     */
    public function findByNom(string $nom): ?array;

    /**
     * Retrieve a user by email if provided.
     */
    public function findByEmail(string $email): ?array;

    /**
     * Create a new utilisateur document.
     *
     * @param array<string, mixed> $attributes
     * @return array<string, mixed>
     */
    public function create(array $attributes): array;

    /**
     * Update an existing utilisateur document.
     *
     * @param array<string, mixed> $attributes
     */
    public function update(string $id, array $attributes): void;

    /**
     * Soft delete a user by setting deleted_at timestamp.
     */
    public function softDelete(string $id): void;
}
