import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import type { Product } from '../../../interfaces/index.js';
import type { Category, Supplier } from '../../../interfaces/index.js';

type DialogProduct = Product & { reference?: string; category?: Category; supplier?: Supplier };

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
  <div class="modal-dialog modal-dialog-centered modal-md">
  <div class="modal-content app-dialog">
    <div class="app-dialog-body">
      <div class="app-dialog-header">
        <div class="title">
          <mat-icon>description</mat-icon>
          <div class="text">
            <h3 class="m-0">Détails du produit</h3>
            <small class="muted">Informations du produit</small>
          </div>
        </div>
        <button mat-icon-button aria-label="Fermer" (click)="onCancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    <mat-dialog-content class="mat-typography app-dialog-body">
      <div class="app-detail-layout">
        <div class="app-detail-left">
          <div class="app-image-holder">
            <img [src]="data.src || getProductImageUrlFromPath(data.product.photo)"
                 [alt]="data.product.name"
                 (error)="$event.target.src = 'assets/images/products/Product.png'" />
          </div>
        </div>
        <div class="app-detail-right">
          <h3 class="mb-3">{{ data.product.name }}</h3>
          <div class="app-surface-card">
            <div class="content">
              <div class="row mb-2">
                <div class="col-4 fw-bold">Référence:</div>
                <div class="col-8">{{ data.product.reference || 'N/A' }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-4 fw-bold">Prix:</div>
                <div class="col-8">{{ data.product.price | currency:'XAF':'symbol':'1.0-0' }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-4 fw-bold">Stock:</div>
                <div class="col-8">
                  <span [class.text-warning]="data.product.quantity <= 5"
                        [class.text-danger]="data.product.quantity === 0">
                    {{ data.product.quantity }}
                    <mat-icon *ngIf="data.product.quantity === 0" class="text-danger" style="font-size: 16px; height: 16px; width: 16px; vertical-align: text-top;">error_outline</mat-icon>
                  </span>
                </div>
              </div>
              <div class="row mb-2" *ngIf="data.product.category">
                <div class="col-4 fw-bold">Catégorie:</div>
                <div class="col-8">{{ data.product.category.name }}</div>
              </div>
              <div class="row mb-2" *ngIf="data.product.supplier">
                <div class="col-4 fw-bold">Fournisseur:</div>
                <div class="col-8">{{ data.product.supplier.name }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-4 fw-bold">Date d'ajout:</div>
                <div class="col-8">{{ data.product.created_at ? (data.product.created_at | date:'mediumDate') : 'Non spécifiée' }}</div>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <h5 class="fw-bold">Description</h5>
            <p class="text-muted">{{ data.product.description || 'Aucune description disponible pour ce produit.' }}</p>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="mt-3">
      <button mat-button mat-dialog-close class="me-2">Fermer</button>
      <button mat-raised-button color="primary" (click)="onEdit()">
        <mat-icon>edit</mat-icon> Modifier
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .product-image-container {
      max-height: 300px;
      overflow: hidden;
      border-radius: 8px;
    }
    .product-image-container img {
      max-height: 300px;
      width: auto;
      object-fit: contain;
    }
    .product-details {
      padding: 15px;
      border-radius: 8px;
    }
  `]
})
export class ProductDetailDialog {
  constructor(
    public dialogRef: MatDialogRef<ProductDetailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { product: DialogProduct; src?: string }
  ) {}

  getProductImageUrlFromPath(photoPath: string | undefined): string {
    if (!photoPath) return 'assets/images/products/Product.png';
    if (photoPath.startsWith('http') || photoPath.startsWith('assets/') || photoPath.startsWith('blob:')) return photoPath;
    const apiUrl = 'http://localhost:8000/api';
    const clean = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
    if (clean.startsWith('/storage/')) {
      const host = apiUrl.replace(/\/?api\/?$/, '');
      return `${host}${clean}`;
    }
    return `${apiUrl}${clean}`;
  }
  onCancel(): void { this.dialogRef.close(); };
  onEdit(): void {
    this.dialogRef.close({ action: 'edit', product: this.data.product });
  }
}
