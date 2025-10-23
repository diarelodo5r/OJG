import { Article } from './article.model';

export interface Fournisseur {
  id: number;
  nom: string;
  telephone?: string | null;
  adresse?: string | null;
  description?: string | null;
  article_id?: number | null;
  prixArticle?: number | null; // XOF (prix d'achat)
  created_at?: string;
  updated_at?: string;
  
  // Relations
  article?: Article;
}
