import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../services/product.service';
import type { Product } from '../../../interfaces/index.js';
import { ImagePreviewDialog } from './tables.component';
import { NotifyService } from '../../../services/notify.service';

@Component({
  selector: 'app-edit-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content app-dialog">
        <div class="app-dialog-body">
          <div class="app-dialog-header">
            <div class="title">
              <mat-icon>edit</mat-icon>
              <div class="text">
                <h3 class="m-0">Modifier le produit</h3>
                <small class="muted">Mettez à jour les informations et la photo</small>
              </div>
            </div>
            <button mat-icon-button aria-label="Close" (click)="onCancel()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="app-detail-layout" [formGroup]="form">
            <div class="app-detail-left">
              <div class="app-image-holder">
                <img [src]="previewUrl || currentImageUrl" [alt]="form.value.name || 'Produit'" (error)="onImgError($event)" (click)="openImagePreview()" style="cursor: pointer;" />
                <button class="image-action" mat-mini-fab color="primary" (click)="fileInput.click()" [disabled]="loading" aria-label="Changer la photo">
                  <mat-icon>photo_camera</mat-icon>
                </button>
                <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)" />
              </div>
            </div>
            <div class="app-detail-right">
              <div class="app-surface-card">
                <div class="content">
                  <div class="form-grid">
                    <mat-form-field appearance="outline" class="w-100">
                      <mat-label>Nom</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-100">
                      <mat-label>Description</mat-label>
                      <textarea matInput rows="3" formControlName="description"></textarea>
                    </mat-form-field>

                    <div class="row-cols-2">
                      <mat-form-field appearance="outline" class="w-100">
                        <mat-label>Prix</mat-label>
                        <input type="number" matInput formControlName="price" />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w-100">
                        <mat-label>Quantité</mat-label>
                        <input type="number" matInput formControlName="quantity" />
                      </mat-form-field>
                    </div>

                    <div class="row-cols-2">
                      <mat-form-field appearance="outline" class="w-100">
                        <mat-label>Catégorie</mat-label>
                        <mat-select formControlName="category_id">
                          <mat-option [value]="null">Aucune</mat-option>
                          <mat-option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="w-100">
                        <mat-label>Fournisseur</mat-label>
                        <mat-select formControlName="supplier_id">
                          <mat-option [value]="null">Aucun</mat-option>
                          <mat-option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                  </div>

                  <div class="actions mt-3 d-flex gap-2 justify-content-end">
                    <button mat-button (click)="onCancel()">Annuler</button>
                    <button mat-flat-button color="primary" [disabled]="form.invalid || loading" (click)="onSave()">
                      <mat-icon *ngIf="!loading">save</mat-icon>
                      <span *ngIf="!loading">Enregistrer</span>
                      <span *ngIf="loading"><mat-spinner diameter="20"></mat-spinner></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .modal-content { border-radius: 16px; padding: 0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25); background: var(--app-surface); }
    .modal-body { padding: 16px 20px 20px; background: var(--app-surface); }
    .product-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: linear-gradient(135deg, var(--app-header-grad-1), var(--app-header-grad-2)); margin-bottom: 12px; }
    .product-header-bar .title { display: flex; align-items: center; gap: 12px; }
    .product-header-bar .title mat-icon { color: var(--app-icon); }
    .product-header-bar .title .text h3 { font-weight: 600; font-size: 18px; margin: 0; }
    .product-header-bar .title .text .muted { color: var(--app-text-muted); }
    .edit-layout { display: flex; gap: 24px; align-items: flex-start; }
    .left { flex: 1 1 45%; }
    .right { flex: 1 1 55%; }
    .summary { background: var(--app-surface-2); border: 1px solid var(--app-border); border-radius: 12px; }
    .summary-content { padding: 12px; }
    .image-holder { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--app-border); background: var(--app-surface-2); }
    .image-holder img { width: 100%; height: auto; max-height: 320px; object-fit: cover; display: block; }
    .image-holder .image-action { position: absolute; right: 12px; bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
    .form-grid { display: flex; flex-direction: column; gap: 14px; }
    .row-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .actions { margin-top: 8px; }
    @media (max-width: 900px) {
      .edit-layout { flex-direction: column; }
      .left, .right { flex: 1 1 100%; }
      .image-holder img { max-height: 260px; }
    }
  `]
})
export class EditProductDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  currentImageUrl: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  private objectUrlToRevoke: string | null = null;
  private initialValues!: { name: string; description: string; price: number; quantity: number; seller_id: number | null; category_id: number | null; supplier_id: number | null };
  categories: any[] = [];
  suppliers: any[] = [];
  users: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { product: Product },
    private dialogRef: MatDialogRef<EditProductDialogComponent>,
    private fb: FormBuilder,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private notify: NotifyService,
    private dialog: MatDialog
  ) {
    const p = data.product;
    this.form = this.fb.group({
      name: [p.name || '', [Validators.required, Validators.maxLength(255)]],
      description: [p.description || '', [Validators.maxLength(2000)]],
      price: [p.price ?? 0, [Validators.required, Validators.min(0)]],
      quantity: [p.quantity ?? 0, [Validators.required, Validators.min(0)]],
      seller_id: [((p as any)?.seller_id ?? null)],
      category_id: [((p as any)?.category_id ?? null)],
      supplier_id: [((p as any)?.supplier_id ?? null)],
    });
    this.initialValues = {
      name: this.form.value.name,
      description: this.form.value.description,
      price: this.form.value.price,
      quantity: this.form.value.quantity,
      seller_id: this.form.value.seller_id ?? null,
      category_id: this.form.value.category_id ?? null,
      supplier_id: this.form.value.supplier_id ?? null,
    };
    // Image par défaut initiale (sera remplacée par le blob si accessible)
    const path = (p as any)?.photo || (p as any)?.imagePath;
    this.currentImageUrl = typeof path === 'string' && path.length ? path : 'assets/images/products/Product.png';
  }

  ngOnInit(): void {
    // Charger la photo via l'API GET /products/{id}/photo (protégée) pour afficher l'image la plus à jour
    const id = this.data.product?.id;
    if (!id) return;
    this.productService.getProductPhoto(id).subscribe({
      next: (blob) => {
        if (!(blob instanceof Blob)) return;
        const url = URL.createObjectURL(blob);
        // Révoquer l'ancienne url si existante
        if (this.objectUrlToRevoke) { try { URL.revokeObjectURL(this.objectUrlToRevoke); } catch {} }
        this.objectUrlToRevoke = url;
        this.currentImageUrl = url;
        console.debug('[EditProduct] Loaded product photo via GET /photo');
      },
      error: (err) => {
        // 404 ou 401: garder l'image par défaut / existante
        console.debug('[EditProduct] Photo not available or fetch failed', err?.status ?? err);
      }
    });

    // Charger les listes pour les sélecteurs
    this.productService.getCategories().subscribe({ next: (list) => this.categories = list || [], error: () => this.categories = [] });
    this.productService.getSuppliers().subscribe({ next: (list) => this.suppliers = list || [], error: () => this.suppliers = [] });
    this.productService.getUsers().subscribe({ next: (list) => this.users = list || [], error: () => this.users = [] });
  }

  ngOnDestroy(): void {
    if (this.objectUrlToRevoke) {
      try { URL.revokeObjectURL(this.objectUrlToRevoke); } catch {}
      this.objectUrlToRevoke = null;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid || !this.data.product?.id) return;
    const id = this.data.product.id;
    const value = this.form.value as Partial<Product>;
    const changes: Partial<Product> = {};
    // Ne pousser que les champs modifiés
    (['name','description','price','quantity','seller_id','category_id','supplier_id'] as const).forEach((key) => {
      const oldVal = (this.initialValues as any)[key];
      const newVal = (value as any)[key];
      if (newVal !== oldVal) (changes as any)[key] = newVal;
    });
    // Si pas de changements et pas de nouvelle photo -> rien à faire
    if (!this.selectedFile && Object.keys(changes).length === 0) {
      this.notify.info('Aucune modification détectée');
      this.dialogRef.close();
      return;
    }
    this.loading = true;
    const update$ = Object.keys(changes).length
      ? this.productService.updateProductPartial(id, changes)
      : undefined;

    (update$ ?? ({} as any)).subscribe?.({
      next: (updated: Product) => {
        console.debug('[EditProduct] Product updated, checking photo upload...');
        // Si une nouvelle photo est sélectionnée, uploader ensuite
        if (this.selectedFile) {
          this.productService.uploadProductPhoto(id, this.selectedFile).subscribe({
            next: () => {
              console.debug('[EditProduct] Photo uploaded');
              this.loading = false;
              this.notify.successToast('Produit et photo mis à jour');
              this.dialogRef.close({ updated: { ...updated, photo: (updated as any)?.photo || (updated as any)?.imagePath } });
            },
            error: (err) => {
              console.error('[EditProduct] Photo upload failed', err);
              this.loading = false;
              this.notify.error("Produit mis à jour, mais échec de l'upload de la photo", 'Erreur');
              this.dialogRef.close({ updated });
            }
          });
        } else {
          this.loading = false;
          this.notify.successToast('Produit mis à jour');
          this.dialogRef.close({ updated });
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Erreur maj produit', err);
        const msg = err?.error?.message || 'Erreur lors de la mise à jour';
        this.notify.error(msg, 'Erreur');
      }
    }) ?? (() => {
      // Aucun champ modifié mais il y a une photo à uploader
      this.productService.uploadProductPhoto(id, this.selectedFile!).subscribe({
        next: () => {
          this.loading = false;
          this.notify.successToast('Photo mise à jour');
          this.dialogRef.close({ updated: this.data.product });
        },
        error: (err) => {
          this.loading = false;
          console.error('[EditProduct] Photo upload failed', err);
          this.notify.error("Échec de l'upload de la photo", 'Erreur');
        }
      });
    })();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    if (!allowed.includes(file.type)) {
      this.notify.error('Format image invalide (JPG, PNG, WEBP)', 'Erreur');
      input.value = '';
      return;
    }
    if (file.size > maxSize) {
      this.notify.error('Image trop lourde (max 5MB)', 'Erreur');
      input.value = '';
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.previewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/products/Product.png';
  }

  openImagePreview(): void {
    const src = this.previewUrl || this.currentImageUrl || 'assets/images/products/Product.png';
    this.dialog.open(ImagePreviewDialog, {
      data: { src, title: this.form.value.name || 'Produit' },
      panelClass: ['dialog-dark-theme', 'image-preview-dialog-content'],
      maxWidth: '90vw',
      width: '680px',
    });
  }
}
