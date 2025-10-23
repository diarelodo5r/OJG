export interface Stock {
  id: number;
  article_id: number;
  fournisseur_id?: number | null;
  lot?: string | null;
  reference?: string | null;
  quantite: number;
  prix_unitaire: number; // Prix unitaire XOF
  montant: number; // total XOF (quantite * prix_unitaire)
  etat: number; // 1..100
  date_fabrication?: string | null; // YYYY-MM-DD
  date_peremption?: string | null; // YYYY-MM-DD
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface StoreStockDto {
  article_id: number;
  fournisseur_id?: number | null;
  lot?: string | null;
  reference?: string | null;
  quantite: number;
  prix_unitaire: number; // numeric
  date_fabrication?: string | null; // YYYY-MM-DD
  date_peremption?: string | null; // YYYY-MM-DD
  image_article?: File | null;
  description?: string | null;
}

/**
 * Interface pour l'article imbriqué
 */
export interface Article {
  id: number;
  famille_id: number;
  nom_article: string;
  image_article?: string | null;
  prixVente?: number | null;
  quantite_standard?: number | null;
  Conditionnement?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  famille?: Famille | null;
}

/**
 * Interface pour la famille imbriquée
 */
export interface Famille {
  id: number;
  nom_famille: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Interface pour le fournisseur imbriqué
 */
export interface Fournisseur {
  id: number;
  article_id?: number | null;
  prixArticle: string | number;
  nom: string;
  telephone?: string | null;
  adresse?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Interface enrichie avec les relations JOIN pour l'affichage
 */
export interface StockWithRelations extends Stock {
  article?: Article | null;
  fournisseur?: Fournisseur | null;
}
