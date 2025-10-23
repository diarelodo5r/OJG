import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { environment } from '../../environment';
import { Stock, StoreStockDto, StockWithRelations } from '../../interfaces/gescom/stock.model';
import { LaravelPaginatedResponse } from '../../interfaces/gescom/pagination.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly api = `${environment.apiBaseUrl}`;
  private readonly web = `${environment.webBaseUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère une liste paginée de stocks avec relations imbriquées
   * @param params Paramètres de pagination et filtres
   */
  paginate(params?: { page?: number; per_page?: number }): Observable<LaravelPaginatedResponse<StockWithRelations>> {
    // Inclure les relations imbriquées (article avec famille, et fournisseur)
    const queryParams = { ...params, with: 'article.famille,fournisseur' };
    const httpParams = new HttpParams({ fromObject: queryParams as any });
    return this.http.get<LaravelPaginatedResponse<StockWithRelations>>(`${this.api}/stocks`, { params: httpParams });
  }

  /**
   * Récupère un stock spécifique avec ses relations
   * @param id ID du stock
   */
  find(id: number): Observable<StockWithRelations> {
    // Inclure les relations imbriquées pour une seule ressource
    const httpParams = new HttpParams({ fromObject: { with: 'article.famille,fournisseur' } });
    return this.http.get<StockWithRelations>(`${this.api}/stocks/${id}`, { params: httpParams });
  }

  /**
   * Crée une nouvelle entrée de stock
   * @param dto Données du stock à créer
   */
  create(dto: StoreStockDto): Observable<Stock> {
    const form = new FormData();
    form.append('article_id', String(dto.article_id));
    if (dto.fournisseur_id != null) form.append('fournisseur_id', String(dto.fournisseur_id));
    if (dto.lot) form.append('lot', dto.lot);
    if (dto.reference) form.append('reference', dto.reference);
    form.append('quantite', String(dto.quantite));
    form.append('prix_unitaire', String(dto.prix_unitaire));
    if ((dto as any).montant != null) form.append('montant', String((dto as any).montant));
    if ((dto as any).etat != null) {
      const etatVal = String((dto as any).etat);
      form.append('etat', etatVal);
      // Backend alias compatibility
      form.append('etat_precis', etatVal);
    }
    if (dto.date_fabrication) form.append('date_fabrication', dto.date_fabrication);
    if (dto.date_peremption) form.append('date_peremption', dto.date_peremption);
    if (dto.image_article) form.append('image_article', dto.image_article);
    if (dto.description) form.append('description', dto.description);
    // Use API route for create to leverage API CORS middleware
    return this.http.post<Stock>(`${this.api}/stocks`, form);
  }

  /**
   * Met à jour partiellement un stock existant
   * @param id ID du stock
   * @param changes Modifications à appliquer
   */
  update(id: number, changes: Partial<Stock>): Observable<Stock> {  
    // Use PATCH for partial updates
    return this.http.patch<Stock>(`${this.api}/stocks/${id}`, changes);
  }

  /**
   * Supprime un stock (soft delete)
   * @param id ID du stock à supprimer
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/stocks/${id}`);
  }

  /**
   * Supprime plusieurs stocks en parallèle
   * @param ids Liste des IDs à supprimer
   */
  deleteMany(ids: number[]): Observable<void[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }
    return forkJoin(ids.map((id) => this.delete(id)));
  }

  /**
   * Exporte les données de stock
   * @param params Paramètres d'export (filtres, format, etc.)
   */
  export(params: any): Observable<Blob> {
    return this.http.post(`${this.web}/stocks/export`, params, { responseType: 'blob' });
  }

  /**
   * Construit l'URL de l'image d'un article depuis un objet Stock
   * @param stock Objet stock avec relation article
   * @param defaultImage Image par défaut
   * @returns URL de l'image ou image par défaut
   */
  getArticleImageUrl(stock: StockWithRelations, defaultImage: string = 'assets/images/products/Product.png'): string {
    const imageArticle = stock.article?.image_article;
    if (!imageArticle) return defaultImage;
    
    // Si l'URL est déjà complète (http/https) ou relative (assets/)
    if (imageArticle.startsWith('http') || imageArticle.startsWith('assets/')) {
      return imageArticle;
    }
    
    // Sinon, utiliser l'endpoint API pour récupérer la photo
    if (stock.article?.id) {
      return `${this.api}/articles/${stock.article.id}/photo`;
    }
    
    return defaultImage;
  }

  /**
   * Vérifie si un produit est périmé
   * @param datePeremption Date de péremption (format YYYY-MM-DD)
   * @returns true si le produit est périmé
   */
  isExpired(datePeremption: string | null | undefined): boolean {
    if (!datePeremption) return false;
    return new Date(datePeremption) < new Date();
  }

  /**
   * Retourne la classe CSS pour le badge d'état
   * @param etat État du stock (0-100)
   * @returns Classe CSS Bootstrap
   */
  getEtatBadgeClass(etat: number): string {
    if (etat >= 75) return 'bg-success';
    if (etat >= 50) return 'bg-primary';
    if (etat >= 25) return 'bg-warning text-dark';
    return 'bg-danger';
  }

  /**
   * Retourne la classe CSS pour la date de péremption
   * @param datePeremption Date de péremption
   * @returns Classe CSS pour indiquer l'urgence
   */
  getPeremptionClass(datePeremption: string | null | undefined): string {
    if (!datePeremption) return '';
    const date = new Date(datePeremption);
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    if (date < now) return 'text-danger fw-bold';
    if (date <= sixMonthsFromNow) return 'text-warning fw-bold';
    return '';
  }

  /**
   * Formate un prix en XOF (Franc CFA)
   * @param price Prix à formater
   * @returns Prix formaté avec la devise
   */
  formatPrice(price: number | string | null | undefined): string {
    if (price == null) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(numPrice) + ' CFA';
  }

  /**
   * Formate le prix de façon simplifiée (K, M, B)
   * @param price Prix à formater
   * @returns Prix formaté simplifié
   */
  formatPriceShort(price: number | string | null | undefined): string {
    if (price == null) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';

    const absPrice = Math.abs(numPrice);
    
    if (absPrice >= 1_000_000_000) {
      return (numPrice / 1_000_000_000).toFixed(1) + 'B CFA';
    } else if (absPrice >= 1_000_000) {
      return (numPrice / 1_000_000).toFixed(1) + 'M CFA';
    } else if (absPrice >= 1_000) {
      return (numPrice / 1_000).toFixed(1) + 'K CFA';
    } else {
      return numPrice.toFixed(0) + ' CFA';
    }
  }
}
