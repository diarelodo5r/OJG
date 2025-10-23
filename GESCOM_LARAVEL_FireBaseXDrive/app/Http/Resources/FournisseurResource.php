<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FournisseurResource extends JsonResource
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
            'prixArticle' => (float) $this->prixArticle,
            'nom' => $this->nom,
            'telephone' => $this->telephone ?: null,
            'adresse' => $this->adresse ?: null,
            'description' => $this->description ?: null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Inclure l'article si chargé
            'article' => $this->whenLoaded('article', function() {
                return new ArticleResource($this->article);
            }),
        ];
    }
}
