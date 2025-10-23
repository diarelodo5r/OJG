interface DestockModalData {
  mode: 'edit';
  src: string;
  title: string;
  price: number;
  description?: string;
  categoryName?: string;
  maxQty: number;
  currentQty?: number;
}

import { ArticlesService } from '../../../services/gescom/articles.service';
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-destock-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, FormsModule],
  template: `
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content product-dialog-content modal-dark-theme">
        <div class="modal-body">
          <!-- Edit layout: image left, details right -->
          <div class="edit-layout">
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
                  <span class="product-price fs-3">{{ formatPrice(data.price) }}</span>
                  <div class="product-details" *ngIf="data.description">
                    <p class="fs-7 m-0">{{ charLimit(data.description) }}</p>
                  </div>
                  <br>
                  <div class="variations-form">
                    <div class="row align-items-center g-2">
                      <div class="col-12">
                        <div class="stock-info mb-2">
                          <small class="text-muted">Stock disponible: {{ data.maxQty }}</small>
                        </div>
                        <div class="quantity d-flex pb-2">
                          <button type="button" class="qty-number btn-icon" (click)="decQty()" [disabled]="data.maxQty === 0 || qty <= 1">-</button>
                          <input type="number" class="input-text text-center" min="1" [max]="data.maxQty" [(ngModel)]="qty" (change)="onInputQty($event)" [disabled]="data.maxQty === 0" />
                          <button type="button" class="qty-number btn-icon" (click)="incQty()" [disabled]="qty >= data.maxQty || data.maxQty === 0">+</button>
                        </div>
                      </div>
                      <div class="col-12 d-flex gap-8">
                        <button mat-stroked-button color="warn" *ngIf="data.maxQty === 0">Stock épuisé</button>
                        <button mat-flat-button color="primary" (click)="destock()" [disabled]="data.maxQty === 0">Déstocker</button>
                      </div>
                    </div>
                  </div>
                  <br>
                  <div class="categories d-flex flex-wrap pt-2" *ngIf="data.categoryName">
                    <strong class="pe-2">Famille : </strong>
                    <a href="#" title="categories">&nbsp;{{ data.categoryName }}</a>
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
    .modal-dialog { width: 100%; max-width: var(440px); margin: 0 auto; }
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
    .summary-content .product-header { margin-top: 6px; margin-bottom: 12px; }
    .summary-content .product-header h3 { color: var(--bs-heading-color, inherit); }
    .summary-content .product-price {
      display: inline-block;
      margin: 8px 0 14px;
      color: var(--bs-success, #198754);
      font-weight: 600;
    }
    .summary-content .product-details p {
      margin: 10px 0 16px;
      line-height: 1.7;
      color: var(--bs-body-color, #212529);
    }
    .quantity { align-items: center; gap: 12px; margin-bottom: 12px; }
    .btn-icon {
      width: 36px; height: 36px; border-radius: 10px;
      border: 1px solid rgba(0,0,0,.2);
      background: #fff;
      cursor: pointer; font-size: 16px; line-height: 1;
      color: var(--bs-body-color, #212529);
      transition: all 0.2s ease;
    }
    .btn-icon:hover:not(:disabled) { background: #f8f9fa; }
    .btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }
    .input-text {
      width: 70px; height: 36px; border-radius: 10px;
      border: 1px solid rgba(0,0,0,.2);
      background: #fff;
      color: var(--bs-body-color, #212529);
      text-align: center;
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
      .btn-icon:hover:not(:disabled) { background: #3d3d3d; }
      .btn-icon:disabled { background: #1a1a1a; color: #666; }
      .input-text {
        background: #2d2d2d;
        border-color: rgba(255,255,255,0.2);
        color: #ffffff;
      }
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
    .dark-theme .btn-icon:hover:not(:disabled) {
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

    @media (max-width: 768px) {
      .edit-layout { flex-direction: column; }
      .edit-layout .left,
      .edit-layout .right { flex: 1 1 100%; }
    }
  `]
})
export class DestockModalComponent implements OnInit {
  qty: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DestockModalData,
    private dialogRef: MatDialogRef<DestockModalComponent>,
    private articlesService: ArticlesService
  ) {
    this.qty = data.currentQty || 1;
  }

  ngOnInit(): void {}

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/products/Product.png';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  decQty(): void {
    if (this.qty > 1) {
      this.qty--;
    }
  }

  incQty(): void {
    if (this.qty < this.data.maxQty) {
      this.qty++;
    }
  }

  onInputQty(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (!isNaN(value) && value >= 1 && value <= this.data.maxQty) {
      this.qty = value;
    } else if (value > this.data.maxQty) {
      this.qty = this.data.maxQty;
      input.value = this.qty.toString();
    } else if (value < 1 || isNaN(value)) {
      this.qty = 1;
      input.value = '1';
    }
  }

  destock(): void {
    this.dialogRef.close({ quantity: this.qty });
  }

  /**
   * Formate le prix en CFA (complet) - même logique que le tableau des articles
   */
  formatPrice(price: number | string | null | undefined): string {
    return this.articlesService.formatPrice(price);
  }

  /**
   * Formate le prix de façon simplifiée - même logique que le tableau des articles
   */
  formatPriceShort(price: number | string | null | undefined): string {
    return this.articlesService.formatPriceShort(price);
  }

  charLimit(text: string, limit: number = 150): string {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  }
}
