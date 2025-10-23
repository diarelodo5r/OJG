<?php

namespace App\Repositories;

use App\Services\Firebase\FirestoreService;
use Google\Cloud\Firestore\CollectionReference;
use Illuminate\Support\Collection;

class DossierRepository
{
    protected FirestoreService $firestore;
    protected CollectionReference $collection;

    public function __construct(FirestoreService $firestore)
    {
        $this->firestore = $firestore;
        $this->collection = $firestore->collection(config('drive.collections.dossiers'));
    }

    /**
     * Initialiser la structure des dossiers dans Firestore
     */
    public function initialiser(): array
    {
        $folders = config('drive.folders');
        $results = [];

        foreach ($folders as $type => $folderConfig) {
            $data = [
                'nom' => $folderConfig['nom'],
                'type' => $type,
                'description' => $folderConfig['description'],
                'drive_folder_id' => $folderConfig['id'],
                'dateCreation' => new \DateTime(),
                'dateModification' => new \DateTime(),
            ];

            $docRef = $this->collection->document($type);
            $docRef->set($data);
            
            $results[$type] = array_merge(['id' => $type], $data);
        }

        return $results;
    }

    /**
     * Récupérer tous les dossiers
     */
    public function getAll(): Collection
    {
        $documents = $this->collection->documents();
        $dossiers = [];

        foreach ($documents as $document) {
            if ($document->exists()) {
                $dossiers[] = array_merge(
                    ['id' => $document->id()],
                    $document->data()
                );
            }
        }

        return collect($dossiers);
    }

    /**
     * Récupérer un dossier par type
     */
    public function getByType(string $type): ?array
    {
        $docRef = $this->collection->document($type);
        $snapshot = $docRef->snapshot();

        if ($snapshot->exists()) {
            return array_merge(
                ['id' => $snapshot->id()],
                $snapshot->data()
            );
        }

        return null;
    }

    /**
     * Récupérer un dossier par ID
     */
    public function getById(string $id): ?array
    {
        return $this->getByType($id);
    }

    /**
     * Créer ou mettre à jour un dossier
     */
    public function createOrUpdate(string $type, array $data): array
    {
        $data['dateModification'] = new \DateTime();
        
        if (!isset($data['dateCreation'])) {
            $data['dateCreation'] = new \DateTime();
        }

        $docRef = $this->collection->document($type);
        $docRef->set($data, ['merge' => true]);

        return array_merge(['id' => $type], $data);
    }

    /**
     * Supprimer un dossier
     */
    public function delete(string $type): bool
    {
        $docRef = $this->collection->document($type);
        $docRef->delete();

        return true;
    }

    /**
     * Vérifier si un dossier existe
     */
    public function exists(string $type): bool
    {
        $docRef = $this->collection->document($type);
        $snapshot = $docRef->snapshot();

        return $snapshot->exists();
    }

    /**
     * Récupérer l'ID du dossier Drive pour un type
     */
    public function getDriveFolderId(string $type): ?string
    {
        $dossier = $this->getByType($type);
        return $dossier['drive_folder_id'] ?? null;
    }
}
