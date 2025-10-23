import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductDetailDialog } from '../ui-components/tables/product-detail-dialog.component';
import { AddCartModalDialog } from '../ui-components/tables/tables.component';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, TablerIconsModule, FormsModule],
  templateUrl: './shop.html',
  styleUrls: ['./shop.scss']
})
export class AppShopComponent implements AfterViewInit, OnDestroy {
  private revealObserver?: IntersectionObserver;
  currentYear: number = new Date().getFullYear();

  // Pagination state for shop grid
  pageSize = 12;
  pageIndex = 0;
  searchTerm = '';

  // Sample products (replace with API data later)
  products: Array<{
    title: string;
    image: string;
    price: number;
    oldPrice?: number;
    rating: number;
  }> = [
    { title: 'Gaming Console', image: 'assets/images/products/s6.jpg', price: 25, oldPrice: 31, rating: 5 },
    { title: 'Red Velvet Dress', image: 'assets/images/products/s7.jpg', price: 150, oldPrice: 200, rating: 5 },
    { title: 'The Psychology of Money', image: 'assets/images/products/s3.jpg', price: 125, oldPrice: 137, rating: 5 },
    { title: 'Psalms Book for Growth', image: 'assets/images/products/s2.jpg', price: 89, oldPrice: 99, rating: 5 },
    // duplicates to demonstrate pagination
    { title: 'Gaming Console 2', image: 'assets/images/products/s6.jpg', price: 25, oldPrice: 31, rating: 5 },
    { title: 'Red Velvet Dress 2', image: 'assets/images/products/s7.jpg', price: 150, oldPrice: 200, rating: 5 },
    { title: 'The Psychology of Money 2', image: 'assets/images/products/s3.jpg', price: 125, oldPrice: 137, rating: 5 },
    { title: 'Psalms Book for Growth 2', image: 'assets/images/products/s2.jpg', price: 89, oldPrice: 99, rating: 5 },
    { title: 'Gaming Console 3', image: 'assets/images/products/s6.jpg', price: 25, oldPrice: 31, rating: 5 },
    { title: 'Red Velvet Dress 3', image: 'assets/images/products/s7.jpg', price: 150, oldPrice: 200, rating: 5 },
    { title: 'The Psychology of Money 3', image: 'assets/images/products/s3.jpg', price: 125, oldPrice: 137, rating: 5 },
    { title: 'Psalms Book for Growth 3', image: 'assets/images/products/s2.jpg', price: 89, oldPrice: 99, rating: 5 },
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

  // Cart state (observables)
  cartCount$!: Observable<number>;
  cartItems$!: Observable<CartItem[]>;
  total$!: Observable<number>;
  showCart = false;

  constructor(private dialog: MatDialog, private cart: CartService, private router: Router) {
    // Initialize observables after DI is ready to avoid TS2729
    this.cartCount$ = this.cart.count$;
    this.cartItems$ = this.cart.items$;
    this.total$ = this.cart.items$.pipe(
      map((items) => items.reduce((sum, it) => sum + it.price * it.quantity, 0))
    );
  }

  // Detail modal using existing ProductDetailDialog structure
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

  // Order modal leveraging AddCartModalDialog from tables
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
    dialogRef.afterClosed().subscribe(() => {
      // nothing; modal handles the add
    });
  }

  // Floating cart button and sidebar controls
  toggleCart(): void { this.showCart = !this.showCart; }
  incQty(id: number): void { this.cart.changeQty(id, 1); }
  decQty(id: number): void { this.cart.changeQty(id, -1); }
  removeItem(id: number): void { this.cart.removeItem(id); }

  goToPayment(): void {
    this.showCart = false;
    this.router.navigate(['/shop-payment']);
  }

  private hashTitle(t: string): number {
    // simple deterministic id when no backend id exists
    let h = 0; for (let i = 0; i < t.length; i++) { h = (h << 5) - h + t.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }

  features = [
    { icon: 'checklist', title: 'Authguard', subtitle: 'AuthGuard prevents unauthorized access to routes.' },
    { icon: 'calendar', title: 'Calendar Design', subtitle: 'A well-designed calendar is included.' },
    { icon: 'bug', title: 'Regular Updates', subtitle: 'We continuously enhance with new features.' },
    { icon: 'book', title: 'Detailed Documentation', subtitle: 'Comprehensive docs ensure ease of use.' },
    { icon: 'layout-grid', title: '80+ Page Templates', subtitle: 'Multiple demos with extensive pages.' },
    { icon: 'components', title: '50+ UI Components', subtitle: 'A wide set of reusable components.' },
    { icon: 'world', title: 'i18n', subtitle: 'Internationalization support for global apps.' },
    { icon: 'chart-bar', title: 'Charts & Tables', subtitle: 'Lots of chart and table variations.' },
  ];

  apps = [
    { title: 'Calendar', href: 'https://materialm-angular-main.netlify.app//apps/calendar', img: 'https://images.pexels.com/photos/414660/pexels-photo-414660.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Chat', href: 'https://materialm-angular-main.netlify.app//apps/chat', img: 'https://images.pexels.com/photos/2764678/pexels-photo-2764678.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Contacts', href: 'https://materialm-angular-main.netlify.app//apps/contacts', img: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Email', href: 'https://materialm-angular-main.netlify.app//apps/email/inbox', img: 'https://images.pexels.com/photos/261628/pexels-photo-261628.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Courses', href: 'https://materialm-angular-main.netlify.app//apps/courses', img: 'https://images.pexels.com/photos/4144221/pexels-photo-4144221.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Employee', href: 'https://materialm-angular-main.netlify.app//apps/employee', img: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Notes', href: 'https://materialm-angular-main.netlify.app//apps/notes', img: 'https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Tickets', href: 'https://materialm-angular-main.netlify.app//apps/tickets', img: 'https://images.pexels.com/photos/3727450/pexels-photo-3727450.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Invoice', href: 'https://materialm-angular-main.netlify.app//apps/invoice', img: 'https://images.pexels.com/photos/4386379/pexels-photo-4386379.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Todo', href: 'https://materialm-angular-main.netlify.app//apps/todo', img: 'https://images.pexels.com/photos/6077129/pexels-photo-6077129.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Taskboard', href: 'https://materialm-angular-main.netlify.app//apps/taskboard', img: 'https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
    { title: 'Blog List', href: 'https://materialm-angular-main.netlify.app//apps/blog/post', img: 'https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=720' },
  ];

  ngAfterViewInit(): void {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      this.revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              this.revealObserver?.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
      );
      revealEls.forEach((el) => this.revealObserver?.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-revealed'));
    }
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }

}
