import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { StockService } from '../../../services/gescom/stock.service';
import { ImageCacheService } from '../../../services/image-cache.service';
import { environment } from '../../../environment';
import { NotifyService } from '../../../services/notify.service';
import { CartService } from '../../../services/cart.service';
import { GenericTableComponent, ColumnTemplateDirective, GenericTableColumn, GenericColumnType } from '../../ui-components/tables/generic-table.component';
import { DestockModalComponent } from '../../ui-components/destock-modal/destock-modal.component';
import { StockWithRelations } from '../../../interfaces/gescom/stock.model';

@Component({
  standalone: true,
  selector: 'app-ventes-create',
  templateUrl: './ventes-create.component.html',
  styleUrls: ['./ventes-create.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, RouterModule, GenericTableComponent, ColumnTemplateDirective],
})
export class VentesCreateComponent implements OnInit {
  // Data and table
  dataSource = new MatTableDataSource<StockWithRelations>([]);
  stocks: StockWithRelations[] = [];
  searchCtrl = new FormControl('');
  defaultImage = 'assets/images/products/Product.png';
  apiUrl = environment.apiBaseUrl;
  imageUrls = new Map<number, string>();

  stockColumns: GenericTableColumn[] = [
    { key: 'id', label: '#', type: 'number', align: 'center' },
    { key: 'lot', label: 'N°Lot', type: 'text' },
    { key: 'reference', label: 'Référence', type: 'text' },
    { key: 'produit', label: 'Produit', type: 'custom' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'custom' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'prix_unitaire', label: 'Prix/unité', type: 'custom', align: 'end' },
    { key: 'quantite', label: 'Quantité', type: 'number', align: 'end' },
    { key: 'etat', label: 'État', type: 'custom', align: 'center' },
    { key: 'date_fabrication', label: 'Fabriqué le', type: 'date', dateFormat: 'yyyy/MM/dd' },
    { key: 'date_peremption', label: 'Périme le', type: 'custom' },
    { key: 'created_at', label: 'Ajouté le', type: 'date', dateFormat: 'yyyy/MM/dd' },
    { key: 'action', label: 'Action', type: 'custom', align: 'end' },
  ];
  stockFilters: Array<{ key: string; label: string; type?: GenericColumnType; dataPath?: string; filterPath?: string }> = [
    { key: 'article_id', label: 'Article', type: 'select', dataPath: 'article.nom_article', filterPath: 'article_id' },
    { key: 'famille_id', label: 'Famille', type: 'select', dataPath: 'article.famille.nom_famille', filterPath: 'article.famille_id' },
    { key: 'fournisseur_id', label: 'Fournisseur', type: 'select', dataPath: 'fournisseur.nom', filterPath: 'fournisseur_id' },
    { key: 'lot', label: 'N° Lot', type: 'select', dataPath: 'lot', filterPath: 'lot' },
    { key: 'reference', label: 'Référence', type: 'select', dataPath: 'reference', filterPath: 'reference' },
    { key: 'etat_categorie', label: 'État du stock', type: 'select', dataPath: 'etat_categorie', filterPath: 'etat_categorie' },
    { key: 'peremption_categorie', label: 'Péremption', type: 'select', dataPath: 'peremption_categorie', filterPath: 'peremption_categorie' },
  ];

  constructor(
    private stockService: StockService,
    private imageCache: ImageCacheService,
    private dialog: MatDialog,
    private notify: NotifyService,
    public cart: CartService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  // Load and enrich rows (reuse logic from stock-list)
  load() {
    this.stockService.paginate({ page: 1, per_page: 100 }).subscribe((res) => {
      const rows = (res as any)?.data ?? [];
      rows.sort((a: StockWithRelations, b: StockWithRelations) => (new Date(b.created_at || '').getTime()) - (new Date(a.created_at || '').getTime()));
      const enriched = rows.map((row: StockWithRelations) => ({
        ...row,
        etat_categorie: this.getEtatCategorie(this.getCalculatedEtat(row)),
        peremption_categorie: this.getPeremptionCategorie(row.date_peremption)
      }));
      this.stocks = enriched;
      this.dataSource.data = enriched;
      this.preloadArticleImages(enriched);
    });
  }

  // Helpers copied from stock-list
  getCalculatedEtat(row: StockWithRelations): number {
    if (!row.quantite) return 0;
    const quantiteStandard = row.article?.quantite_standard || 100;
    if (quantiteStandard === 0) return 0;
    return Math.round((row.quantite / quantiteStandard) * 100 * 100) / 100;
  }
  getEtatCategorie(etat: number): string {
    if (etat >= 75) return 'Excellent (≥75%)';
    if (etat >= 50) return 'Bon (50-74%)';
    if (etat >= 25) return 'Faible (25-49%)';
    return 'Critique (<25%)';
  }
  getPeremptionCategorie(datePeremption: string | null | undefined): string {
    if (!datePeremption) return 'Non définie';
    const today = new Date();
    const peremptionDate = new Date(datePeremption);
    const diffTime = peremptionDate.getTime() - today.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);
    if (diffTime < 0) return 'Périmé';
    if (diffMonths <= 6) return 'Proche péremption (≤6 mois)';
    return 'Péremption lointaine (>6 mois)';
  }
  getPeremptionClass(datePeremption: string | null | undefined): string {
    return this.stockService.getPeremptionClass(datePeremption);
  }
  getBadgeClass(etat: number): string { return this.stockService.getEtatBadgeClass(etat); }
  formatPrice(price: number | string | null | undefined): string { return this.stockService.formatPrice(price); }
  formatPriceShort(price: number | string | null | undefined): string { return this.stockService.formatPriceShort(price); }

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
  getArticleImageUrl(stock: StockWithRelations): string {
    const articleId = stock.article?.id;
    if (!articleId) return this.defaultImage;
    if (this.imageUrls.has(articleId)) return this.imageUrls.get(articleId)!;
    if (stock.article?.image_article) {
      const imageUrl = `${this.apiUrl}/articles/${articleId}/photo`;
      this.imageCache.getImage(imageUrl, this.defaultImage).subscribe(objectUrl => {
        this.imageUrls.set(articleId, objectUrl);
      });
      return this.defaultImage;
    }
    return this.defaultImage;
  }

  // Action: Destocker (add to cart with quantity selection)
  onDestock(row: StockWithRelations) {
    if (!row || !row.id) return;
    const maxQty = Math.max(0, Number(row.quantite || 0));
    if (maxQty <= 0) { this.notify.error('Stock indisponible'); return; }

    const modalData = {
      mode: 'edit' as const,
      src: this.getArticleImageUrl(row),
      title: row.article?.nom_article || `Stock #${row.id}`,
      price: Number(row.article?.prixVente || 0), // Utiliser le prix de vente de l'article pour la cohérence
      description: `Lot: ${row.lot || 'N/A'} | Référence: ${row.reference || 'N/A'}`,
      categoryName: row.article?.famille?.nom_famille || 'Non catégorisé',
      maxQty: maxQty,
      currentQty: 1
    };

    const ref = this.dialog.open(DestockModalComponent, {
      data: modalData,
      width: '480px',
      panelClass: 'destock-modal-panel'
    });

    ref.afterClosed().subscribe((result) => {
      if (result && result.quantity) {
        // Map stock -> cart item
        this.cart.addItem({
          id: row.id!,
          uname: row.article?.nom_article || `Stock #${row.id}`,
          imagePath: row.article?.image_article ? `${this.apiUrl}/articles/${row.article.id}/photo` : this.defaultImage,
          price: Number(row.article?.prixVente || 0), // Utiliser le prix de vente de l'article pour la cohérence
          maxQty: maxQty,
          articleName: row.article?.nom_article || undefined,
          familleName: row.article?.famille?.nom_famille || undefined
        }, result.quantity);
        this.notify.successToast('Ajouté au panier');
      }
    });
  }

  onGoToCart() { this.router.navigate(['/ui-components/cart']); }
}
