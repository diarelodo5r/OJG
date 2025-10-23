export interface Article {
  id: number;
  famille_id: number;
  nom_article: string;
  quantite_standard: number;
  conditionnement?: string | null;
  prixVente?: number | null; // XOF (backend uses prixVente)
  image_article?: string | null; // Path to image file
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Relations
  famille?: any; // Can be expanded with Famille interface if needed
}
