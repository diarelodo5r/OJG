<?php

namespace App\Services;

use App\Repositories\Contracts\StockRepositoryInterface;
use App\Services\Firebase\FirestoreService;
use Google\Cloud\Firestore\Transaction;
use Illuminate\Support\Carbon;

class InventoryService
{
    public function __construct(
        private readonly FirestoreService $firestore,
        private readonly StockRepositoryInterface $stocks
    ) {
    }

    /**
     * Entrée en stock (réception, retour, etc.)
     */
    public function entreeStock(array $payload): array
    {
        return $this->firestore->runTransaction(function (Transaction $transaction) use ($payload) {
            $stock = $this->stocks->create([
                'article_id' => $payload['article_id'],
                'fournisseur_id' => $payload['fournisseur_id'] ?? null,
                'lot' => $payload['lot'] ?? null,
                'reference' => $payload['reference'] ?? null,
                'quantite' => $payload['quantite'] ?? null,
                'montant' => $payload['montant'] ?? null,
                'date_fabrication' => $payload['date_fabrication'] ?? null,
                'date_peremption' => $payload['date_peremption'] ?? null,
                'etat' => $payload['etat'] ?? null,
                'description' => $payload['description'] ?? null,
                'etat_stock' => 'actif',
            ], $transaction);

            $this->creerHistorique($transaction, $stock['id'], 'entrée', $payload);

            return $stock;
        });
    }

    /**
     * Sortie de stock (vente, consommation, etc.)
     */
    public function sortieStock(string $stockId, int $quantite, ?string $utilisateurId = null, ?string $description = null): array
    {
        return $this->firestore->runTransaction(function (Transaction $transaction) use ($stockId, $quantite, $utilisateurId, $description) {
            $snapshot = $this->stocks->findWithinTransaction($transaction, $stockId);
            $currentQuantity = (int) ($snapshot['quantite'] ?? 0);
            $newQuantity = max(0, $currentQuantity - $quantite);

            $this->stocks->update($stockId, [
                'quantite' => $newQuantity,
            ], $transaction);

            $this->creerHistorique($transaction, $stockId, 'sortie', [
                'utilisateur_id' => $utilisateurId,
                'description' => $description,
            ]);

            return $this->stocks->findWithinTransaction($transaction, $stockId) ?? ['id' => $stockId, 'quantite' => $newQuantity];
        });
    }

    /**
     * Ajustement de stock (inventaire)
     */
    public function ajustementStock(string $stockId, int $nouvelleQuantite, ?string $utilisateurId = null, ?string $description = null): array
    {
        return $this->firestore->runTransaction(function (Transaction $transaction) use ($stockId, $nouvelleQuantite, $utilisateurId, $description) {
            $this->stocks->update($stockId, [
                'quantite' => $nouvelleQuantite,
            ], $transaction);

            $this->creerHistorique($transaction, $stockId, 'ajustement', [
                'utilisateur_id' => $utilisateurId,
                'description' => $description,
            ]);

            return $this->stocks->findWithinTransaction($transaction, $stockId) ?? ['id' => $stockId, 'quantite' => $nouvelleQuantite];
        });
    }

    private function creerHistorique(Transaction $transaction, string $stockId, string $type, array $payload): void
    {
        $historiqueData = [
            'stock_id' => $stockId,
            'fournisseur_id' => $payload['fournisseur_id'] ?? null,
            'utilisateur_id' => $payload['utilisateur_id'] ?? null,
            'type_mouvement' => $type,
            'description' => $payload['description'] ?? null,
            'created_at' => Carbon::now(),
        ];

        $historiqueRef = $this->firestore->newDocument('historiques');
        $transaction->create($historiqueRef, $historiqueData);
    }
}
