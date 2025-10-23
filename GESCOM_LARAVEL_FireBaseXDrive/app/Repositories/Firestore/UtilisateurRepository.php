<?php

namespace App\Repositories\Firestore;

use App\Repositories\Contracts\UtilisateurRepositoryInterface;
use App\Services\Firebase\FirestoreService;
use Carbon\Carbon;
use Google\Cloud\Core\Timestamp;
use Google\Cloud\Firestore\CollectionReference;
use Google\Cloud\Firestore\DocumentSnapshot;
use Illuminate\Support\Facades\Hash;

class UtilisateurRepository implements UtilisateurRepositoryInterface
{
    public function __construct(private readonly FirestoreService $firestore)
    {
    }

    public function paginate(int $limit, ?string $startAfter = null): array
    {
        $limit = max(1, min($limit, 100));

        $query = $this->collection()
            ->where('deleted_at', '==', null)
            ->orderBy('created_at', 'DESC')
            ->limit($limit);

        if ($startAfter !== null) {
            $snapshot = $this->collection()->document($startAfter)->snapshot();
            if ($snapshot->exists()) {
                $query = $query->startAfter($snapshot);
            }
        }

        $documents = $query->documents();

        $items = [];
        $lastDocument = null;

        foreach ($documents as $document) {
            if (!$document->exists()) {
                continue;
            }

            $formatted = $this->formatSnapshot($document);
            if ($formatted === null) {
                continue;
            }

            $items[] = $formatted;
            $lastDocument = $document;
        }

        return [
            'data' => $items,
            'nextPageToken' => $lastDocument?->id(),
        ];
    }

    public function findById(string $id): ?array
    {
        $snapshot = $this->collection()->document($id)->snapshot();

        return $this->formatSnapshot($snapshot);
    }

    public function findByNom(string $nom): ?array
    {
        $documents = $this->collection()
            ->where('nom', '=', $nom)
            ->where('deleted_at', '==', null)
            ->limit(1)
            ->documents();

        foreach ($documents as $snapshot) {
            $user = $this->formatSnapshot($snapshot);
            if ($user !== null) {
                return $user;
            }
        }

        return null;
    }

    public function findByEmail(string $email): ?array
    {
        $documents = $this->collection()
            ->where('email', '=', $email)
            ->where('deleted_at', '==', null)
            ->limit(1)
            ->documents();

        foreach ($documents as $snapshot) {
            $user = $this->formatSnapshot($snapshot);
            if ($user !== null) {
                return $user;
            }
        }

        return null;
    }

    public function create(array $attributes): array
    {
        $now = Carbon::now();

        $data = [
            'nom' => $attributes['nom'],
            'email' => $attributes['email'] ?? null,
            'mot_de_passe_hash' => Hash::make($attributes['mot_de_passe'] ?? ''),
            'role' => $attributes['role'] ?? null,
            'description' => $attributes['description'] ?? null,
            'adresse' => $attributes['adresse'] ?? null,
            'sexe' => $attributes['sexe'] ?? null,
            'telephone' => $attributes['telephone'] ?? null,
            'photo' => $attributes['photo'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
            'deleted_at' => null,
        ];

        $document = $this->collection()->newDocument();
        $document->set($data);

        $snapshot = $document->snapshot();

        return $this->formatSnapshot($snapshot) ?? ['id' => $document->id(), ...$data];
    }

    public function update(string $id, array $attributes): void
    {
        $updates = [];

        foreach (['nom', 'email', 'role', 'description', 'adresse', 'sexe', 'telephone', 'photo'] as $field) {
            if (array_key_exists($field, $attributes)) {
                $updates[] = ['path' => $field, 'value' => $attributes[$field]];
            }
        }

        if (array_key_exists('mot_de_passe', $attributes)) {
            $updates[] = ['path' => 'mot_de_passe_hash', 'value' => Hash::make($attributes['mot_de_passe'] ?? '')];
        }

        if (array_key_exists('deleted_at', $attributes)) {
            $updates[] = ['path' => 'deleted_at', 'value' => $attributes['deleted_at']];
        }

        $updates[] = ['path' => 'updated_at', 'value' => Carbon::now()];

        if ($updates === []) {
            return;
        }

        $this->collection()->document($id)->update($updates);
    }

    public function softDelete(string $id): void
    {
        $this->collection()->document($id)->update([
            ['path' => 'deleted_at', 'value' => Carbon::now()],
            ['path' => 'updated_at', 'value' => Carbon::now()],
        ]);
    }

    private function collection(): CollectionReference
    {
        return $this->firestore->collection('utilisateurs');
    }

    private function formatSnapshot(DocumentSnapshot $snapshot): ?array
    {
        if (!$snapshot->exists()) {
            return null;
        }

        $data = $snapshot->data();

        if (($data['deleted_at'] ?? null) !== null) {
            return null;
        }

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

        return $value;
    }
}
