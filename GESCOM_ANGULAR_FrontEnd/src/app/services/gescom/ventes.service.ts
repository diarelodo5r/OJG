import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of, map } from 'rxjs';
import { concatMap, toArray } from 'rxjs/operators';
import { environment } from '../../environment';
import { Vente, StoreVenteDto, VenteApiResponse, VenteBatchApiResponse } from '../../interfaces/gescom/vente.model';
import { LaravelPaginatedResponse } from '../../interfaces/gescom/pagination.model';

@Injectable({ providedIn: 'root' })
export class VentesService {
  private readonly api = `${environment.apiBaseUrl}`;
  private readonly web = `${environment.webBaseUrl}`;

  constructor(private http: HttpClient) {}

  paginate(params?: { page?: number; per_page?: number }): Observable<LaravelPaginatedResponse<Vente>> {
    const httpParams = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<LaravelPaginatedResponse<Vente>>(`${this.api}/ventes`, { params: httpParams });
  }

  /**
   * Récupère TOUTES les ventes sans limite de pagination
   */
  all(): Observable<Vente[]> {
      return this.http.get<{ data?: Vente[] } | Vente[]>(`${this.api}/ventes`, { params: { per_page: 10000 } as any })
        .pipe(map((res: any) => (Array.isArray(res) ? res : res?.data ?? [])));
  }

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

  index(): Observable<Vente[]> {
    return this.http.get<Vente[]>(`${this.api}/ventes` as string);
  }

  /**
   * Enregistrer une seule vente avec déstockage automatique
   * Correspond à VenteController::store()
   */
  create(dto: StoreVenteDto): Observable<VenteApiResponse> {
    return this.http.post<VenteApiResponse>(`${this.api}/ventes`, dto);
  }

  /**
   * Enregistrer plusieurs ventes en lot avec déstockage automatique
   * Correspond à VenteController::storeBatch()
   * Plus performant que createMany car traite tout en une seule requête
   */
  createBatch(dtos: StoreVenteDto[]): Observable<VenteBatchApiResponse> {
    if (!dtos.length) {
      return of({ success: true, message: 'Aucune vente à enregistrer', data: [] });
    }
    return this.http.post<VenteBatchApiResponse>(`${this.api}/ventes/batch`, { ventes: dtos });
  }

  /**
   * @deprecated Utiliser createBatch() pour de meilleures performances
   * Cette méthode fait plusieurs requêtes séquentielles
   */
  createMany(dtos: StoreVenteDto[]): Observable<Vente[]> {
    if (!dtos.length) {
      return of([]);
    }
    return from(dtos).pipe(
      concatMap((dto) => this.create(dto).pipe(map(response => response.data))),
      toArray()
    );
  }

  /**
   * Afficher une vente spécifique
   * Correspond à VenteController::show()
   */
  show(id: number): Observable<Vente> {
    return this.http.get<Vente>(`${this.api}/ventes/${id}`);
  }

  /**
   * Mettre à jour une vente
   * Correspond à VenteController::update()
   */
  update(id: number, data: Partial<StoreVenteDto>): Observable<Vente> {
    return this.http.put<Vente>(`${this.api}/ventes/${id}`, data);
  }

  export(params: any): Observable<Blob> {
    return this.http.post(`${this.web}/ventes/export`, params, { responseType: 'blob' });
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/ventes/${id}`);
  }
}
