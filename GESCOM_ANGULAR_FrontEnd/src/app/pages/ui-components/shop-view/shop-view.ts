import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ProductDetailDialog } from '../tables/product-detail-dialog.component';
import { AddCartModalDialog } from '../tables/tables.component';

@Component({
  selector: 'app-shop-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatTooltipModule,
    MatPaginatorModule,
    FormsModule,
  ],
  templateUrl: './shop-view.html',
  styleUrls: ['./shop-view.scss']
})
export class AppShopViewComponent {
  pageSize = 6;
  pageIndex = 0;
  searchTerm = '';

  products: Array<{
    title: string;
    image: string;
    price: number;
    oldPrice?: number;
    rating: number;
  }> = [
    { title: 'Gaming Console', image: 'assets/images/products/s6.jpg', price: 25, oldPrice: 31, rating: 5 },
    { title: 'Red Valvet Dress', image: 'assets/images/products/s7.jpg', price: 150, oldPrice: 200, rating: 5 },
    { title: 'The Psychology of Money', image: 'assets/images/products/s3.jpg', price: 125, oldPrice: 137, rating: 5 },
    { title: 'Psalms Book for Growth', image: 'assets/images/products/s2.jpg', price: 89, oldPrice: 99, rating: 5 },
    // duplicate samples to demonstrate pagination
    { title: 'Gaming Console 2', image: 'assets/images/products/s6.jpg', price: 25, oldPrice: 31, rating: 5 },
    { title: 'Red Valvet Dress 2', image: 'assets/images/products/s7.jpg', price: 150, oldPrice: 200, rating: 5 },
    { title: 'The Psychology of Money 2', image: 'assets/images/products/s3.jpg', price: 125, oldPrice: 137, rating: 5 },
    { title: 'Psalms Book for Growth 2', image: 'assets/images/products/s2.jpg', price: 89, oldPrice: 99, rating: 5 },
  ];

  get displayedProducts() {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.products.filter(p => p.title.toLowerCase().includes(term))
      : this.products;
    const start = this.pageIndex * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  get filteredCount(): number {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.products.length;
    return this.products.filter(p => p.title.toLowerCase().includes(term)).length;
  }

  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onSearchChange(val: string) {
    this.searchTerm = val ?? '';
    this.pageIndex = 0;
  }

  trackByTitle = (_: number, item: { title: string }) => item.title;

  constructor(private dialog: MatDialog) {}

  openDetail(p: { title: string; price: number; image: string; oldPrice?: number; rating: number; }): void {
    const product = {
      id: undefined,
      name: p.title,
      description: '',
      price: p.price,
      quantity: 0,
      photo: p.image,
    } as any;
    this.dialog.open(ProductDetailDialog, {
      data: { product, src: p.image },
      width: '700px',
      maxWidth: '95vw',
      panelClass: ['dialog-dark-theme', 'product-detail-dialog'],
      autoFocus: false,
    });
  }

  openOrder(p: { title: string; price: number; image: string; oldPrice?: number; rating: number; }): void {
    const dialogRef = this.dialog.open(AddCartModalDialog, {
      data: {
        mode: 'edit',
        src: p.image,
        title: p.title,
        price: p.price,
        description: '',
        quantity: 1,
        availableStock: 99,
        productId: this.hashTitle(p.title),
        categoryName: undefined,
        onStockUpdate: () => {},
      },
      panelClass: ['modal-dark-theme', 'product-dialog-content'],
      maxWidth: '65vw',
      width: '440px',
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  private hashTitle(t: string): number {
    let h = 0; for (let i = 0; i < t.length; i++) { h = (h << 5) - h + t.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }
}
