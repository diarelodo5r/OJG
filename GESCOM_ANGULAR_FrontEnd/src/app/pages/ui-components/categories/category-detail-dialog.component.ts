import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { ProductCategory } from '../../../models/product.interface';

@Component({
  selector: 'app-category-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modal-dialog modal-dialog-centered modal-md">
  <div class="modal-content app-dialog">
    <div class="app-dialog-body">
      <div class="app-dialog-header">
        <div class="title">
          <mat-icon>description</mat-icon>
          <div class="text">
            <h3 class="m-0">Détails de la catégorie</h3>
            <small class="muted">Informations de la catégorie</small>
          </div>
        </div>
        <button mat-icon-button aria-label="Fermer" (click)="onCancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    <mat-dialog-content class="mat-typography app-dialog-body">
      <div class="app-detail-layout">
        <div class="app-detail-left">
          <div class="app-surface-card">
            <div class="content">
              <div class="row mb-2">
                <div class="col-4 fw-bold">Nom:</div>
                <div class="col-8">{{ data.category.name }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-4 fw-bold">Description:</div>
                <div class="col-8">{{ data.category.description || 'N/A' }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-4 fw-bold">Créé le:</div>
                <div class="col-8">{{ data.category.created_at | date:'mediumDate' }}</div>
              </div>
            </div>
          </div>
        </div>
        </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="mt-3">
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
})
export class CategoryDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CategoryDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { category: ProductCategory }
  ) {}
  onCancel(): void { this.dialogRef.close(); }
}
