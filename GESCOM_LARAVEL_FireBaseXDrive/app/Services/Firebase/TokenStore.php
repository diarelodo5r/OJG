<?php

namespace App\Services\Firebase;

use Google\Cloud\Firestore\DocumentReference;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class TokenStore
{
    private const COLLECTION = 'auth_tokens';

    public function __construct(private readonly FirestoreService $firestore)
    {
    }

    public function createToken(string $userId, ?Carbon $expiresAt = null, array $metadata = []): string
    {
        $plainText = Str::random(80);
        $hash = $this->hashToken($plainText);

        $data = [
            'token_hash' => $hash,
            'utilisateur_id' => $userId,
            'issued_at' => Carbon::now()->toIso8601String(),
            'last_used_at' => Carbon::now()->toIso8601String(),
            'metadata' => $metadata,
        ];

        if ($expiresAt) {
            $data['expires_at'] = $expiresAt->toIso8601String();
        }

        $this->document($hash)->set($data);

        return $plainText;
    }

    public function findToken(string $plainToken): ?array
    {
        $hash = $this->hashToken($plainToken);
        $snapshot = $this->document($hash)->snapshot();

        if (!$snapshot->exists()) {
            return null;
        }

        $data = $snapshot->data();

        $expiresAt = isset($data['expires_at']) ? Carbon::parse($data['expires_at']) : null;
        if ($expiresAt && $expiresAt->isPast()) {
            $this->deleteTokenByHash($hash);
            return null;
        }

        $issuedAt = isset($data['issued_at']) ? Carbon::parse($data['issued_at']) : null;
        $lastUsedAt = isset($data['last_used_at']) ? Carbon::parse($data['last_used_at']) : null;

        return [
            'token_hash' => $hash,
            'utilisateur_id' => $data['utilisateur_id'] ?? null,
            'issued_at' => $issuedAt,
            'last_used_at' => $lastUsedAt,
            'expires_at' => $expiresAt,
            'metadata' => $data['metadata'] ?? [],
        ];
    }

    public function touch(string $plainToken): void
    {
        $hash = $this->hashToken($plainToken);
        $this->document($hash)->set([
            'last_used_at' => Carbon::now()->toIso8601String(),
        ], ['merge' => true]);
    }

    public function deleteToken(string $plainToken): void
    {
        $hash = $this->hashToken($plainToken);
        $this->deleteTokenByHash($hash);
    }

    private function deleteTokenByHash(string $hash): void
    {
        $this->document($hash)->delete();
    }

    private function document(string $hash): DocumentReference
    {
        return $this->firestore->collection(self::COLLECTION)->document($hash);
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
