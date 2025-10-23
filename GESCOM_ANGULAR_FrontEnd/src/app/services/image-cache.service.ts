import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs';

/**
 * Service de gestion du cache d'images avec conversion Blob vers ObjectURL
 * Récupère les images depuis le backend et les met en cache pour éviter les requêtes répétées
 */
@Injectable({ providedIn: 'root' })
export class ImageCacheService {
  private cache = new Map<string, string>(); // URL -> ObjectURL
  private pendingRequests = new Map<string, Observable<string>>(); // URL -> Observable en cours

  constructor(private http: HttpClient) {}

  /**
   * Récupère une image depuis l'URL fournie et la convertit en ObjectURL
   * Utilise le cache si l'image a déjà été récupérée
   * @param imageUrl URL de l'image à récupérer
   * @param defaultImage Image par défaut en cas d'erreur
   * @returns Observable<string> contenant l'ObjectURL ou l'image par défaut
   */
  getImage(imageUrl: string, defaultImage: string): Observable<string> {
    // Si l'URL est déjà une image locale (assets), la retourner directement
    if (imageUrl.startsWith('assets/')) {
      return of(imageUrl);
    }

    // Vérifier si l'image est dans le cache
    if (this.cache.has(imageUrl)) {
      return of(this.cache.get(imageUrl)!);
    }

    // Vérifier si une requête est déjà en cours pour cette URL
    if (this.pendingRequests.has(imageUrl)) {
      return this.pendingRequests.get(imageUrl)!;
    }

    // Créer une nouvelle requête
    const request$ = this.http.get(imageUrl, { responseType: 'blob' }).pipe(
      map((blob: Blob) => {
        // Convertir le Blob en ObjectURL
        const objectUrl = URL.createObjectURL(blob);
        // Mettre en cache
        this.cache.set(imageUrl, objectUrl);
        return objectUrl;
      }),
      catchError((error) => {
        console.warn(`Erreur lors du chargement de l'image ${imageUrl}:`, error);
        // Retourner l'image par défaut en cas d'erreur
        return of(defaultImage);
      }),
      shareReplay(1) // Partager le résultat entre tous les abonnés
    );

    // Stocker la requête en cours
    this.pendingRequests.set(imageUrl, request$);

    // Nettoyer la requête en cours une fois terminée
    request$.subscribe({
      complete: () => {
        this.pendingRequests.delete(imageUrl);
      },
      error: () => {
        this.pendingRequests.delete(imageUrl);
      }
    });

    return request$;
  }

  /**
   * Récupère une image de manière synchrone (si elle est en cache)
   * Sinon retourne l'image par défaut
   * @param imageUrl URL de l'image
   * @param defaultImage Image par défaut
   * @returns ObjectURL de l'image ou image par défaut
   */
  getImageSync(imageUrl: string, defaultImage: string): string {
    if (imageUrl.startsWith('assets/')) {
      return imageUrl;
    }
    return this.cache.get(imageUrl) || defaultImage;
  }

  /**
   * Précharge une liste d'images en parallèle
   * Utile pour charger toutes les images d'une table en une seule fois
   * @param imageUrls Liste des URLs d'images à précharger
   * @param defaultImage Image par défaut
   */
  preloadImages(imageUrls: string[], defaultImage: string): void {
    imageUrls.forEach(url => {
      if (!this.cache.has(url) && !url.startsWith('assets/')) {
        this.getImage(url, defaultImage).subscribe();
      }
    });
  }

  /**
   * Vide le cache (utile lors du logout ou refresh)
   */
  clearCache(): void {
    // Révoquer tous les ObjectURLs pour libérer la mémoire
    this.cache.forEach(objectUrl => {
      if (objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    });
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Supprime une image spécifique du cache
   * @param imageUrl URL de l'image à supprimer du cache
   */
  removeFromCache(imageUrl: string): void {
    const objectUrl = this.cache.get(imageUrl);
    if (objectUrl && objectUrl.startsWith('blob:')) {
      URL.revokeObjectURL(objectUrl);
    }
    this.cache.delete(imageUrl);
  }

  /**
   * Recharge une image en forçant une nouvelle requête
   * @param imageUrl URL de l'image à recharger
   * @param defaultImage Image par défaut
   * @returns Observable<string> contenant l'ObjectURL
   */
  reloadImage(imageUrl: string, defaultImage: string): Observable<string> {
    this.removeFromCache(imageUrl);
    return this.getImage(imageUrl, defaultImage);
  }
}
