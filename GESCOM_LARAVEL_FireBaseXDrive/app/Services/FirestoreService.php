<?php

namespace App\Services;

use App\Repositories\DossierRepository;
use App\Repositories\ContenuRepository;
use Illuminate\Support\Collection;

class FirestoreService
{
    protected DossierRepository $dossierRepo;
    protected ContenuRepository $contenuRepo;

    public function __construct(DossierRepository $dossierRepo, ContenuRepository $contenuRepo)
    {
        $this->dossierRepo = $dossierRepo;
        $this->contenuRepo = $contenuRepo;
    }

    /**
     * Initialiser la structure des dossiers dans Firestore
     */
    public function initialiserStructureDossiers(): array
    {
        return $this->dossierRepo->initialiser();
    }

    /**
     * Récupérer tous les dossiers depuis Firestore
     */
    public function getDossiers(): Collection
    {
        return $this->dossierRepo->getAll();
    }

    /**
     * Récupérer un dossier spécifique par type
     */
    public function getDossier(string $type): ?array
    {
        return $this->dossierRepo->getByType($type);
    }

    /**
     * Sauvegarder un contenu dans Firestore
     */
    public function sauvegarderContenu(array $contenu): array
    {
        return $this->contenuRepo->create($contenu);
    }

    /**
     * Récupérer les contenus par type depuis Firestore
     */
    public function getContenus(string $type): Collection
    {
        return $this->contenuRepo->getByType($type);
    }

    /**
     * Récupérer un contenu par ID
     */
    public function getContenu(string $id): ?array
    {
        return $this->contenuRepo->getById($id);
    }

    /**
     * Supprimer un contenu de Firestore
     */
    public function supprimerContenu(string $firebaseId): bool
    {
        return $this->contenuRepo->delete($firebaseId);
    }

    /**
     * Mettre à jour un contenu
     */
    public function mettreAJourContenu(string $id, array $data): array
    {
        return $this->contenuRepo->update($id, $data);
    }

    /**
     * Rechercher des contenus
     */
    public function rechercherContenus(string $searchTerm, ?string $type = null): Collection
    {
        return $this->contenuRepo->searchByName($searchTerm, $type);
    }
}
