<?php

namespace App\Repositories;

use App\Services\Firebase\FirestoreService;
use Google\Cloud\Firestore\CollectionReference;
use Illuminate\Support\Collection;

class ContenuRepository
{
    protected FirestoreService $firestore;
    protected CollectionReference $collection;

    public function __construct(FirestoreService $firestore)
    {
        $this->firestore = $firestore;
        $this->collection = $firestore->collection(config('drive.collections.contenus'));
    }

    /**
     * Récupérer tous les contenus
     */
    public function getAll(): Collection
    {
        $documents = $this->collection->documents();
        $contenus = [];

        foreach ($documents as $document) {
            if ($document->exists()) {
                $contenus[] = array_merge(
                    ['id' => $document->id()],
                    $document->data()
                );
            }
        }

        return collect($contenus);
    }

    /**
     * Récupérer les contenus par type
     */
    public function getByType(string $type): Collection
    {
        $query = $this->collection->where('type', '=', $type);
        $documents = $query->documents();
        $contenus = [];

        foreach ($documents as $document) {
            if ($document->exists()) {
                $data = $document->data();
                $contenus[] = array_merge(
                    ['id' => $document->id()],
                    $data,
                    [
                        'preview_url' => "https://drive.google.com/file/d/{$data['drive_file_id']}/preview",
                        'embed_url' => "https://drive.google.com/file/d/{$data['drive_file_id']}/preview",
                    ]
                );
            }
        }

        return collect($contenus);
    }

    /**
     * Récupérer un contenu par ID
     */
    public function getById(string $id): ?array
    {
        $docRef = $this->collection->document($id);
        $snapshot = $docRef->snapshot();

        if ($snapshot->exists()) {
            $data = $snapshot->data();
            return array_merge(
                ['id' => $snapshot->id()],
                $data,
                [
                    'preview_url' => "https://drive.google.com/file/d/{$data['drive_file_id']}/preview",
                    'embed_url' => "https://drive.google.com/file/d/{$data['drive_file_id']}/preview",
                ]
            );
        }

        return null;
    }

    /**
     * Récupérer un contenu par ID de fichier Drive
     */
    public function getByDriveFileId(string $driveFileId): ?array
    {
        $query = $this->collection->where('drive_file_id', '=', $driveFileId);
        $documents = $query->documents();

        foreach ($documents as $document) {
            if ($document->exists()) {
                $data = $document->data();
                return array_merge(
                    ['id' => $document->id()],
                    $data,
                    [
                        'preview_url' => "https://drive.google.com/file/d/{$data['drive_file_id']}/preview",
                        'embed_url' => "https://drive.google.com/file/d/{$data['drive_file_id']}/preview",
                    ]
                );
            }
        }

        return null;
    }

    /**
     * Créer un nouveau contenu
     */
    public function create(array $data): array
    {
        $data['dateAjout'] = new \DateTime();
        $data['dateModification'] = new \DateTime();

        $docRef = $this->collection->newDocument();
        $docRef->set($data);

        $driveFileId = $data['drive_file_id'] ?? null;
        
        return array_merge(
            ['id' => $docRef->id()],
            $data,
            [
                'preview_url' => $driveFileId ? "https://drive.google.com/file/d/{$driveFileId}/preview" : null,
                'embed_url' => $driveFileId ? "https://drive.google.com/file/d/{$driveFileId}/preview" : null,
            ]
        );
    }

    /**
     * Mettre à jour un contenu
     */
    public function update(string $id, array $data): array
    {
        $data['dateModification'] = new \DateTime();

        $docRef = $this->collection->document($id);
        $docRef->set($data, ['merge' => true]);

        $snapshot = $docRef->snapshot();
        $updatedData = $snapshot->data();
        $driveFileId = $updatedData['drive_file_id'] ?? null;

        return array_merge(
            ['id' => $id],
            $updatedData,
            [
                'preview_url' => $driveFileId ? "https://drive.google.com/file/d/{$driveFileId}/preview" : null,
                'embed_url' => $driveFileId ? "https://drive.google.com/file/d/{$driveFileId}/preview" : null,
            ]
        );
    }

    /**
     * Supprimer un contenu
     */
    public function delete(string $id): bool
    {
        $docRef = $this->collection->document($id);
        $docRef->delete();

        return true;
    }

    /**
     * Vérifier si un contenu existe
     */
    public function exists(string $id): bool
    {
        $docRef = $this->collection->document($id);
        $snapshot = $docRef->snapshot();

        return $snapshot->exists();
    }

    /**
     * Compter les contenus par type
     */
    public function countByType(string $type): int
    {
        return $this->getByType($type)->count();
    }

    /**
     * Rechercher des contenus par nom
     */
    public function searchByName(string $searchTerm, ?string $type = null): Collection
    {
        $allContenus = $type ? $this->getByType($type) : $this->getAll();

        return $allContenus->filter(function ($contenu) use ($searchTerm) {
            return stripos($contenu['nom'] ?? '', $searchTerm) !== false;
        })->values();
    }
}
