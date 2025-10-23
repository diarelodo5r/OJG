import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { User } from '../../../models/product.interface';

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
  <div class="modal-dialog modal-dialog-centered modal-md">
  <div class="modal-content app-dialog">
    <div class="app-dialog-body">
      <div class="app-dialog-header">
        <div class="title">
          <mat-icon>person</mat-icon>
          <div class="text">
            <h3 class="m-0">Détails de l'utilisateur</h3>
            <small class="muted">Informations de l'utilisateur</small>
          </div>
        </div>
        <button mat-icon-button aria-label="Fermer" (click)="onCancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

    <mat-dialog-content class="mat-typography">
      <div class="row">
        <div class="col-md-5">
          <div class="product-image-container text-center mb-3">
            <img [src]="data.src || 'assets/images/profile/user-7.jpg'"
                 [alt]="displayName"
                 class="img-fluid rounded"
                 (error)="$event.target.src = 'assets/images/profile/user-7.jpg'">
          </div>
        </div>

        <div class="col-md-7">
          <h3 class="mb-3">{{ displayName }}</h3>

          <div class="product-details">
            <div class="row mb-2">
              <div class="col-4 fw-bold">Email:</div>
              <div class="col-8">{{ emailValue }}</div>
            </div>

            <div class="row mb-2">
              <div class="col-4 fw-bold">Balance:</div>
              <div class="col-8">{{ balance }}</div>
            </div>

            <div class="row mb-2">
              <div class="col-4 fw-bold">Créé le:</div>
              <div class="col-8">{{ createdAt }}</div>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="mt-3">
      <button mat-button mat-dialog-close class="me-2">Fermer</button>
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
export class UserDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User; src?: string }
  ) {}

  get displayName(): string {
    const u: any = this.data?.user || {};
    return u.username || u.name || `User #${u.id}`;
  }

  get emailValue(): string {
    return this.data?.user?.email || 'N/A';
  }

  get balance(): number {
    const u: any = this.data?.user || {};
    const b = u.balance;
    if (typeof b === 'number') return b;
    const n = Number(b);
    return isNaN(n) ? 0 : n;
  }

  get createdAt(): string {
    const raw = (this.data?.user as any)?.created_at;
    try {
      return raw ? new Date(raw).toLocaleDateString() : 'Non spécifiée';
    } catch {
      return 'Non spécifiée';
    }
  }
  onCancel(): void { this.dialogRef.close(); };
}
