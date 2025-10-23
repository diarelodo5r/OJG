import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ViewChild, AfterViewInit, OnInit, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MaterialModule } from '../../../material.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { CartService } from '../../../services/cart.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ProductDetailDialog } from './product-detail-dialog.component';
import { EditProductDialogComponent } from './edit-product-dialog.component';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environment';
import type { Product } from '../../../interfaces/index.js';
import type { Category, Supplier } from '../../../interfaces/index.js';
import { ProductService } from '../../../services/product.service';
import { NotifyService } from '../../../services/notify.service';
import { PermissionGuardService } from '../../../services/permission-guard.service';
import { AuthService } from '../../../services/auth.service';

// Types importés depuis src/app/interfaces

// Type UI local: UI n'a pas besoin d'exiger les FK; on les rend optionnelles et on ajoute les objets relationnels
type UiProduct = Omit<Product, 'seller_id' | 'category_id' | 'supplier_id'> & {
  reference?: string;
  category?: Category;
  supplier?: Supplier;
  seller_id?: number;
  category_id?: number;
  supplier_id?: number;
};

// BehaviorSubject pour gérer les données produits avec stock en temps réel (depuis l'API)
const productsDataSubject = new BehaviorSubject<UiProduct[]>([]);

// Interface for cart items
interface CartItem {
  id: number;
  uname: string;
  imagePath: string;
  price: number;
  quantity: number;
  maxQty?: number;
}

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    HttpClientModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class AppTablesComponent implements AfterViewInit, OnInit, OnDestroy {
  // Colonnes du tableau
  displayedColumns: string[] = ['select', 'product', 'description', 'price', 'quantity', 'category', 'supplier', 'actions'];
  dataSource = new MatTableDataSource<UiProduct>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // États
  loading = false;
  totalProducts = 0;
  
  // Pour la sélection multiple
  selection = new SelectionModel<UiProduct>(true, []);
  
  // URL de l'API
  apiUrl = environment.apiBaseUrl;
  // Base host (sans suffixe /api) pour servir les fichiers sous /storage
  apiHostBase = this.apiUrl.replace(/\/?api\/?$/, '');
  defaultImage = 'assets/images/products/Product.png';
  
  // Filtre de recherche
  filterValue = '';
  // Filtres avancés
  selectedCategoryIds: number[] = [];
  selectedSupplierIds: number[] = [];
  stockStatus: 'all' | 'in_stock' | 'low' | 'out' = 'all';
  priceMin?: number;
  priceMax?: number;
  // Stocke des objets minimalistes {id,name} pour éviter les conflits de types selon les endpoints
  categories: Array<{ id?: number; name?: string }> = [];
  suppliers: Array<{ id?: number; name?: string }> = [];
  // Cache d'URL d'images préchargées (Blob URLs)
  private photoUrlCache = new Map<number, string>();

  constructor(private dialog: MatDialog, private cart: CartService, private snackBar: MatSnackBar, private http: HttpClient, private productService: ProductService, private notify: NotifyService, private router: Router, private permGuard: PermissionGuardService, private authSvc: AuthService) {
    // S'abonner aux changements de données produits (afficher toute la liste, même qty=0)
    productsDataSubject.subscribe(data => {
      this.dataSource.data = data;
    });
  }

  // Charger les options de filtres
  private loadFilterOptions(): void {
    // Catégories
    try {
      this.productService.getCategories().subscribe({
        next: (list) => {
          const arr = Array.isArray(list) ? list : (Array.isArray((list as any)?.data) ? (list as any).data : []);
          this.categories = arr.map((c: any) => ({ id: c.id, name: c.name }));
        },
        error: () => (this.categories = [])
      });
    } catch {}
    // Fournisseurs
    try {
      this.productService.getSuppliers().subscribe({
        next: (list) => {
          const arr = Array.isArray(list) ? list : (Array.isArray((list as any)?.data) ? (list as any).data : []);
          this.suppliers = arr.map((s: any) => ({ id: s.id, name: s.name }));
        },
        error: () => (this.suppliers = [])
      });
    } catch {}
  }

  // Permission checks for products table actions
  private get currentRoleId(): number | undefined {
    const u = this.authSvc.getCurrentUser();
    const r = u?.roles && u.roles.length ? u.roles[0] : undefined;
    return r?.id;
  }

  canProduct(action: 'read'|'create'|'update'|'delete'): boolean {
    const resource = 'table.products';
    const permName = `products.${action}`;
    return this.permGuard.can(resource, permName, this.currentRoleId);
  }

  ngOnDestroy(): void {
    // Révoquer toutes les URLs d'objet créées
    for (const url of this.photoUrlCache.values()) {
      try { URL.revokeObjectURL(url); } catch {}
    }
    this.photoUrlCache.clear();
  }

  // Méthode pour mettre à jour le stock d'un produit
  updateProductStock(productId: number, quantityChange: number): void {
    const currentData = productsDataSubject.value;
    const updatedData = currentData.map(product => {
      if (product.id === productId) {
        const newQuantity = Math.max(0, (product.quantity || 0) - quantityChange);
        return { ...product, quantity: newQuantity };
      }
      return product;
    });
    productsDataSubject.next(updatedData);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Configuration du tri personnalisé
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'product': return item.name.toLowerCase();
        case 'category': return item.category?.name?.toLowerCase() || '';
        case 'supplier': return item.supplier?.name?.toLowerCase() || '';
        default: return (item as any)[property];
      }
    };
    
  }
  
  // Méthode pour obtenir l'URL complète de l'image du produit
  getProductImageUrl(product: UiProduct): string {
    try {
      // 0) Si une URL préchargée existe, la préférer
      if (product.id != null && this.photoUrlCache.has(product.id)) {
        const cached = this.photoUrlCache.get(product.id)!;
        console.debug('[Tables] Image URL (cached blob):', cached);
        return cached;
      }
      const photoPath = product.photo;
      // 1) Si on a un chemin explicite
      if (photoPath) {
        // Déjà une URL complète ou un asset
        if (photoPath.startsWith('http') || photoPath.startsWith('assets/')) {
          console.debug('[Tables] Image URL (absolute/assets):', photoPath);
          return photoPath;
        }
        const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        if (cleanPath.startsWith('/storage/')) {
          const url = `${this.apiHostBase}${cleanPath}`;
          console.debug('[Tables] Image URL (storage):', url);
          return url;
        }
        const url = `${this.apiUrl}${cleanPath}`;
        console.debug('[Tables] Image URL (api-rel):', url);
        return url;
      }
      // 2) Pas de chemin enregistré, on tente l'endpoint d'image GET /products/{id}/photo
      if (product.id != null) {
        const url = `${this.apiUrl}/products/${product.id}/photo`;
        console.debug('[Tables] Image URL (endpoint fallback):', url);
        return url;
      }
      // 3) Fallback image par défaut
      console.debug('[Tables] Image URL (default):', this.defaultImage);
      return this.defaultImage;
    } catch (e) {
      console.warn('[Tables] Image URL error, fallback to default:', e);
      return this.defaultImage;
    }
  }
  
  // Formate le prix avec le symbole de la monnaie
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyAdvancedFilters();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearAdvancedFilters(): void {
    this.selectedCategoryIds = [];
    this.selectedSupplierIds = [];
    this.stockStatus = 'all';
    this.priceMin = undefined;
    this.priceMax = undefined;
    this.applyAdvancedFilters();
  }

  // Appliquer les filtres avancés en sérialisant l'état complet
  applyAdvancedFilters(): void {
    const payload = {
      text: this.filterValue,
      categoryIds: this.selectedCategoryIds,
      supplierIds: this.selectedSupplierIds,
      stock: this.stockStatus,
      min: this.priceMin ?? null,
      max: this.priceMax ?? null,
    };
    this.dataSource.filter = JSON.stringify(payload);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Tronquer le texte avec une limite de caractères
  truncateText(text: string | null | undefined, maxLength: number = 50): string {
    if (!text) return '';
    const str = text.toString().replace(/\n/g, ' ');
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength).trim() + '...';
  }

  // Charger les produits depuis l'API
  loadProducts(): void {
    this.loading = true;
    const url = `${this.apiUrl}/products`;
    const headers = this.getAuthHeaders();

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        const products: UiProduct[] = list.map((p: any) => this.adaptProduct(p));
        this.dataSource.data = products;
        // Synchroniser le BehaviorSubject pour que les mises à jour (stock) se basent sur la liste courante
        productsDataSubject.next(products);
        this.totalProducts = products.length;
        // Précharger toutes les images via l'endpoint protégé (si disponible)
        this.preloadProductPhotos(products);
        if (this.filterValue) {
          this.dataSource.filter = this.filterValue;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits', error);
        const msg = error?.status === 401 ? 'Non autorisé. Veuillez vous connecter.' : (error?.error?.message || 'Erreur lors du chargement des produits');
        this.notify.error(msg, 'Erreur');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Précharge les photos des produits via l'endpoint protégé et met en cache des Blob URLs
  private preloadProductPhotos(products: UiProduct[]): void {
    const idsToFetch = products
      .map((p) => p.id)
      .filter((id): id is number => typeof id === 'number' && !this.photoUrlCache.has(id));
    if (!idsToFetch.length) return;
    console.debug('[Tables] Preloading product photos for IDs:', idsToFetch);

    idsToFetch.forEach((id) => {
      this.productService.getProductPhoto(id).subscribe({
        next: (blob) => {
          if (!(blob instanceof Blob)) {
            console.debug(`[Tables] Product ${id} photo response is not a Blob.`);
            return;
          }
          const objectUrl = URL.createObjectURL(blob);
          const prev = this.photoUrlCache.get(id);
          if (prev) {
            try { URL.revokeObjectURL(prev); } catch {}
          }
          this.photoUrlCache.set(id, objectUrl);
          console.debug(`[Tables] Photo preloaded for product ${id}`);
        },
        error: (err) => {
          console.debug(`[Tables] No photo for product ${id} or fetch failed`, err?.status ?? err);
        },
      });
    });
  }

  private getAuthHeaders(): HttpHeaders {
    // Tente différents noms de clés possibles pour le token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private adaptProduct(p: any): UiProduct {
    return {
      id: p.id,
      name: p.name ?? p.uname ?? 'Produit',
      description: p.description ?? '',
      price: Number(p.price ?? 0),
      quantity: Number(p.quantity ?? p.stock ?? 0),
      photo: this.normalizePhoto(p.photo ?? p.imagePath),
      reference: p.reference ?? p.ref ?? undefined,
      category: p.category ?? (p.category_id ? { id: p.category_id, name: p.category_name ?? 'Catégorie' } : undefined),
      supplier: p.supplier ?? (p.supplier_id ? { id: p.supplier_id, name: p.supplier_name ?? 'Fournisseur' } : undefined),
      seller_id: p.seller_id ?? undefined,
      category_id: p.category_id ?? undefined,
      supplier_id: p.supplier_id ?? undefined,
      created_at: p.created_at,
      updated_at: p.updated_at
    };
  }

  private normalizePhoto(photo: string | undefined): string | undefined {
    if (!photo) return undefined;
    // Si l'API renvoie déjà une URL absolue ou un chemin d'assets
    if (photo.startsWith('http') || photo.startsWith('assets/')) return photo;
    const cleanPath = photo.startsWith('/') ? photo : `/${photo}`;
    if (cleanPath.startsWith('/storage/')) {
      return `${this.apiHostBase}${cleanPath}`;
    }
    return `${this.apiUrl}${cleanPath}`;
  }

  // Voir les détails d'un produit
  viewProduct(product: UiProduct): void {
    const dialogRef = this.dialog.open(ProductDetailDialog, {
      data: { product, src: this.getProductImageUrl(product) },
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'edit') {
        this.editProduct(result.product);
      }
    });
  }
  
  // Afficher uniquement l'image en grand (ancien modal image-only)
  onViewImage(product: UiProduct): void {
    const src = this.getProductImageUrl(product);
    this.dialog.open(ImagePreviewDialog, {
      data: { src, title: product.name },
      panelClass: ['dialog-dark-theme', 'image-preview-dialog-content'],
      maxWidth: '90vw',
      width: '680px'
    });
  }
  
  // Éditer un produit - modal d'édition des champs
  editProduct(product: UiProduct): void {
    const dialogRef = this.dialog.open(EditProductDialogComponent, {
      data: { product },
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.updated) {
        const updated: UiProduct = this.adaptProduct(result.updated);
        // Mettre à jour la ligne correspondante
        const current = [...this.dataSource.data];
        const idx = current.findIndex(p => p.id === updated.id);
        if (idx !== -1) {
          current[idx] = { ...current[idx], ...updated };
          this.dataSource.data = current;
          productsDataSubject.next(current);
        }
        this.notify.success('Produit mis à jour');
      }
    });
  }
  
  // Supprimer un produit
  deleteProduct(productId: number): void {
    this.notify
      .confirm({ title: 'Confirmer la suppression', text: 'Êtes-vous sûr de vouloir supprimer ce produit ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.loading = true;
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            const updatedProducts = this.dataSource.data.filter(p => p.id !== productId);
            this.dataSource.data = updatedProducts;
            productsDataSubject.next(updatedProducts);
            this.totalProducts = updatedProducts.length;
            this.notify.successToast('Produit supprimé avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du produit', error);
            const msg = error?.status === 401
              ? 'Non autorisé. Veuillez vous connecter.'
              : (error?.error?.message || 'Erreur lors de la suppression du produit');
            this.notify.error(msg, 'Erreur');
          },
          complete: () => {
            this.loading = false;
          }
        });
      });
  }
  
  // Ouvrir la boîte de dialogue d'ajout de produit
  openAddProductDialog(): void {
    // Rediriger vers la page de formulaire d'ajout
    this.router.navigate(['/ui-components/forms']);
  }

  // Initialisation du composant
  ngOnInit(): void {
    // Configuration du filtre personnalisé
    this.dataSource.filterPredicate = (data: UiProduct, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.name.toLowerCase().includes(searchStr) ||
        (data.reference && data.reference.toLowerCase().includes(searchStr)) ||
        (data.description && data.description.toLowerCase().includes(searchStr)) ||
        (data.category?.name?.toLowerCase().includes(searchStr) ?? false) ||
        (data.supplier?.name?.toLowerCase().includes(searchStr) ?? false)
      );
    };
    // Chargement initial des produits (et préchargement des images)
    this.loadProducts();
    // Charger options de filtres (catégories, fournisseurs)
    this.loadFilterOptions();

    // Étendre le prédicat de filtre pour prendre en compte les filtres avancés
    const baseFilter = this.dataSource.filterPredicate;
    this.dataSource.filterPredicate = (data: UiProduct, filter: string) => {
      let ok = true;
      try {
        const f = JSON.parse(filter || '{}');
        const text = (f.text || '').toString();
        // 1) Filtre texte (réutilise le prédicat défini plus haut)
        if (text) {
          this.dataSource.filter = text; // temporarily set for baseFilter
          ok = baseFilter ? baseFilter.call(this.dataSource, data, text) : ok;
        }
        if (!ok) return false;
        // 2) Catégories
        if (Array.isArray(f.categoryIds) && f.categoryIds.length) {
          const cid = data.category?.id ?? data.category_id;
          if (!cid || !f.categoryIds.includes(cid)) return false;
        }
        // 3) Fournisseurs
        if (Array.isArray(f.supplierIds) && f.supplierIds.length) {
          const sid = data.supplier?.id ?? data.supplier_id;
          if (!sid || !f.supplierIds.includes(sid)) return false;
        }
        // 4) Statut de stock
        if (f.stock && f.stock !== 'all') {
          const q = Number(data.quantity ?? 0);
          if (f.stock === 'in_stock' && q <= 0) return false;
          if (f.stock === 'low' && !(q > 0 && q <= 5)) return false;
          if (f.stock === 'out' && q !== 0) return false;
        }
        // 5) Plage de prix
        if (f.min != null && data.price < Number(f.min)) return false;
        if (f.max != null && data.price > Number(f.max)) return false;
        return true;
      } catch {
        // fallback au prédicat existant si parsing échoue
        return baseFilter ? baseFilter.call(this.dataSource, data, filter) : true;
      }
    };
  }

  // Sélection multiple
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  // Bascule la sélection de toutes les lignes
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  // Alias pour compatibilité avec les snippets existants
  toggleAllRows(): void {
    this.masterToggle();
  }

  // Obtient le libellé de la case à cocher
  checkboxLabel(row?: UiProduct): string {
    if (!row) {
      return `${this.isAllSelected() ? 'désélectionner' : 'sélectionner'} tout`;
    }
    return `${this.selection.isSelected(row) ? 'désélectionner' : 'sélectionner'} la ligne ${row.id}`;
  }

  // Suppression en masse des éléments sélectionnés
  deleteSelected(): void {
    const selected = this.selection.selected;
    if (!selected.length) return;

    this.notify
      .confirm({ title: 'Supprimer la sélection', text: `Supprimer ${selected.length} produit(s) ?` })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.loading = true;

        // Supprimer un par un via le service; l'interceptor affichera le loader
        const ids = selected.map(p => p.id).filter((id): id is number => typeof id === 'number');
        if (!ids.length) {
          this.loading = false;
          return;
        }

        let successCount = 0;
        let completed = 0;
        ids.forEach((id) => {
          this.productService.deleteProduct(id).subscribe({
            next: () => { successCount++; },
            error: (error) => {
              console.error('Erreur suppression produit', id, error);
            },
            complete: () => {
              completed++;
              if (completed === ids.length) {
                // Mettre à jour la dataSource localement
                const remaining = this.dataSource.data.filter(p => !ids.includes(p.id!));
                this.dataSource.data = remaining;
                productsDataSubject.next(remaining);
                this.totalProducts = remaining.length;
                this.selection.clear();
                this.loading = false;
                if (successCount > 0) {
                  this.notify.successToast(`${successCount} produit(s) supprimé(s)`);
                }
              }
            }
          });
        });
      });
  }

  // Ajouter un produit au panier
  onAddToCart(product: UiProduct): void {
    const dialogRef = this.dialog.open(AddCartModalDialog, {
      data: {
        mode: 'edit',
        src: this.getProductImageUrl(product),
        title: product.name,
        price: product.price,
        description: product.description,
        quantity: product.quantity,
        availableStock: product.quantity ?? 0,
        productId: product.id!,
        categoryName: product.category?.name,
        onStockUpdate: this.updateProductStock.bind(this)
      },
      panelClass: ['modal-dark-theme', 'product-dialog-content'],
      maxWidth: '65vw',
      width: '440px',
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(() => {
    });
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/products/Product.png';
  }
}

@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="image-only-container image-preview-dialog-content modal-dark-theme">
      <button mat-icon-button class="close-btn" (click)="onClose()" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>
      <img [src]="data.src" [alt]="data.title" (error)="onImgError($event)" />
    </div>
  `,
  styles: [`
    .image-only-container { 
      position: relative; 
      padding: 12px; 
      background: var(--bs-modal-bg, #fff);
      color: var(--bs-body-color, #212529);
      border-radius: 10px;
    }
    .image-only-container img { 
      display: block; 
      max-width: 100%; 
      max-height: 80vh; 
      width: auto; 
      height: auto; 
      border-radius: 8px; 
      margin: 0 auto; 
    }
    .close-btn { 
      position: absolute; 
      top: 4px; 
      right: 4px; 
      background: rgba(0,0,0,0.4); 
      color: #fff; 
    }
    
    /* Mode sombre spécifique */
    @media (prefers-color-scheme: dark) {
      .image-only-container {
        background: var(--bs-modal-bg, #1a1a1a);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .close-btn {
        background: rgba(0,0,0,0.6);
        color: #ffffff;
      }
      .close-btn:hover {
        background: rgba(0,0,0,0.8);
      }
    }
    
    /* Support pour les classes de thème Angular Material */
    .dark-theme .image-only-container {
      background: var(--bs-modal-bg, #1a1a1a) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    }
    .dark-theme .close-btn {
      background: rgba(0,0,0,0.6) !important;
      color: #ffffff !important;
    }
    .dark-theme .close-btn:hover {
      background: rgba(0,0,0,0.8) !important;
    }
  `]
})
export class ImagePreviewDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { src: string; title: string },
    private dialogRef: MatDialogRef<ImagePreviewDialog>
  ) {}

  onClose(): void { this.dialogRef.close(); }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/products/Product.png';
  }
}

@Component({
  selector: 'app-product-modal-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content product-dialog-content modal-dark-theme">
        <div class="modal-body">
          <!-- Edit layout: image left, details right -->
          <div class="edit-layout" *ngIf="data.mode === 'edit'; else viewLayout">
            <div class="left">
              <div class="image-holder">
                <img [src]="data.src" [alt]="data.title" (error)="onImgError($event)" />
              </div>
            </div>
            <div class="right">
              <div class="summary">
                <div class="summary-content">
                  <div class="product-header d-flex justify-content-between mt-2">
                    <h3 class="display-7 m-0">{{ data.title }}</h3>
                    <div class="modal-close-btn">
                      <button mat-icon-button aria-label="Close" (click)="onClose()">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  </div>
                  <span class="product-price fs-3">{{ data.price | currency:'USD':'symbol' }}</span>
                  <div class="product-details">
                    <p class="fs-7 m-0">{{ charLimit(data.description) }}</p>
                  </div>
                  <br>                  
                  <div class="variations-form">
                    <div class="row align-items-center g-2">
                      <div class="col-12">
                        <div class="stock-info mb-2">
                          <small class="text-muted">Stock disponible: {{ maxQty }}</small>
                        </div>
                        <div class="quantity d-flex pb-2">
                          <button type="button" class="qty-number btn-icon" (click)="decQty()" [disabled]="maxQty === 0">-</button>
                          <input type="number" class="input-text text-center" min="1" [max]="maxQty" [value]="qty" (change)="onInputQty($event)" [disabled]="maxQty === 0" />
                          <button type="button" class="qty-number btn-icon" (click)="incQty()" [disabled]="qty >= maxQty || maxQty === 0">+</button>
                        </div>
                      </div>
                      <div class="col-12 d-flex gap-8">
                        <button mat-stroked-button color="warn" *ngIf="maxQty === 0">Out of stock</button>
                        <button mat-flat-button color="primary" (click)="addToCart()" [disabled]="maxQty === 0">Add to cart</button>
                      </div>
                    </div>
                  </div>
                  <br>                  
                  <div class="categories d-flex flex-wrap pt-2">
                    <strong class="pe-2">Categorie : </strong>
                    <a href="#" title="categories">&nbsp;{{ data.categoryName || 'Non catégorisé' }}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- View layout: stacked, simplified -->
          <ng-template #viewLayout>
            <div class="view-layout">
              <div class="image-holder">
                <img [src]="data.src" [alt]="data.title" (error)="onImgError($event)" />
              </div>
              <div class="summary">
                <div class="summary-content">
                  <div class="product-header d-flex justify-content-between mt-2">
                    <h3 class="display-7 m-0">{{ data.title }}</h3>
                    <div class="modal-close-btn">
                      <button mat-icon-button aria-label="Close" (click)="onClose()">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  </div>
                  <span class="product-price fs-3">{{ data.price | currency:'USD':'symbol' }}</span>
                  <div class="product-details">
                    <p class="fs-7 m-0">{{ data.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .modal-dialog { width: 100%; max-width: var(--bs-modal-width, 440px); margin: 0 auto; }
    .modal-content { 
      background: var(--bs-modal-bg, #fff); 
      border-radius: 10px; 
      box-shadow: 0 6px 18px rgba(0,0,0,0.16); 
      color: var(--bs-body-color, #212529);
    }
    .modal-body { padding: 20px; }
    .image-holder img { width: 100%; height: auto; max-height: 260px; object-fit: cover; border-radius: 12px; display: block; }
    .edit-layout { display: flex; gap: 20px; align-items: flex-start; }
    .edit-layout .left { flex: 1 1 45%; }
    .edit-layout .right { flex: 1 1 55%; }
    .view-layout { display: flex; flex-direction: column; gap: 14px; }
    .summary-content .product-header { margin-top: 6px; margin-bottom: 12px; }
    .summary-content .product-header h3 { color: var(--bs-heading-color, inherit); }
    .summary-content .product-price { display: inline-block; margin: 8px 0 14px; color: var(--bs-success, #198754); }
    .summary-content .product-details p { margin: 10px 0 16px; line-height: 1.7; color: var(--bs-body-color, #212529); }
    .select { list-style: none; padding: 0; margin: 12px 0 16px; color: var(--bs-body-color, #212529); }
    .select li { margin-bottom: 8px; }
    .select li strong { color: var(--bs-heading-color, inherit); }
    .quantity { align-items: center; gap: 12px; margin-bottom: 12px; }
    .btn-icon { 
      width: 36px; height: 36px; border-radius: 10px; 
      border: 1px solid rgba(0,0,0,.2); 
      background: #fff; 
      cursor: pointer; font-size: 16px; line-height: 1;
      color: var(--bs-body-color, #212529);
    }
    .input-text { 
      width: 70px; height: 36px; border-radius: 10px; 
      border: 1px solid rgba(0,0,0,.2); 
      background: #fff;
      color: var(--bs-body-color, #212529);
    }
    .stock-info small { color: var(--bs-secondary, #6c757d); }
    .categories { color: var(--bs-body-color, #212529); }
    .categories strong { color: var(--bs-heading-color, inherit); }
    .categories a { color: var(--bs-link-color, #0d6efd); text-decoration: none; }
    .categories a:hover { color: var(--bs-link-hover-color, #0a58ca); }
    .gap-8 { gap: 12px; }
    
    /* Mode sombre spécifique */
    @media (prefers-color-scheme: dark) {
      .modal-content { 
        background: var(--bs-modal-bg, #1a1a1a); 
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 6px 18px rgba(0,0,0,0.4);
      }
      .btn-icon { 
        background: #2d2d2d; 
        border-color: rgba(255,255,255,0.2);
        color: #ffffff;
      }
      .btn-icon:hover { background: #3d3d3d; }
      .btn-icon:disabled { background: #1a1a1a; color: #666; }
      .input-text { 
        background: #2d2d2d; 
        border-color: rgba(255,255,255,0.2);
        color: #ffffff;
      }
      .input-text:focus { border-color: var(--bs-primary, #0d6efd); }
    }
    
    /* Support pour les classes de thème Angular Material */
    .dark-theme .modal-content {
      background: var(--bs-modal-bg, #1a1a1a) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      box-shadow: 0 6px 18px rgba(0,0,0,0.4) !important;
    }
    .dark-theme .btn-icon {
      background: #2d2d2d !important;
      border-color: rgba(255,255,255,0.2) !important;
      color: #ffffff !important;
    }
    .dark-theme .btn-icon:hover {
      background: #3d3d3d !important;
    }
    .dark-theme .btn-icon:disabled {
      background: #1a1a1a !important;
      color: #666 !important;
    }
    .dark-theme .input-text {
      background: #2d2d2d !important;
      border-color: rgba(255,255,255,0.2) !important;
      color: #ffffff !important;
    }
    .dark-theme .input-text:focus {
      border-color: var(--bs-primary, #0d6efd) !important;
    }
  `]
})
export class AddCartModalDialog {
  qty: number;
  maxQty: number;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { 
      mode: 'view' | 'edit'; 
      src: string; 
      title: string; 
      price: number; 
      description: string; 
      quantity: number; 
      availableStock: number; 
      productId: number;
      categoryName?: string;
      onStockUpdate: (productId: number, quantityChange: number) => void 
    },
    private dialogRef: MatDialogRef<AddCartModalDialog>,
    private cart: CartService,
    private snackBar: MatSnackBar
  ) {
    this.maxQty = this.data.availableStock || this.data.quantity || 1;
    this.qty = Math.min(Math.max(1, this.data.quantity ?? 1), this.maxQty);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/products/Product.png';
  }

  incQty(): void { 
    if (this.qty < this.maxQty) {
      this.qty++;
    }
  }
  
  decQty(): void { 
    this.qty = Math.max(1, this.qty - 1); 
  }
  
  onInputQty(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.qty = Math.min(Math.max(1, isNaN(val) ? 1 : Math.floor(val)), this.maxQty);
  }

  // Local utility: truncate to a max character length
  charLimit(value: string | null | undefined, max = 45): string {
    if (!value) return '';
    const str = value.toString().replace(/\n/g, ' ');
    if (str.length <= max) return str;
    return str.slice(0, max).trimEnd() + '…';
  }

  addToCart(): void {
    // Validation finale du stock
    if (this.qty > this.maxQty) {
      this.snackBar.open(`Quantité indisponible. Stock restant: ${this.maxQty}`, 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }
    
    const cartItem: Omit<CartItem, 'quantity'> = {
      id: this.data.productId ?? Date.now(),
      uname: this.data.title,
      imagePath: this.data.src,
      price: this.data.price,
      maxQty: this.maxQty
    };
    
    this.cart.addItem(cartItem, this.qty);
    
    // Mettre à jour le stock global via le callback
    this.data.onStockUpdate(this.data.productId, this.qty);
    
    this.snackBar.open(`${this.data.title} ajouté au panier`, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
    
    this.dialogRef.close();
  }
}
