<?php

namespace App\Services;

use App\Models\{Fournisseur, Article, HistoriquePrixAchat, HistoriquePrixVente, Historique};
use Illuminate\Support\Facades\DB;

class PricingService
{
    /**
     * Changer le prix d'achat d'un fournisseur et historiser
     */
    public function changerPrixAchat(Fournisseur $fournisseur, float $nouveauPrix, ?int $utilisateurId = null, ?string $description = null): HistoriquePrixAchat
    {
        return DB::transaction(function () use ($fournisseur, $nouveauPrix, $utilisateurId, $description) {
            $fournisseur->update(['prixArticle' => $nouveauPrix]);

            $hpa = HistoriquePrixAchat::create([
                'fournisseur_id' => $fournisseur->id,
                'valeur' => $nouveauPrix,
            ]);

            Historique::create([
                'fournisseur_id' => $fournisseur->id,
                'utilisateur_id' => $utilisateurId,
                'type_mouvement' => 'ajustement',
                'prix_achat_id' => $hpa->id,
                'description' => $description,
            ]);

            return $hpa;
        });
    }

    /**
     * Changer le prix de vente d'un article et historiser
     */
    public function changerPrixVente(Article $article, float $nouveauPrix, ?int $utilisateurId = null, ?string $description = null): HistoriquePrixVente
    {
        return DB::transaction(function () use ($article, $nouveauPrix, $utilisateurId, $description) {
            $article->update(['prixVente' => $nouveauPrix]);

            $hpv = HistoriquePrixVente::create([
                'article_id' => $article->id,
                'valeur' => $nouveauPrix,
            ]);

            Historique::create([
                'utilisateur_id' => $utilisateurId,
                'type_mouvement' => 'ajustement',
                'prix_vente_id' => $hpv->id,
                'description' => $description,
            ]);

            return $hpv;
        });
    }
}
