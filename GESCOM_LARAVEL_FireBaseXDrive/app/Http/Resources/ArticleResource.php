<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Convertir le chemin de l'image en URL accessible
        $imageUrl = null;
        if ($this->image_article) {
            // Si c'est un chemin absolu Windows, extraire le nom du fichier
            if (strpos($this->image_article, 'C:\\') === 0 || strpos($this->image_article, 'storage\\app') !== false) {
                $filename = basename($this->image_article);
                $imageUrl = url('storage/articles/' . $filename);
            } else {
                $imageUrl = url($this->image_article);
            }
        }

        return [
            'id' => $this->id,
            'famille_id' => $this->famille_id,
            'nom_article' => $this->nom_article,
            'image_article' => $imageUrl,
            'prixVente' => $this->prixVente ? (float) $this->prixVente : null,
            'quantite_standard' => $this->quantite_standard,
            'conditionnement' => $this->Conditionnement ?: null,
            'description' => $this->description ?: null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Inclure la famille si elle est chargée
            'famille' => $this->whenLoaded('famille', function() {
                return new FamilleResource($this->famille);
            }),
        ];
    }
}
