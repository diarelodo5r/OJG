import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environment';

export interface Utilisateur {
  id?: number;
  nom: string;
  mot_de_passe?: string;
  role?: string | null;
  email?: string | null;
  description?: string | null;
  adresse?: string | null;
  sexe?: string | null;
  telephone?: string | null;
  photo?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface LaravelPaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

@Injectable({ providedIn: 'root' })
export class UtilisateursService {
  private readonly api = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère une liste paginée d'utilisateurs avec filtres
   */
  paginate(params?: { page?: number; per_page?: number; search?: string }): Observable<LaravelPaginatedResponse<Utilisateur>> {
    const httpParams = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<LaravelPaginatedResponse<Utilisateur>>(`${this.api}/utilisateurs`, { params: httpParams });
  }

  /**
   * Récupère tous les utilisateurs (sans pagination)
   */
  all(): Observable<Utilisateur[]> {
    return this.http.get<{ data?: Utilisateur[] } | Utilisateur[]>(`${this.api}/utilisateurs`, { params: { per_page: 1000 } as any })
      .pipe(map((res: any) => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  /**
   * Récupère un utilisateur spécifique
   */
  find(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.api}/utilisateurs/${id}`);
  }

  /**
   * Crée un nouvel utilisateur
   */
  create(payload: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.api}/utilisateurs`, payload);
  }

  /**
   * Met à jour un utilisateur existant
   */
  update(id: number, payload: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.api}/utilisateurs/${id}`, payload);
  }

  /**
   * Supprime un utilisateur (soft delete)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/utilisateurs/${id}`);
  }

  /**
   * Upload une photo pour un utilisateur en deux étapes:
   * 1. Upload le fichier vers l'endpoint temporaire
   * 2. Enregistre le chemin retourné dans la base de données
   * @param utilisateurId ID de l'utilisateur
   * @param file Fichier image à uploader
   * @returns Observable avec les informations du fichier uploadé (chemin d'enregistrement)
   */
  uploadPhoto(utilisateurId: number, file: File): Observable<{ message: string; path: string }> {
    // Étape 1: Upload vers endpoint temporaire
    const formData = new FormData();
    formData.append('image', file);
    
    return this.http.post<{ message: string; path: string; filename: string }>(
      `${this.api}/upload/temp/utilisateur`,
      formData
    ).pipe(
      switchMap((tempUploadResult) => {
        // Étape 2: Enregistrer le chemin dans la base de données
        return this.uploadPhotoByPath(utilisateurId, tempUploadResult.path);
      })
    );
  }

  /**
   * Upload une photo pour un utilisateur en envoyant le chemin du fichier
   * @param utilisateurId ID de l'utilisateur
   * @param filePath Chemin complet du fichier sur le disque
   * @returns Observable avec les informations du fichier uploadé
   */
  uploadPhotoByPath(utilisateurId: number, filePath: string): Observable<{ message: string; path: string }> {
    return this.http.post<{ message: string; path: string }>(
      `${this.api}/utilisateurs/${utilisateurId}/photo`,
      { path: filePath }
    );
  }

  /**
   * Récupère l'URL complète de la photo d'un utilisateur
   * @param utilisateurId ID de l'utilisateur
   * @returns URL de la photo
   */
  getPhotoUrl(utilisateurId: number): string {
    return `${this.api}/utilisateurs/${utilisateurId}/photo`;
  }

  /**
   * Récupère la photo d'un utilisateur comme Blob
   * @param utilisateurId ID de l'utilisateur
   * @returns Observable<Blob> de l'image
   */
  getPhoto(utilisateurId: number): Observable<Blob> {
    return this.http.get(`${this.api}/utilisateurs/${utilisateurId}/photo`, { responseType: 'blob' });
  }

  /**
   * Supprime la photo d'un utilisateur
   * @param utilisateurId ID de l'utilisateur
   * @returns Observable avec le message de confirmation
   */
  deletePhoto(utilisateurId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/utilisateurs/${utilisateurId}/photo`);
  }

  /**
   * Construit l'URL de l'image d'un utilisateur à partir du chemin stocké
   * @param photo Chemin de la photo (peut être null/undefined)
   * @param defaultImage Image par défaut si aucune image n'existe
   * @returns URL complète de l'image ou image par défaut
   */
  buildImageUrl(photo: string | null | undefined, defaultImage: string = 'assets/images/profile/user-1.jpg'): string {
    if (!photo) return defaultImage;
    
    // Si l'URL est déjà complète (http/https) ou relative (assets/)
    if (photo.startsWith('http') || photo.startsWith('assets/')) {
      return photo;
    }
    
    // Sinon, construire l'URL complète avec l'API base
    // Le backend retourne le chemin complet Windows, donc on utilise l'endpoint /photo
    const utilisateurId = this.extractUtilisateurIdFromPath(photo);
    if (utilisateurId) {
      return this.getPhotoUrl(utilisateurId);
    }
    
    return defaultImage;
  }

  /**
   * Extrait l'ID de l'utilisateur à partir du nom de fichier
   * Format attendu: utilisateur_{id}_{timestamp}_{random}.ext
   * @param filePath Chemin complet du fichier
   * @returns ID de l'utilisateur ou null si non trouvé
   */
  private extractUtilisateurIdFromPath(filePath: string): number | null {
    const match = filePath.match(/utilisateur_(\d+)_/);
    return match ? parseInt(match[1], 10) : null;
  }
}
