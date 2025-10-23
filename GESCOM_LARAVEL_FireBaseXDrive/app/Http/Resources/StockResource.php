<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'article_id' => $this->article_id,
            'fournisseur_id' => $this->fournisseur_id,
            'lot' => $this->lot,
            'reference' => $this->reference,
            'quantite' => $this->quantite,
            'montant' => $this->montant,
            'date_fabrication' => $this->date_fabrication,
            'date_peremption' => $this->date_peremption,
            'etat' => $this->etat,
            'description' => $this->description,
            'etat_stock' => $this->etat_stock,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            
            // Inclure les relations si elles sont chargées
            'article' => $this->whenLoaded('article', function() {
                return new ArticleResource($this->article);
            }),
            'fournisseur' => $this->whenLoaded('fournisseur', function() {
                return new FournisseurResource($this->fournisseur);
            }),
        ];
    }
}
