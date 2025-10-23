import { Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { ArticlesService } from './articles.service';
import { FamillesService } from './familles.service';
import { FournisseursService } from './fournisseurs.service';
import { StockService } from './stock.service';
import { Article } from '../../interfaces/gescom/article.model';
import { Fournisseur } from '../../interfaces/gescom/fournisseur.model';
import { Stock } from '../../interfaces/gescom/stock.model';

export interface CreateFullStockInput {
  // toggles
  useNewFamily: boolean;
  useNewArticle: boolean;
  creatingSupplier: boolean;

  // values (subset of the form)
  famille_id: number | null;
  nouv_famille?: string | null;

  article_id: number | null;
  nouv_article?: string | null;
  quantite_standard?: number | null;
  conditionnement?: string | null;
  description?: string | null;

  fournisseur_id: number | null;
  new_fournisseur?: { nom?: string | null; telephone?: string | null; adresse?: string | null };

  lot?: string | null;
  reference?: string | null;
  quantite: number;
  prix_unitaire: number;
  date_fabrication?: string | null;
  date_peremption?: string | null;

  montant?: number | null; // optional override
  etat?: number | null; // optional computed state

  image_file?: File | null;
}

@Injectable({ providedIn: 'root' })
export class StockOrchestratorService {
  constructor(
    private readonly articles: ArticlesService,
    private readonly familles: FamillesService,
    private readonly fournisseurs: FournisseursService,
    private readonly stock: StockService,
  ) {}

  private ensureFamille(useNewFamily: boolean, familleId: number | null, nouv_famille?: string | null): Observable<number | null> {
    if (!useNewFamily) return of(familleId != null ? Number(familleId) : null);
    const name = (nouv_famille || '').trim();
    if (!name) return of(null);
    return this.familles.create({ nom_famille: name } as any).pipe(map((f: any) => Number(f.id)));
  }

  private ensureArticle(
    useNewArticle: boolean, 
    payload: { 
      article_id: number | null; 
      nom_article?: string | null; 
      famille_id?: number | null; 
      quantite_standard?: number | null; 
      conditionnement?: string | null; 
      description?: string | null;
      image_file?: File | null;
    }
  ): Observable<number> {
    if (!useNewArticle) return of(Number(payload.article_id!));
    const name = (payload.nom_article || '').trim();
    const qs = payload.quantite_standard != null ? Number(payload.quantite_standard) : 10;
    const cond = payload.conditionnement || undefined;
    const famId = payload.famille_id != null ? Number(payload.famille_id) : undefined;
    const body: Partial<Article> = {
      nom_article: name,
      famille_id: famId,
      quantite_standard: qs,
      conditionnement: cond,
      description: payload.description || undefined,
      prixVente: 0,
    } as any;
    
    return this.articles.create(body).pipe(
      switchMap((article) => {
        const articleId = Number(article.id);
        // Si un fichier image est fourni, l'uploader et mettre à jour l'article
        if (payload.image_file) {
          return this.articles.uploadPhoto(articleId, payload.image_file).pipe(
            switchMap((uploadResult) => {
              // Mettre à jour l'article avec le chemin de l'image
              return this.articles.update(articleId, { image_article: uploadResult.path }).pipe(
                map(() => articleId)
              );
            })
          );
        }
        return of(articleId);
      })
    );
  }

  private ensureFournisseur(
    creatingSupplier: boolean,
    fournisseur_id: number | null,
    newSupplier: { nom?: string | null; telephone?: string | null; adresse?: string | null } | undefined,
    articleIdForSupplier: number,
    prixArticle?: number,
  ): Observable<number | null> {
    if (!creatingSupplier) return of(fournisseur_id != null ? Number(fournisseur_id) : null);
    const nom = (newSupplier?.nom || '').trim();
    if (!nom) return of(fournisseur_id != null ? Number(fournisseur_id) : null);
    const body: Partial<Fournisseur> = {
      nom,
      telephone: newSupplier?.telephone || undefined,
      adresse: newSupplier?.adresse || undefined,
    };
    // Some backends require binding supplier to article with a price on creation
    (body as any).article_id = articleIdForSupplier;
    if (typeof prixArticle === 'number') (body as any).prixArticle = prixArticle;
    return this.fournisseurs.create(body).pipe(map((f) => Number(f.id)));
  }

  createFullStock(input: CreateFullStockInput): Observable<Stock> {
    return this.ensureFamille(input.useNewFamily, input.famille_id, input.nouv_famille).pipe(
      switchMap((familleId) =>
        this.ensureArticle(input.useNewArticle, {
          article_id: input.article_id,
          nom_article: input.nouv_article,
          famille_id: familleId ?? input.famille_id ?? undefined,
          quantite_standard: input.quantite_standard ?? undefined,
          conditionnement: input.conditionnement ?? undefined,
          description: input.description ?? undefined,
          image_file: input.image_file ?? undefined,
        }).pipe(
          switchMap((articleId) =>
            this.ensureFournisseur(
              input.creatingSupplier,
              input.fournisseur_id,
              input.new_fournisseur,
              Number(articleId),
              typeof input.prix_unitaire === 'number' ? Number(input.prix_unitaire) : undefined,
            ).pipe(
              switchMap((supplierId) => {
                const dto: any = {
                  article_id: Number(articleId),
                  fournisseur_id: supplierId != null ? Number(supplierId) : undefined,
                  lot: input.lot || undefined,
                  reference: input.reference || undefined,
                  quantite: Number(input.quantite),
                  prix_unitaire: Number(input.prix_unitaire),
                  date_fabrication: input.date_fabrication || undefined,
                  date_peremption: input.date_peremption || undefined,
                  description: input.description || undefined,
                };
                if (input.montant != null) dto.montant = Number(input.montant);
                if (input.etat != null) dto.etat = Number(input.etat);
                // L'image a déjà été uploadée via ensureArticle, pas besoin de la passer ici
                return this.stock.create(dto);
              })
            )
          )
        )
      )
    );
  }
}
