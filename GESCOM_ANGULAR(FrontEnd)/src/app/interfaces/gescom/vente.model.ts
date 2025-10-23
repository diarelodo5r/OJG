import { Client } from "./client.model";
import { Stock } from "./stock.model";

/**
 * Interface Vente avec tous les snapshots créés par le contrôleur
 * Correspond à la structure créée dans VenteController::store()
 */
export interface Vente {
  id: number;
  stock_id: number;
  client_id: number;
  quantite: number;
  montant: number; // total XOF
  
  // Snapshots créés automatiquement par le contrôleur
  nom_article_snapshot: string;
  nom_famille_snapshot: string;
  prix_vente_snapshot: number; // XOF
  prix_achat_snapshot?: number | null; // XOF
  nom_fournisseur_snapshot?: string | null;
  lot_snapshot?: string | null;
  reference_snapshot?: string | null;
  conditionnement_snapshot?: string | null;
  image_article_snapshot?: string | null;
  
  description?: string | null;
  created_at?: string;
  updated_at?: string;

  // Relations (eager loaded par le contrôleur)
  stock?: Stock;
  client?: Client;
}

/**
 * DTO pour créer une vente
 * Correspond à la validation dans VenteController::store()
 */
export interface StoreVenteDto {
  stock_id: number;           // required|exists:stock,id
  client_id: number;          // required|exists:clients,id
  quantite: number;           // required|integer|min:1
  montant: number;            // required|numeric|min:0
  description?: string | null; // nullable|string
}

/**
 * Réponse API pour la création d'une seule vente
 * Correspond à VenteController::store() response
 */
export interface VenteApiResponse {
  success: boolean;
  message: string;
  data: Vente;
}

/**
 * Réponse API pour la création de ventes en lot
 * Correspond à VenteController::storeBatch() response
 */
export interface VenteBatchApiResponse {
  success: boolean;
  message: string;
  data: Vente[];
  trace?: string | null; // Présent uniquement en mode debug
}
