<?php

namespace App\Services;

use App\Services\Firebase\FirestoreService;
use Illuminate\Support\Carbon;

class ArchiveService
{
    /**
     * Archiver un stock avec un motif et informations optionnelles.
     * - Met à jour l'état du stock à "archivé"
     * - Crée une entrée dans la table archives
     */
    public function __construct(private readonly FirestoreService $firestore)
    {
    }

    /**
     * Archiver un stock avec un motif et informations optionnelles.
     * - Met à jour l'état du stock à "archivé"
     * - Crée une entrée dans la table archives
     */
    public function archiverStock(string $stockId, string $motif, array $options = []): array
    {
        return $this->firestore->runTransaction(function ($transaction) use ($stockId, $motif, $options) {
            $stockRef = $this->firestore->document('stocks', $stockId);

            $transaction->update($stockRef, [
                'etat_stock' => 'archivé',
                'updated_at' => Carbon::now(),
            ]);

            $archiveRef = $this->firestore->newDocument('archives');
            $archiveData = [
                'stock_id' => $stockId,
                'motif' => $motif,
                'article_id' => $options['article_id'] ?? null,
                'fournisseur_id' => $options['fournisseur_id'] ?? null,
                'quantite' => $options['quantite'] ?? null,
                'montant_vente' => $options['montant_vente'] ?? null,
                'date_archivage' => $options['date_archivage'] ?? Carbon::now(),
                'commentaire' => $options['commentaire'] ?? null,
                'utilisateur_id' => $options['utilisateur_id'] ?? null,
                'created_at' => Carbon::now(),
                'archive_timestamp' => Carbon::now(),
            ];

            $snapshot = $transaction->snapshot($stockRef);
            if ($snapshot !== null && $snapshot->exists()) {
                $archiveData['article_id'] = $archiveData['article_id'] ?? $snapshot->get('article_id');
                $archiveData['fournisseur_id'] = $archiveData['fournisseur_id'] ?? $snapshot->get('fournisseur_id');
                $archiveData['quantite'] = $archiveData['quantite'] ?? $snapshot->get('quantite');
            }

            $transaction->create($archiveRef, $archiveData);

            return ['id' => $archiveRef->id(), ...$archiveData];
        });
    }
}
