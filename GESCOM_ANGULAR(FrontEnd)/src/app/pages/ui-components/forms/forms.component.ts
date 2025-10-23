import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClientModule } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  seller_id: number;
  category_id: number;
  supplier_id: number;
  photo?: File;
}

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BulkPreviewDialogComponent } from './bulk-preview-dialog.component';

// Angular Core
import { CommonModule } from '@angular/common';


// Services
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { NotifyService } from '../../../services/notify.service';
import { FxRateService } from '../../../services/fx-rate.service';

// Models
import { Product, ProductCategory, Supplier } from '../../../models/product.interface';

// Environment
import { environment } from '../../../environment';

interface SelectOption {
  value: number | string;
  viewValue: string;
}

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    MatSlideToggleModule,
    MatDialogModule
  ],
  templateUrl: './forms.component.html',
  styleUrls: ['./forms.component.scss'],
})
export class AppFormsComponent implements OnInit {
  productForm!: FormGroup;
  bulkForm!: FormGroup; // holds FormArray for bulk
  categories: ProductCategory[] = [];
  suppliers: Supplier[] = [];
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSubmitting = false;
  bulkMode = false;
  creatingCategory = false;
  newCategoryName = new FormControl('', [Validators.required, Validators.minLength(3)]);
  creatingSupplier = false;
  newSupplierForm!: FormGroup;
  // FX converter state
  showConverter = false;
  fxFrom = 'USD';
  fxTo = 'EUR';
  fxAmount: number | null = null;
  fxConverted: number | null = null;
  fxRate: number | null = null;
  fxLoading = false;
  fxError: string | null = null;
  currencies = [
    'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY', 'XOF', 'MAD'
  ];
  
  // Products table properties
  products: Product[] = [];
  displayedColumns: string[] = ['photo', 'name', 'description', 'price', 'quantity', 'category', 'supplier'];
  totalProducts = 0;
  pageSize = 10;
  pageIndex = 0;
  sortField = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';
  loading = false;
  apiUrl = environment.apiBaseUrl;
  defaultImage = 'assets/images/products/Product.png';
  // Base host (sans suffixe /api) pour servir les fichiers sous /storage
  private apiHostBase = this.apiUrl.replace(/\/?api\/?$/, '');
  
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private auth: AuthService,
    private notify: NotifyService,
    private fx: FxRateService,
    private dialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.initializeForm();
    this.initializeBulkForm();
    this.newSupplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      contact_email: ['', [Validators.email]],
      contact_phone: [''],
      address: [''],
    });
    this.loadDropdownData();
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading = true;
    const params = {
      page: this.pageIndex + 1,
      per_page: this.pageSize,
      sort_by: this.sortField,
      sort_direction: this.sortDirection // Now this matches the expected type
    };

    this.productService.getProducts(params).subscribe({
      next: (response: any) => {
        this.products = response.data || [];
        this.totalProducts = response.meta?.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits:', error);
        this.notify.error('Erreur lors du chargement des produits');
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  onSortChange(sort: Sort): void {
    this.sortField = sort.active;
    this.sortDirection = sort.direction || 'asc';
    this.loadProducts();
  }

  getProductImageUrl(photoPath: string | null): string {
    if (!photoPath) {
      return this.defaultImage;
    }
    const path = photoPath.toString();
    // Déjà une URL complète ou un asset local
    if (path.startsWith('http') || path.startsWith('assets/')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // Chemin de stockage renvoyé par le backend
    if (cleanPath.startsWith('/storage/')) {
      return `${this.apiHostBase}${cleanPath}`;
    }
    // Fallback: traiter comme chemin relatif d'API
    return `${this.apiUrl}${cleanPath}`;
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      category_id: [null, [Validators.required]],
      supplier_id: [null, [Validators.required]]
    });
  }

  private initializeBulkForm(): void {
    this.bulkForm = this.fb.group({
      products: this.fb.array([])
    });
    // Start with one row for convenience
    this.addBulkRow();
  }

  private buildBulkRow(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      category_id: [null, [Validators.required]],
      supplier_id: [null, [Validators.required]]
    });
  }

  get productsArray(): FormArray {
    return this.bulkForm.get('products') as FormArray;
  }

  addBulkRow(): void {
    this.productsArray.push(this.buildBulkRow());
  }

  removeBulkRow(index: number): void {
    if (this.productsArray.length > 1) {
      this.productsArray.removeAt(index);
    }
  }

  // Helper to resolve index from a row reference (safer than trusting a stale index)
  private indexOfRow(row: AbstractControl): number {
    return this.productsArray.controls.indexOf(row);
  }

  removeBulkRowRef(row: AbstractControl): void {
    const idx = this.indexOfRow(row);
    if (idx >= 0 && this.productsArray.length > 1) {
      this.productsArray.removeAt(idx);
    }
  }

  duplicateBulkRow(index: number): void {
    const src = this.productsArray.at(index) as FormGroup;
    if (!src) return;
    const clone = this.fb.group({
      name: [src.get('name')?.value, [Validators.required, Validators.minLength(3)]],
      description: [src.get('description')?.value, [Validators.required, Validators.minLength(10)]],
      price: [src.get('price')?.value, [Validators.required, Validators.min(0.01)]],
      quantity: [src.get('quantity')?.value, [Validators.required, Validators.min(0)]],
      category_id: [src.get('category_id')?.value, [Validators.required]],
      supplier_id: [src.get('supplier_id')?.value, [Validators.required]]
    });
    this.productsArray.insert(index + 1, clone);
  }

  duplicateBulkRowRef(row: AbstractControl): void {
    const idx = this.indexOfRow(row);
    if (idx >= 0) {
      this.duplicateBulkRow(idx);
    }
  }

  toggleBulkMode(): void {
    this.bulkMode = !this.bulkMode;
  }

  // Supplier inline creation
  toggleCreateSupplier() {
    this.creatingSupplier = !this.creatingSupplier;
    if (!this.creatingSupplier) {
      this.newSupplierForm.reset({ name: '', contact_email: '', contact_phone: '', address: '' });
    }
  }

  createSupplier() {
    if (this.newSupplierForm.invalid) {
      this.newSupplierForm.markAllAsTouched();
      return;
    }
    const payload = this.newSupplierForm.value as any;
    this.notify
      .confirm({ title: 'Confirmer', text: 'Créer ce fournisseur ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.createSupplier(payload).subscribe({
          next: (s) => {
            this.suppliers = [s, ...this.suppliers];
            this.productForm.patchValue({ supplier_id: s.id });
            this.creatingSupplier = false;
            this.newSupplierForm.reset({ name: '', contact_email: '', contact_phone: '', address: '' });
            this.notify.success('Fournisseur créé');
          },
          error: () => {
            this.notify.error('Impossible de créer le fournisseur');
          },
        });
      });
  }

  private onSubmitBulk(): void {
    // validate all rows
    if (this.bulkForm.invalid || this.productsArray.length === 0) {
      this.productsArray.controls.forEach(ctrl => (ctrl as FormGroup).markAllAsTouched());
      this.notify.error('Veuillez corriger les lignes invalides');
      return;
    }

    const rows = this.productsArray.controls.map(c => (c as FormGroup).value);
    const dialogRef = this.dialog.open(BulkPreviewDialogComponent, {
      width: '900px',
      data: {
        rows,
        categories: this.categories,
        suppliers: this.suppliers
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      const sellerId = this.auth.getCurrentUserId();
      if (!sellerId) {
        this.notify.error('Utilisateur non authentifié.');
        return;
      }

      this.isSubmitting = true;

      let successCount = 0;
      let failCount = 0;

      const processNext = (i: number) => {
        if (i >= rows.length) {
          this.isSubmitting = false;
          this.notify.success(`${successCount} produit(s) enregistré(s), ${failCount} échec(s)`);
          this.loadProducts();
          if (successCount > 0) {
            this.bulkForm.reset({ products: [] });
            this.productsArray.clear();
            this.addBulkRow();
          }
          return;
        }
        const row = rows[i];
        const payload: ProductFormData = {
          ...row,
          seller_id: sellerId,
        } as any;
        this.productService.createProduct(payload).subscribe({
          next: () => {
            successCount++;
            processNext(i + 1);
          },
          error: () => {
            failCount++;
            processNext(i + 1);
          }
        });
      };

      processNext(0);
    });
  }

  private loadDropdownData(): void {
    // Charger les catégories
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    });

    // Charger les fournisseurs
    this.productService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fournisseurs:', error);
      }
    });

    // Pas de sélection de vendeur: on utilisera l'utilisateur connecté côté submit
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!allowed.includes(file.type)) {
        this.notify.error('Format d\'image invalide. Formats autorisés: JPG, PNG, WEBP');
        input.value = '';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }
      if (file.size > maxSize) {
        this.notify.error('Image trop lourde (max 5MB)');
        input.value = '';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }
      this.selectedFile = file;
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(): void {
    if (this.bulkMode) {
      this.onSubmitBulk();
      return;
    }
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.notify
      .confirm({ title: "Confirmer l'enregistrement", text: 'Voulez-vous enregistrer ce produit maintenant ?' })
      .then((res) => {
        if (!res.isConfirmed) return;

        this.isSubmitting = true;
        const sellerId = this.auth.getCurrentUserId();
        if (!sellerId) {
          this.isSubmitting = false;
          this.notify.error('Utilisateur non authentifié.');
          return;
        }

        // Créer le produit en une SEULE requête: inclure la photo si présente
        const productData: ProductFormData = {
          ...this.productForm.value,
          seller_id: sellerId,
          photo: this.selectedFile || undefined
        } as ProductFormData;

        this.productService.createProduct(productData).subscribe({
          next: () => {
            const hasPhoto = !!this.selectedFile;
            this.notify.success(hasPhoto ? 'Produit et photo enregistrés avec succès' : 'Produit créé avec succès');
            this.resetForm();
            this.isSubmitting = false;
            this.loadProducts();
          },
          error: (error) => {
            this.isSubmitting = false;
            // Tenter d'extraire les messages de validation du backend (Laravel: error.error.errors)
            const backendErrors = error?.error?.errors || error?.error;
            if (backendErrors) {
              let messages: string[] = [];
              if (typeof backendErrors === 'object') {
                for (const key of Object.keys(backendErrors)) {
                  const val = backendErrors[key];
                  if (Array.isArray(val)) messages.push(...val);
                  else if (typeof val === 'string') messages.push(val);
                  // Mapper les erreurs sur les contrôles connus pour affichage visuel
                  const ctrl = this.productForm.get(key);
                  if (ctrl) {
                    ctrl.setErrors({ backend: true });
                    ctrl.markAsTouched();
                  }
                }
              } else if (typeof backendErrors === 'string') {
                messages.push(backendErrors);
              }
              if (messages.length) {
                this.notify.error(messages.join('\n'));
                return;
              }
            }
            this.notify.error('Erreur lors de la création du produit');
          }
        });
      });
  }

  resetForm(): void {
    this.productForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
  }

  // Helper methods for form validation
  get name() { return this.productForm.get('name'); }
  get description() { return this.productForm.get('description'); }
  get price() { return this.productForm.get('price'); }
  get quantity() { return this.productForm.get('quantity'); }
  get seller_id() { return this.productForm.get('seller_id'); }
  get category_id() { return this.productForm.get('category_id'); }
  get supplier_id() { return this.productForm.get('supplier_id'); }

  // FX converter methods
  toggleConverter() {
    this.showConverter = !this.showConverter;
    this.fxError = null;
  }

  convertCurrency() {
    this.fxError = null;
    this.fxConverted = null;
    this.fxRate = null;
    const amount = Number(this.fxAmount);
    if (!this.fxFrom || !this.fxTo || isNaN(amount) || amount <= 0) {
      this.fxError = 'Montant ou devises invalides';
      return;
    }
    this.fxLoading = true;
    this.fx.convert(this.fxFrom, this.fxTo, amount).subscribe({
      next: (res) => {
        this.fxConverted = Number(res.amount.toFixed(2));
        this.fxRate = res.rate;
        this.fxLoading = false;
      },
      error: () => {
        this.fxError = 'Conversion indisponible pour le moment';
        this.fxLoading = false;
      }
    });
  }

  applyConvertedToPrice() {
    if (this.fxConverted == null) return;
    // Apply converted amount to the EUR price control
    this.productForm.patchValue({ price: this.fxConverted });
    // Mark as touched to trigger validators
    this.price?.markAsTouched();
  }

  // Category inline creation
  toggleCreateCategory() {
    this.creatingCategory = !this.creatingCategory;
    if (!this.creatingCategory) {
      this.newCategoryName.reset('');
    }
  }

  createCategory() {
    if (this.newCategoryName.invalid) {
      this.newCategoryName.markAsTouched();
      return;
    }
    const name = this.newCategoryName.value as string;
    this.notify
      .confirm({ title: 'Confirmer', text: 'Créer cette catégorie ?' })
      .then((res) => {
        if (!res.isConfirmed) return;
        this.productService.createCategory({ name }).subscribe({
          next: (cat) => {
            this.categories = [cat, ...this.categories];
            this.productForm.patchValue({ category_id: cat.id });
            this.creatingCategory = false;
            this.newCategoryName.reset('');
            this.notify.success('Catégorie créée');
          },
          error: () => {
            this.notify.error('Impossible de créer la catégorie');
          },
        });
      });
  }
}
