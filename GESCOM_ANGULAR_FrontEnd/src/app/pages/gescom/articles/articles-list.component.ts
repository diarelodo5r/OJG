import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { ArticlesService } from '../../../services/gescom/articles.service';
import { FamillesService } from '../../../services/gescom/familles.service';
import { FournisseursService } from '../../../services/gescom/fournisseurs.service';
import { Article } from '../../../interfaces/gescom/article.model';
import { NotifyService } from '../../../services/notify.service';
import { environment } from '../../../environment';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { GenericTableComponent, GenericTableColumn, GenericColumnType, ColumnTemplateDirective } from '../../ui-components/tables/generic-table.component';
import { MatDialog } from '@angular/material/dialog';
import { EditEntityDialogComponent, EditFieldConfig } from '../../ui-components/tables/edit-entity-dialog.component';
import { ImagePreviewDialogComponent } from '../../ui-components/image-preview-dialog.component';
import { ImageCacheService } from '../../../services/image-cache.service';

@Component({
  standalone: true,
  selector: 'app-articles-list',
  templateUrl: './articles-list.component.html',
  imports: [CommonModule, MaterialModule, GenericTableComponent, ColumnTemplateDirective],
})
export class ArticlesListComponent {
  @ViewChild('articlesTable') table?: GenericTableComponent;

  defaultImage = 'assets/images/products/Product.png';
  apiUrl = environment.apiBaseUrl;
  
  // Cache des images converties en ObjectURL
  imageUrls = new Map<number, string>();
  rows: Article[] = [];

  articleColumns: GenericTableColumn[] = [
    { key: 'article', label: 'Article', type: 'custom' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'created_at', label: 'Créé le', type: 'date', dateFormat: 'short' },
    { key: 'prixVente', label: 'Prix (XOF)', type: 'number', align: 'end' },
    { key: 'quantite_standard', label: 'Qté std', type: 'number', align: 'end' },
    { key: 'updated_at', label: 'Modifié le', type: 'date', dateFormat: 'short' },
  ];
  articleFilters: Array<{ key: string; label: string; type?: GenericColumnType; dataPath?: string; filterPath?: string }> = [
    { 
      key: 'famille_id', 
      label: 'Famille', 
      type: 'select',
      dataPath: 'famille.nom_famille', // Afficher le nom de la famille
      filterPath: 'famille_id' // Filtrer par l'ID de la famille
    },
  ];

  constructor(
    private articles: ArticlesService,
    private familles: FamillesService,
    private fournisseurs: FournisseursService,
    private notify: NotifyService, 
    private dialog: MatDialog,
    private imageCache: ImageCacheService
  ) {}

  readonly dataLoader = () => this.articles.all();

  onRowsLoaded(rows: Article[]): void {
    this.rows = rows;
    this.preloadArticleImages(rows);
  }

  onRowsLoadError(error: unknown): void {
    console.error('Failed to load articles:', error);
    this.notify.error('Impossible de charger les articles');
  }

  refreshTable(): void {
    this.table?.reload();
  }

  deleteSelected(selection: Article[]): void {
    const sel = selection ?? [];
    if (!sel.length) return;
    this.notify.confirm({ title: 'Supprimer la sélection', text: `Supprimer ${sel.length} article(s) ?` }).then(res=>{
      if(!res.isConfirmed) return;
      const ids = sel
        .map((a: Article) => a.id)
        .filter((id): id is number => typeof id === 'number');
      if(!ids.length) return;
      forkJoin(ids.map((id: number) => this.articles.delete(id))).subscribe({
        complete: ()=>{ this.notify.successToast('Sélection supprimée'); this.refreshTable(); },
        error: (error: any)=> this.notify.error('Suppression impossible pour certains éléments')
      });
    });
  }

  delete(row: Article){ 
    if(!row.id) return; 
    this.notify.confirm({ title: 'Confirmer', text: 'Supprimer cet article ?' }).then(res=>{ 
      if(!res.isConfirmed) return; 
      this.articles.delete(row.id!).subscribe({ 
        next: ()=>{ 
          this.notify.success('Article supprimé'); 
          this.refreshTable(); 
        }, 
        error: (error: any)=> this.notify.error('Suppression impossible') 
      }); 
    });  
  }

  onDelete(payload: Article | Article[]){
    if (Array.isArray(payload)) {
      return this.deleteSelected(payload);
    }
    return this.delete(payload as Article);
  }

  archive(row: Article){ console.log('archive article', row.id); }

  openView(row: Article) {
    const fields: EditFieldConfig[] = [
      { key: 'nom_article', label: 'Article', type: 'text' },
      { key: 'prixVente', label: 'Prix (XOF)', type: 'number' },
      { key: 'quantite_standard', label: 'Qté standard', type: 'number' },
      { key: 'conditionnement', label: 'Conditionnement', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'created_at', label: 'Créé le', type: 'date' },
    ];

    this.dialog.open(EditEntityDialogComponent, {
      data: {
        title: 'Détails article', entity: 'Article', value: row, fields, readOnly: true,
        getImageUrl: (article: Article) => this.getArticleImageUrl(article),
        onSave: () => of(row)
      }, width: '600px', panelClass: 'dialog-dark-theme'
    });
  }

  openEdit(row: Article) {
    // Charger les familles et fournisseurs
    forkJoin({
      familles: this.familles.all(),
      fournisseurs: this.fournisseurs.all()
    }).subscribe(({ familles, fournisseurs }) => {
      
      // Trouver le fournisseur lié à cet article
      const fournisseurActuel = fournisseurs.find(f => f.article_id === row.id);
      const coutRevient = fournisseurActuel?.prixArticle || 0;
      let hasFournisseurWithPrice = !!(fournisseurActuel && fournisseurActuel.prixArticle != null && fournisseurActuel.prixArticle > 0);
      
      // Calculer la marge actuelle si un prix de vente existe
      let margeInitiale = 10; // Défaut 10%
      if (row.prixVente && coutRevient > 0) {
        margeInitiale = Math.round(((row.prixVente - coutRevient) / coutRevient) * 100 * 100) / 100;
      }

      const fields: EditFieldConfig[] = [
        // Section: Information Générale
        { 
          key: 'famille_id', 
          label: 'Famille', 
          type: 'select-create', 
          required: true,
          options: familles.map(f => ({ label: f.nom_famille, value: f.id })),
          allowCreate: true,
          createPrompt: 'Créer une nouvelle famille',
          onCreate: (nom: string) => this.familles.create({ nom_famille: nom })
        },
        { key: 'nom_article', label: 'Nom de l\'Article', type: 'text', required: true, placeholder: 'Entrez le nom de l\'article' },
        { key: 'conditionnement', label: 'Conditionnement', type: 'text', placeholder: 'Ex: Boîte de 12, Pack de 6...' },
        { key: 'quantite_standard', label: 'Quantité standard', type: 'number', min: 0, step: 1, required: true },
        { key: 'image_article', label: 'Image Article', type: 'image' },
        
        // Section: Options Avancées (Prix et Fournisseur)
        { 
          key: 'fournisseur_id', 
          label: 'Fournisseur', 
          type: 'select-create',
          options: fournisseurs.map(f => ({ label: f.nom, value: f.id })),
          allowCreate: true,
          createPrompt: 'Créer un nouveau fournisseur',
          onCreate: (nom: string) => {
            // Vérifier l'unicité du nom
            const existant = fournisseurs.find(f => f.nom.toLowerCase().trim() === nom.toLowerCase().trim());
            if (existant) {
              this.notify.error(`Le fournisseur "${nom}" existe déjà`);
              return of(null);
            }
            return this.fournisseurs.create({ nom });
          }
        },
        { 
          key: 'cout_revient', 
          label: hasFournisseurWithPrice ? `Coût de revient (XOF) - Géré par le fournisseur` : 'Coût de revient (XOF)', 
          type: 'number', 
          min: 0, 
          step: 0.01,
          placeholder: hasFournisseurWithPrice 
            ? `Prix actuel: ${coutRevient} XOF (Modifier dans Fournisseurs)` 
            : 'Prix d\'achat unitaire chez le fournisseur',
          required: !hasFournisseurWithPrice,
          disabled: hasFournisseurWithPrice,
        },
        { 
          key: 'marge_beneficiaire', 
          label: 'Marge Bénéficiaire (%)', 
          type: 'number', 
          min: 0, 
          max: 1000, 
          step: 0.1,
          placeholder: 'Marge en pourcentage'
        },
        { 
          key: 'benefice', 
          label: 'Bénéfice (XOF)', 
          type: 'number',
          disabled: true,
          calculated: true,
          calculate: (formValue) => {
            const cout = formValue.cout_revient || 0;
            const marge = formValue.marge_beneficiaire || 0;
            return Math.round(cout * (marge / 100) * 100) / 100;
          }
        },
        { 
          key: 'prixVente', 
          label: 'Prix de Vente (XOF)', 
          type: 'number',
          min: 0,
          step: 0.01,
          placeholder: 'Prix de vente final',
          // Le prix de vente peut être modifié manuellement ou calculé automatiquement
        },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Décrivez l\'article...' },
      ];

      // Préparer les valeurs initiales avec les champs calculés
      const initialValue = {
        ...row,
        fournisseur_id: fournisseurActuel?.id || null,
        cout_revient: coutRevient,
        marge_beneficiaire: margeInitiale,
        benefice: Math.round(coutRevient * (margeInitiale / 100) * 100) / 100
      };

      const ref = this.dialog.open(EditEntityDialogComponent, {
        data: {
          title: 'Modifier article',
          entity: 'Article',
          value: initialValue,
          fields,
          getImageUrl: (article: Article) => this.getArticleImageUrl(article),
          onFormChange: (form: any) => {
            // Vérifier le fournisseur sélectionné
            const fournisseurId = form.get('fournisseur_id')?.value;
            
            if (!fournisseurId) {
              // Aucun fournisseur sélectionné : activer le coût de revient
              hasFournisseurWithPrice = false;
              const coutField = fields.find(f => f.key === 'cout_revient');
              if (coutField) {
                coutField.disabled = false;
                coutField.required = true;
                coutField.label = 'Coût de revient (XOF)';
                coutField.placeholder = 'Prix d\'achat unitaire chez le fournisseur';
              }
            } else {
              // Vérifier si ce fournisseur a un prix pour cet article
              const fournisseurSelectionne = fournisseurs.find(f => f.id === fournisseurId && f.article_id === row.id);
              hasFournisseurWithPrice = !!(fournisseurSelectionne && fournisseurSelectionne.prixArticle != null && fournisseurSelectionne.prixArticle > 0);
              
              const coutField = fields.find(f => f.key === 'cout_revient');
              if (coutField) {
                if (hasFournisseurWithPrice) {
                  // Fournisseur avec prix : désactiver et afficher le prix
                  coutField.disabled = true;
                  coutField.required = false;
                  coutField.label = `Coût de revient (XOF) - Géré par le fournisseur`;
                  coutField.placeholder = `Prix actuel: ${fournisseurSelectionne!.prixArticle} XOF (Modifier dans Fournisseurs)`;
                  form.patchValue({ cout_revient: fournisseurSelectionne!.prixArticle }, { emitEvent: false });
                } else {
                  // Fournisseur sans prix : activer le coût de revient
                  coutField.disabled = false;
                  coutField.required = true;
                  coutField.label = 'Coût de revient (XOF)';
                  coutField.placeholder = 'Prix d\'achat unitaire chez le fournisseur';
                }
              }
            }
            
            // Gérer les calculs automatiques (marge, bénéfice, prix de vente)
            const cout = form.get('cout_revient')?.value || 0;
            const marge = form.get('marge_beneficiaire')?.value;
            const prixVente = form.get('prixVente')?.value;
            
            if (form.get('prixVente')?.dirty && prixVente && cout > 0) {
              // Prix de vente modifié → recalculer la marge
              const nouvelleMarge = Math.round(((prixVente - cout) / cout) * 100 * 100) / 100;
              if (marge !== nouvelleMarge) {
                form.get('marge_beneficiaire')?.setValue(nouvelleMarge, { emitEvent: false });
              }
            } else if (form.get('marge_beneficiaire')?.dirty && marge !== null && cout > 0) {
              // Marge modifiée → recalculer le prix de vente
              const nouveauPrix = Math.round((cout + (cout * (marge / 100))) * 100) / 100;
              if (prixVente !== nouveauPrix) {
                form.get('prixVente')?.setValue(nouveauPrix, { emitEvent: false });
              }
            }
            
            // Mettre à jour le bénéfice
            const benefice = Math.round(cout * ((marge || 0) / 100) * 100) / 100;
            form.get('benefice')?.setValue(benefice, { emitEvent: false });
          },
          onSave: (changes: Partial<any>, file?: File | null) => {
            const id = row.id; 
            if (!id) return of(null);
            
            // Nettoyer les champs calculés et temporaires
            const { benefice, marge_beneficiaire, cout_revient, fournisseur_id, ...articleChanges } = changes;
            
            // Préparer l'observable de sauvegarde
            let saveObs: Observable<any> = of(row);
            
            // 1. Upload de l'image si nécessaire
            if (file) {
              saveObs = this.articles.uploadPhoto(id, file).pipe(
                tap((uploadResult) => {
                  articleChanges['image_article'] = uploadResult.path;
                }),
                catchError((error) => {
                  console.error('Erreur upload article:', error);
                  this.notify.error(error.error?.message || 'Erreur lors de l\'upload de l\'image');
                  throw error;
                })
              );
            }
            
            return saveObs.pipe(
              switchMap(() => {
                // 2. Mettre à jour l'article si des champs ont changé
                const hasArticleChanges = Object.keys(articleChanges).length > 0;
                if (hasArticleChanges) {
                  return this.articles.update(id, articleChanges);
                }
                return of(row);
              }),
              switchMap((updatedArticle: Article) => {
                // 3. Mettre à jour le fournisseur si nécessaire
                if (fournisseur_id !== undefined || cout_revient !== undefined) {
                  const fournisseurChanges: any = {};
                  if (cout_revient !== undefined) fournisseurChanges.prixArticle = cout_revient;
                  if (fournisseur_id !== undefined) fournisseurChanges.article_id = id;
                  
                  // Si fournisseur existe, le mettre à jour
                  if (fournisseurActuel && Object.keys(fournisseurChanges).length > 0) {
                    return this.fournisseurs.update(fournisseurActuel.id, fournisseurChanges).pipe(
                      switchMap(() => of(updatedArticle))
                    );
                  }
                }
                return of(updatedArticle);
              }),
              tap((updated: Article) => {
                // Invalider le cache d'image pour forcer le rechargement
                if (updated && updated.id && file) {
                  const imageUrl = `${this.apiUrl}/articles/${updated.id}/photo`;
                  this.imageCache.removeFromCache(imageUrl);
                  this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
                    this.imageUrls.set(updated.id!, objectUrl);
                  });
                }
              })
            );
          },
        },
        width: '700px',
        maxHeight: '90vh',
        panelClass: 'dialog-dark-theme'
      }).afterClosed().subscribe(res => {
        if (res?.updated) {
          this.refreshTable();
        }
      });
    });
  }

  /**
   * Précharge toutes les images des articles
   */
  preloadArticleImages(articles: Article[]): void {
    articles.forEach(article => {
      if (article.id && article.image_article) {
        const imageUrl = `${this.apiUrl}/articles/${article.id}/photo`;
        this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
          this.imageUrls.set(article.id!, objectUrl);
        });
      }
    });
  }

  /**
   * Obtient l'URL de l'image d'un article (ObjectURL depuis le cache)
   */
  getArticleImageUrl(article: Article): string {
    if (!article.id) return this.defaultImage;
    
    // Vérifier si l'image est déjà dans le cache local
    if (this.imageUrls.has(article.id)) {
      return this.imageUrls.get(article.id)!;
    }
    
    // Si l'article a une image, charger l'image depuis le backend
    if (article.image_article) {
      const imageUrl = `${this.apiUrl}/articles/${article.id}/photo`;
      this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
        this.imageUrls.set(article.id!, objectUrl);
      });
      // Retourner l'image par défaut en attendant le chargement
      return this.defaultImage;
    }
    
    return this.defaultImage;
  }

  /**
   * Ouvre le modal d'aperçu d'image
   */
  onViewImage(article: Article): void {
    const src = this.getArticleImageUrl(article);
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { src, title: article.nom_article || 'Article' },
      panelClass: ['dialog-dark-theme', 'image-preview-dialog-content'],
      maxWidth: '90vw',
      width: '680px'
    });
  }

  /**
   * Gestion des erreurs d'image
   */
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
  }

    /**
   * Formate le prix en CFA (complet)
   * Utilise la méthode du service pour cohérence
   */
    formatPrice(price: number | string | null | undefined): string {
      return this.articles.formatPrice(price);
    }
  
    /**
     * Formate le prix de façon simplifiée (style YouTube: K, M, B)
     * Utilise la méthode du service pour cohérence
     */
    formatPriceShort(price: number | string | null | undefined): string {
      return this.articles.formatPriceShort(price);
    }

  /**
   * Nettoyage lors de la destruction du composant
   */
  ngOnDestroy(): void {
    // Libérer les ObjectURLs pour éviter les fuites mémoire
    this.imageUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.imageUrls.clear();
  }
}


