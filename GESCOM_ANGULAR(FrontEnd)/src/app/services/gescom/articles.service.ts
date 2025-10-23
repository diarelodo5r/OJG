import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environment';
import { Article } from '../../interfaces/gescom/article.model';
import { LaravelPaginatedResponse } from '../../interfaces/gescom/pagination.model';

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private readonly api = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère une liste paginée d'articles avec filtres
   */
  paginate(params?: { page?: number; per_page?: number; search?: string; famille_id?: number }): Observable<LaravelPaginatedResponse<Article>> {
    const httpParams = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<LaravelPaginatedResponse<Article>>(`${this.api}/articles`, { params: httpParams });
  }

  /**
   * Récupère tous les articles (sans pagination)
   */
  all(): Observable<Article[]> {
    return this.http.get<{ data?: Article[] } | Article[]>(`${this.api}/articles`, { params: { per_page: 1000 } as any })
      .pipe(map((res: any) => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  /**
   * Récupère un article spécifique avec ses relations
   */
  find(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.api}/articles/${id}`);
  }

  /**
   * Crée un nouvel article
   */
  create(payload: Partial<Article>): Observable<Article> {
    return this.http.post<Article>(`${this.api}/articles`, payload);
  }

  /**
   * Met à jour un article existant
   */
  update(id: number, payload: Partial<Article>): Observable<Article> {
    return this.http.put<Article>(`${this.api}/articles/${id}`, payload);
  }

  /**
   * Supprime un article (soft delete)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/articles/${id}`);
  }

  /**
   * Upload une photo pour un article en deux étapes:
   * 1. Upload le fichier vers l'endpoint temporaire
   * 2. Enregistre le chemin retourné dans la base de données
   * @param articleId ID de l'article
   * @param file Fichier image à uploader
   * @returns Observable avec les informations du fichier uploadé (chemin d'enregistrement)
   */
  uploadPhoto(articleId: number, file: File): Observable<{ message: string; path: string }> {
    // Étape 1: Upload vers endpoint temporaire
    const formData = new FormData();
    formData.append('image', file);
    
    return this.http.post<{ message: string; path: string; filename: string }>(
      `${this.api}/upload/temp/article`,
      formData
    ).pipe(
      switchMap((tempUploadResult) => {
        // Étape 2: Enregistrer le chemin dans la base de données
        return this.uploadPhotoByPath(articleId, tempUploadResult.path);
      })
    );
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

  /**
   * Upload une photo pour un article en envoyant le chemin du fichier
   * @param articleId ID de l'article
   * @param filePath Chemin complet du fichier sur le disque
   * @returns Observable avec les informations du fichier uploadé
   */
  uploadPhotoByPath(articleId: number, filePath: string): Observable<{ message: string; path: string }> {
    return this.http.post<{ message: string; path: string }>(
      `${this.api}/articles/${articleId}/photo`,
      { path: filePath }
    );
  }

  /**
   * Récupère l'URL complète de la photo d'un article
   * @param articleId ID de l'article
   * @returns URL de la photo ou chemin par défaut
   */
  getPhotoUrl(articleId: number): string {
    return `${this.api}/articles/${articleId}/photo`;
  }

  /**
   * Récupère la photo d'un article comme Blob
   * @param articleId ID de l'article
   * @returns Observable<Blob> de l'image
   */
  getPhoto(articleId: number): Observable<Blob> {
    return this.http.get(`${this.api}/articles/${articleId}/photo`, { responseType: 'blob' });
  }

  /**
   * Supprime la photo d'un article
   * @param articleId ID de l'article
   * @returns Observable avec le message de confirmation
   */
  deletePhoto(articleId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/articles/${articleId}/photo`);
  }

  /**
   * Construit l'URL de l'image d'un article à partir du chemin stocké
   * @param imageArticle Chemin de l'image (peut être null/undefined)
   * @param defaultImage Image par défaut si aucune image n'existe
   * @returns URL complète de l'image ou image par défaut
   */
  buildImageUrl(imageArticle: string | null | undefined, defaultImage: string = 'assets/images/products/Product.png'): string {
    if (!imageArticle) return defaultImage;
    
    // Si l'URL est déjà complète (http/https) ou relative (assets/)
    if (imageArticle.startsWith('http') || imageArticle.startsWith('assets/')) {
      return imageArticle;
    }
    
    // Sinon, construire l'URL complète avec l'API base
    // Le backend retourne le chemin complet Windows, donc on utilise l'endpoint /photo
    const articleId = this.extractArticleIdFromPath(imageArticle);
    if (articleId) {
      return this.getPhotoUrl(articleId);
    }
    
    return defaultImage;
  }

  /**
   * Extrait l'ID de l'article à partir du nom de fichier
   * Format attendu: article_{id}_{timestamp}_{random}.ext
   * @param filePath Chemin complet du fichier
   * @returns ID de l'article ou null si non trouvé
   */
  private extractArticleIdFromPath(filePath: string): number | null {
    const match = filePath.match(/article_(\d+)_/);
    return match ? parseInt(match[1], 10) : null;
  }
}
