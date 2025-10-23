import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { StockService } from '../../../services/gescom/stock.service';
import { FamillesService } from '../../../services/gescom/familles.service';
import { ArticlesService } from '../../../services/gescom/articles.service';
import { FournisseursService } from '../../../services/gescom/fournisseurs.service';
import { Stock, StockWithRelations } from '../../../interfaces/gescom/stock.model';
import { RouterModule } from '@angular/router';
import { NotifyService } from '../../../services/notify.service';
import { MatDialog } from '@angular/material/dialog';
import { EditFieldConfig, EditEntityDialogComponent } from '../../ui-components/tables/edit-entity-dialog.component';
import { forkJoin, of, Observable } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { GenericTableComponent, GenericTableColumn, GenericColumnType, ColumnTemplateDirective } from '../../ui-components/tables/generic-table.component';
import { ImagePreviewDialogComponent } from '../../ui-components/image-preview-dialog.component';
import { environment } from '../../../environment';
import { ImageCacheService } from '../../../services/image-cache.service';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  standalone: true,
  selector: 'app-stock-list',
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.scss'],
  imports: [CommonModule, MaterialModule, RouterModule, GenericTableComponent, ColumnTemplateDirective, MatNativeDateModule],
})
export class StockListComponent {
  @ViewChild('stockTable') table?: GenericTableComponent;
  stocks: StockWithRelations[] = [];
  defaultImage = 'assets/images/products/Product.png';
  apiUrl = environment.apiBaseUrl;
  
  // Cache des images converties en ObjectURL
  imageUrls = new Map<number, string>();

  stockColumns: GenericTableColumn[] = [
    { key: 'id', label: '#', type: 'number', align: 'center' },
    { key: 'lot', label: 'N°Lot', type: 'text' },
    { key: 'reference', label: 'Référence', type: 'text' },
    { key: 'produit', label: 'Produit', type: 'custom', searchPath: 'article.nom_article' }, 
    { key: 'fournisseur', label: 'Fournisseur', type: 'custom', searchPath: 'fournisseur.nom' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'prix_unitaire', label: 'Prix/unité', type: 'custom', align: 'end', searchPath: 'fournisseur.prixArticle' },
    { key: 'quantite', label: 'Quantité', type: 'number', align: 'end' },
    { key: 'etat', label: 'État', type: 'custom', align: 'center' },
    { key: 'date_fabrication', label: 'Fabriqué le', type: 'date', dateFormat: 'yyyy/MM/dd' },
    { key: 'date_peremption', label: 'Périme le', type: 'custom', searchPath: 'date_peremption' },
    { key: 'created_at', label: 'Ajouté le', type: 'date', dateFormat: 'yyyy/MM/dd' },
    { key: 'updated_at', label: 'Modifié le', type: 'date', dateFormat: 'yyyy/MM/dd' },
  ];
  stockFilters: Array<{ key: string; label: string; type?: GenericColumnType; dataPath?: string; filterPath?: string }> = [
    { 
      key: 'article_id', 
      label: 'Article', 
      type: 'select',
      dataPath: 'article.nom_article', // Afficher le nom de l'article
      filterPath: 'article_id' // Filtrer par l'ID de l'article
    },
    { 
      key: 'famille_id', 
      label: 'Famille', 
      type: 'select',
      dataPath: 'article.famille.nom_famille', // Afficher le nom de la famille
      filterPath: 'article.famille_id' // Filtrer par l'ID de la famille
    },
    { 
      key: 'fournisseur_id', 
      label: 'Fournisseur', 
      type: 'select',
      dataPath: 'fournisseur.nom', // Afficher le nom du fournisseur
      filterPath: 'fournisseur_id' // Filtrer par l'ID du fournisseur
    },
    { 
      key: 'lot', 
      label: 'N° Lot', 
      type: 'select',
      dataPath: 'lot',
      filterPath: 'lot'
    },
    { 
      key: 'reference', 
      label: 'Référence', 
      type: 'select',
      dataPath: 'reference',
      filterPath: 'reference'
    },
    { 
      key: 'etat_categorie', 
      label: 'État du stock', 
      type: 'select',
      dataPath: 'etat_categorie', // Catégorie calculée
      filterPath: 'etat_categorie'
    },
    { 
      key: 'peremption_categorie', 
      label: 'Péremption', 
      type: 'select',
      dataPath: 'peremption_categorie', // Catégorie calculée
      filterPath: 'peremption_categorie'
    },
  ];

  constructor(
    private stockService: StockService,
    private familles: FamillesService,
    private articles: ArticlesService,
    private fournisseurs: FournisseursService,
    private notify: NotifyService, 
    private dialog: MatDialog,
    private imageCache: ImageCacheService
  ) {}

  readonly dataLoader = (): Observable<StockWithRelations[]> => this.stockService.paginate({ page: 1, per_page: 100 }).pipe(
    catchError((error) => {
      console.error('Failed to load stock:', error);
      this.notify.error('Impossible de charger le stock');
      return of({ data: [] });
    }),
    map((res: any) => {
      const rows = (res?.data ?? []) as StockWithRelations[];
      rows.sort((a: StockWithRelations, b: StockWithRelations) =>
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      return rows.map((row: StockWithRelations) => ({
        ...row,
        etat_categorie: this.getEtatCategorie(this.getCalculatedEtat(row)),
        peremption_categorie: this.getPeremptionCategorie(row.date_peremption)
      }));
    })
  );

  onRowsLoaded(rows: StockWithRelations[]): void {
    this.stocks = rows;
    this.preloadArticleImages(rows);
  }

  refreshTable(): void {
    this.table?.reload();
  }

  onDelete(payload: StockWithRelations | StockWithRelations[]) {
    if (Array.isArray(payload)) { return this.deleteSelected(payload); }
    return this.delete(payload as StockWithRelations);
  }

  /**
   * Calcule l'état dynamiquement à partir de la quantité et quantité standard
   */
  getCalculatedEtat(row: StockWithRelations): number {
    if (!row.quantite) return 0;
    const quantiteStandard = row.article?.quantite_standard || 100;
    if (quantiteStandard === 0) return 0;
    return Math.round((row.quantite / quantiteStandard) * 100 * 100) / 100;
  }

  /**
   * Retourne la classe CSS pour le badge d'état
   * Utilise la méthode du service pour cohérence
   */
  getBadgeClass(etat: number): string {
    return this.stockService.getEtatBadgeClass(etat);
  }

  /**
   * Retourne la classe CSS pour la date de péremption
   * Utilise la méthode du service pour cohérence
   */
  getPeremptionClass(datePeremption: string | null | undefined): string {
    return this.stockService.getPeremptionClass(datePeremption);
  }

  /**
   * Vérifie si un produit est périmé
   * Utilise la méthode du service pour cohérence
   */
  isExpired(datePeremption: string | null | undefined): boolean {
    return this.stockService.isExpired(datePeremption);
  }

  /**
   * Formate le prix en CFA (complet)
   * Utilise la méthode du service pour cohérence
   */
  formatPrice(price: number | string | null | undefined): string {
    return this.stockService.formatPrice(price);
  }

  /**
   * Formate le prix de façon simplifiée (style YouTube: K, M, B)
   * Utilise la méthode du service pour cohérence
   */
  formatPriceShort(price: number | string | null | undefined): string {
    return this.stockService.formatPriceShort(price);
  }

  /**
   * Précharge toutes les images des articles
   */
  preloadArticleImages(stocks: StockWithRelations[]): void {
    stocks.forEach(stock => {
      if (stock.article?.id && stock.article.image_article) {
        const imageUrl = `${this.apiUrl}/articles/${stock.article.id}/photo`;
        this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
          this.imageUrls.set(stock.article!.id!, objectUrl);
        });
      }
    });
  }

  /**
   * Obtient l'URL de l'image d'un article (ObjectURL depuis le cache)
   */
  getArticleImageUrl(stock: StockWithRelations): string {
    const articleId = stock.article?.id;
    if (!articleId) return this.defaultImage;
    
    // Vérifier si l'image est déjà dans le cache local
    if (this.imageUrls.has(articleId)) {
      return this.imageUrls.get(articleId)!;
    }
    
    // Si l'article a une image, charger l'image depuis le backend
    if (stock.article?.image_article) {
      const imageUrl = `${this.apiUrl}/articles/${articleId}/photo`;
      this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
        this.imageUrls.set(articleId, objectUrl);
      });
      // Retourner l'image par défaut en attendant le chargement
      return this.defaultImage;
    }
    
    return this.defaultImage;
  }

  /**
   * Ouvre le modal d'aperçu d'image
   */
  onViewImage(stock: StockWithRelations): void {
    const src = this.getArticleImageUrl(stock);
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { src, title: stock.article?.nom_article || 'Article' },
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

  openView(row: StockWithRelations) {
    const fields: EditFieldConfig[] = [
      { key: 'lot', label: 'Lot', type: 'text' },
      { key: 'reference', label: 'Référence', type: 'text' },
      { key: 'quantite', label: 'Quantité', type: 'number' },
      { key: 'prix_unitaire', label: 'Prix unitaire', type: 'number' },
      { key: 'date_fabrication', label: 'Date de fabrication', type: 'date' },
      { key: 'date_peremption', label: 'Date de péremption', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'etat', label: 'État (%)', type: 'number' },
    ];

    this.dialog.open(EditEntityDialogComponent, {
      data: {
        title: 'Détails stock',
        entity: 'Stock',
        value: row,
        fields,
        readOnly: true,
        onSave: () => of(row),
      },
      width: '720px',
      panelClass: 'dialog-dark-theme',
    });
  }
  openEdit(row: StockWithRelations) {
    // Charger les familles, articles et fournisseurs
    forkJoin({
      familles: this.familles.all(),
      articles: this.articles.all(),
      fournisseurs: this.fournisseurs.all()
    }).subscribe(({ familles, articles, fournisseurs }) => {
      
      // Calculer l'état actuel si possible
      const articleActuel = articles.find(a => a.id === row.article_id);
      const quantiteStandard = articleActuel?.quantite_standard || 100;
      const etatCalcule = quantiteStandard > 0 ? Math.round((row.quantite / quantiteStandard) * 100 * 100) / 100 : row.etat;
      
      // Filtrer les articles par famille initiale
      let articlesFiltered = articleActuel?.famille_id 
        ? articles.filter(a => a.famille_id === articleActuel.famille_id)
        : [...articles];
      
      // Filtrer les fournisseurs par article
      let fournisseursFiltered = fournisseurs.filter(f => f.article_id === row.article_id);
      
      // Trouver le fournisseur actuel
      const fournisseurActuel = fournisseurs.find(f => f.id === row.fournisseur_id);

      const fields: EditFieldConfig[] = [
        // Section: Information Générale
        { 
          key: 'famille_id', 
          label: 'Famille', 
          type: 'select-create',
          options: familles.map(f => ({ label: f.nom_famille, value: f.id })),
          allowCreate: true,
          createPrompt: 'Créer une nouvelle famille',
          onCreate: (nom: string) => this.familles.create({ nom_famille: nom })
        },
        { 
          key: 'article_id', 
          label: 'Article', 
          type: 'select-create',
          required: true,
          options: articlesFiltered.map(a => ({ label: a.nom_article, value: a.id })),
          allowCreate: true,
          createPrompt: 'Créer un nouvel article',
          onCreate: (nom: string) => {
            const familleId = articleActuel?.famille_id || 1;
            return this.articles.create({ 
              nom_article: nom, 
              famille_id: familleId,
              quantite_standard: 100
            });
          }
        },
        { key: 'lot', label: 'N°Lot', type: 'text', placeholder: 'Numéro de lot' },
        { key: 'reference', label: 'Référence', type: 'text', placeholder: 'Référence article' },
        
        // Section: Options Avancées (Prix et Fournisseur)
        { 
          key: 'fournisseur_id', 
          label: 'Fournisseur', 
          type: 'select-create',
          options: fournisseursFiltered.map(f => ({ 
            label: f.prixArticle ? `${f.nom} - ${f.prixArticle} XOF` : f.nom, 
            value: f.id 
          })),
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
          key: 'prix_unitaire', 
          label: fournisseurActuel?.prixArticle ? 'Prix Unitaire (XOF) - Du fournisseur' : 'Prix Unitaire (XOF)', 
          type: 'number', 
          min: 0, 
          step: 0.01,
          placeholder: fournisseurActuel?.prixArticle 
            ? `Prix fournisseur: ${fournisseurActuel.prixArticle} XOF` 
            : 'Prix d\'achat unitaire',
          hint: fournisseurActuel?.prixArticle 
            ? `ℹ️ Prix chargé depuis le fournisseur ${fournisseurActuel.nom}` 
            : undefined
        },
        { 
          key: 'quantite', 
          label: 'Quantité', 
          type: 'number', 
          min: 0, 
          step: 1,
          required: true
        },
        { 
          key: 'montant', 
          label: 'Montant Total (XOF)', 
          type: 'number',
          disabled: true,
          calculated: true,
          calculate: (formValue) => {
            const prix = formValue.prix_unitaire || 0;
            const qte = formValue.quantite || 0;
            return Math.round(prix * qte * 100) / 100;
          },
          placeholder: '= Prix unitaire × Quantité'
        },
        { 
          key: 'quantite_standard', 
          label: 'Quantité standard', 
          type: 'number',
          min: 0,
          step: 1,
          placeholder: 'Quantité de référence'
        },
        { 
          key: 'etat', 
          label: 'État', 
          type: 'range', 
          min: 0, 
          max: 100, 
          step: 0.1,
          suffix: '%',
          displayValue: (val) => `${val}%`,
          disabled: true,
          calculated: true,
          calculate: (formValue) => {
            const qte = formValue.quantite || 0;
            const qteStandard = formValue.quantite_standard || 100;
            if (qteStandard === 0) return 0;
            return Math.round((qte / qteStandard) * 100 * 100) / 100;
          }
        },
        { key: 'date_fabrication', label: 'Date Fabrication', type: 'date' },
        { key: 'date_peremption', label: 'Date Péremption', type: 'date' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Détails supplémentaires...' },
      ];

      // Préparer les valeurs initiales
      const initialValue = {
        ...row,
        famille_id: row.article?.famille_id || null,
        quantite_standard: quantiteStandard,
        montant: row.montant || (row.prix_unitaire * row.quantite),
        etat: etatCalcule
      };

      const ref = this.dialog.open(EditEntityDialogComponent, {
        data: {
          title: 'Modifier stock',
          entity: 'Stock',
          value: initialValue,
          fields,
          getImageUrl: (stock: any) => this.getArticleImageUrl(row),
          onFormChange: (form: any) => {
            // Filtrer les articles par famille sélectionnée
            const familleId = form.get('famille_id')?.value;
            if (familleId) {
              articlesFiltered = articles.filter(a => a.famille_id === familleId);
            } else {
              articlesFiltered = [...articles];
            }
            
            // Mettre à jour les options d'articles dans le champ
            const articleField = fields.find(f => f.key === 'article_id');
            if (articleField) {
              articleField.options = articlesFiltered.map(a => ({ label: a.nom_article, value: a.id }));
            }
            
            // Charger automatiquement les données de l'article sélectionné
            const articleId = form.get('article_id')?.value;
            if (articleId) {
              const selectedArticle = articles.find(a => a.id === articleId);
              if (selectedArticle) {
                // Charger conditionnement et quantité standard
                if (selectedArticle.conditionnement) {
                  // Note: conditionnement n'est pas dans le formulaire stock, mais quantite_standard oui
                }
                if (selectedArticle.quantite_standard && !form.get('quantite_standard')?.dirty) {
                  form.patchValue({ quantite_standard: selectedArticle.quantite_standard }, { emitEvent: false });
                }
                
                // Filtrer les fournisseurs par article
                fournisseursFiltered = fournisseurs.filter(f => f.article_id === articleId);
                
                // Mettre à jour les options de fournisseurs dans le champ
                const fournisseurField = fields.find(f => f.key === 'fournisseur_id');
                if (fournisseurField) {
                  fournisseurField.options = fournisseursFiltered.map(f => ({ 
                    label: f.prixArticle ? `${f.nom} - ${f.prixArticle} XOF` : f.nom, 
                    value: f.id 
                  }));
                }
                
                // Présélectionner le fournisseur si un seul disponible
                if (fournisseursFiltered.length === 1 && !form.get('fournisseur_id')?.value) {
                  const fournisseur = fournisseursFiltered[0];
                  form.patchValue({ fournisseur_id: fournisseur.id }, { emitEvent: false });
                  if (fournisseur.prixArticle) {
                    form.patchValue({ prix_unitaire: fournisseur.prixArticle }, { emitEvent: false });
                  }
                }
              }
            }
            
            // Charger le prix du fournisseur sélectionné
            const fournisseurId = form.get('fournisseur_id')?.value;
            if (fournisseurId) {
              const selectedFournisseur = fournisseurs.find(f => f.id === fournisseurId);
              if (selectedFournisseur && selectedFournisseur.prixArticle && !form.get('prix_unitaire')?.dirty) {
                form.patchValue({ prix_unitaire: selectedFournisseur.prixArticle }, { emitEvent: false });
              }
            }
          },
          onSave: (changes: Partial<any>, file?: File | null) => {
            const id = row.id;
            if (!id) return of(null);
            
            // Nettoyer les champs calculés et temporaires
            const { montant, quantite_standard, famille_id, ...stockChanges } = changes;
            
            // Normalize date objects to 'YYYY-MM-DD'
            const fmt = (d: any) => {
              if (!d) return d;
              const dt = d instanceof Date ? d : new Date(d);
              if (isNaN(dt.getTime())) return d;
              const y = dt.getFullYear();
              const m = String(dt.getMonth() + 1).padStart(2, '0');
              const da = String(dt.getDate()).padStart(2, '0');
              return `${y}-${m}-${da}`;
            };
            
            if ('date_fabrication' in stockChanges) stockChanges['date_fabrication'] = fmt(stockChanges['date_fabrication']);
            if ('date_peremption' in stockChanges) stockChanges['date_peremption'] = fmt(stockChanges['date_peremption']);
            
            // Calculer le montant si prix ou quantité ont changé
            if ('prix_unitaire' in stockChanges || 'quantite' in stockChanges) {
              const prix = stockChanges['prix_unitaire'] ?? row.prix_unitaire;
              const qte = stockChanges['quantite'] ?? row.quantite;
              stockChanges['montant'] = Math.round(prix * qte * 100) / 100;
            }
            
            let saveObs: Observable<any> = of(row);
            
            // 1. Upload de l'image si nécessaire (pour l'article lié)
            if (file && row.article_id) {
              saveObs = this.articles.uploadPhoto(row.article_id, file).pipe(
                catchError((error) => {
                  console.error('Erreur upload image article:', error);
                  this.notify.error(error.error?.message || 'Erreur lors de l\'upload de l\'image');
                  throw error;
                })
              );
            }
            
            return saveObs.pipe(
              switchMap(() => {
                // 2. Mettre à jour le stock
                const hasStockChanges = Object.keys(stockChanges).length > 0;
                if (hasStockChanges) {
                  return this.stockService.update(id, stockChanges);
                }
                return of(row);
              }),
              switchMap((updatedStock: Stock) => {
                // 3. Mettre à jour l'article si nécessaire (quantite_standard, famille_id)
                if ((quantite_standard !== undefined || famille_id !== undefined) && row.article_id) {
                  const articleChanges: any = {};
                  if (quantite_standard !== undefined) articleChanges.quantite_standard = quantite_standard;
                  if (famille_id !== undefined) articleChanges.famille_id = famille_id;
                  
                  if (Object.keys(articleChanges).length > 0) {
                    return this.articles.update(row.article_id, articleChanges).pipe(
                      switchMap(() => of(updatedStock))
                    );
                  }
                }
                return of(updatedStock);
              }),
              tap(() => {
                // Invalider le cache d'image si nécessaire
                if (file && row.article?.id) {
                  const imageUrl = `${this.apiUrl}/articles/${row.article.id}/photo`;
                  this.imageCache.removeFromCache(imageUrl);
                }
              })
            );
          },
        },
        width: '700px',
        maxHeight: '90vh',
        panelClass: 'dialog-dark-theme',
      });

      ref.afterClosed().subscribe(res => {
        if (res?.updated) {
          this.refreshTable();
        }
      });
    });
  }

  deleteSelected(selected: StockWithRelations[]): void {
    if (!selected.length) return;
    this.notify
      .confirm({ title: 'Supprimer la sélection', text: `Supprimer ${selected.length} entrée(s) de stock ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        const ids = selected
          .map(s => s.id)
          .filter((id): id is number => typeof id === 'number');
        if (!ids.length) return;
        forkJoin(ids.map(id => this.stockService.delete(id))).subscribe({
          next: () => {},
          complete: () => {
            this.notify.successToast('Sélection supprimée');
            this.refreshTable();
          },
          error: () => this.notify.error('Suppression impossible pour certains éléments')
        });
      });
  }

  delete(row: StockWithRelations) {
    if (!row.id) return;
    this.notify
      .confirm({ title: 'Confirmer', text: `Supprimer cette entrée de stock ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.stockService.delete(row.id!).subscribe({
          next: () => {
            this.notify.success('Entrée supprimée');
            this.refreshTable();
          },
          error: () => this.notify.error('Suppression impossible')
        });
      });
  }
  archive(row: StockWithRelations) { console.log('Archive stock', row.id); }

  /**
   * Retourne la catégorie d'état du stock (pour filtrage)
   */
  getEtatCategorie(etat: number): string {
    if (etat >= 75) return 'Excellent (≥75%)';
    if (etat >= 50) return 'Bon (50-74%)';
    if (etat >= 25) return 'Faible (25-49%)';
    return 'Critique (<25%)';
  }

  /**
   * Retourne la catégorie de péremption (pour filtrage)
   */
  getPeremptionCategorie(datePeremption: string | null | undefined): string {
    if (!datePeremption) return 'Non définie';
    
    const today = new Date();
    const peremptionDate = new Date(datePeremption);
    const diffTime = peremptionDate.getTime() - today.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30); // Approximation
    
    if (diffTime < 0) return 'Périmé';
    if (diffMonths <= 6) return 'Proche péremption (≤6 mois)';
    return 'Péremption lointaine (>6 mois)';
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
