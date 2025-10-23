import { BreakpointObserver, MediaMatcher } from '@angular/cdk/layout';
import { Component, EventEmitter, HostListener, Input, Output, ViewChild, ViewEncapsulation, OnInit, inject, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { CoreService } from '../../services/core.service';
import { CartService, CartItem } from '../../services/cart.service';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgIcon } from '@ng-icons/core';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AppNavItemComponent } from './sidebar/nav-item/nav-item.component';
import { navItems } from './sidebar/sidebar-data';
import { AppTopstripComponent } from './top-strip/topstrip.component';

const MOBILE_VIEW = 'screen and (max-width: 768px)';
const TABLET_VIEW = 'screen and (min-width: 769px) and (max-width: 1024px)';

@Component({
  selector: 'app-full',
  imports: [
    RouterModule,
    AppNavItemComponent,
    CommonModule,
    SidebarComponent,
    NgScrollbarModule,
    NgIcon,
    HeaderComponent,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent implements OnInit {
  navItems = navItems;

  @ViewChild('leftsidenav')
  public sidenav!: MatSidenav;

  @ViewChild('rightCustomizer')
  public rightCustomizer!: MatSidenav;
  resView = false;

  @ViewChild('content', { static: true }) content!: MatSidenavContent;
  //get options from service
  options!: any;
  private layoutChangesSubscription = Subscription.EMPTY;
  private isMobileScreen = false;
  private isContentWidthFixed = true;
  private isCollapsedWidthFixed = false;
  private htmlElement!: HTMLHtmlElement;

  // Cart badge (floating button visibility)
  cartCount$!: Observable<number>;

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  onResetCustomizer() {
    // Defaults
    this.theme = 'light';
    this.color = 'blue';
    this.dir = 'ltr';
    this.sidebarType = 'full';
    this.layoutType = 'vertical';
    this.cardWith = 'shadow';
    this.containerOption = 'boxed';

    // Apply
    this.applyTheme(this.theme);
    this.applyThemeColor(this.color);
    this.applyDir(this.dir);
    this.applySidebarType(this.sidebarType);
    this.applyLayoutType(this.layoutType);
    this.applyCardWith(this.cardWith);
    this.applyContainer(this.containerOption);

    // Persist
    try {
      localStorage.removeItem('mparish_customizer');
    } catch {}
    this.persistSettings();
  }

  // Document reference for class toggling
  private readonly doc: Document = inject(DOCUMENT);

  // States (Customizer)
  theme: 'light' | 'dark' = 'light';
  color: 'blue' | 'aqua' | 'purple' | 'green' | 'orange' | 'custom' = 'blue';
  dir: 'ltr' | 'rtl' = 'ltr';
  sidebarType: 'full' | 'minisidebar' = 'full';
  layoutType: 'vertical' | 'horizontal' = 'vertical';
  cardWith: 'shadow' | 'border' = 'shadow';
  containerOption: 'full' | 'boxed' = 'boxed';
  // Custom theme color (hex or rgb)
  customColor: string = '#00a1ff';

  // Apply defaults on init
  ngOnInit() {
    // Restore persisted settings if available
    try {
      const saved = JSON.parse(localStorage.getItem('mparish_customizer') || '{}');
      if (saved.theme) this.theme = saved.theme;
      if (saved.color) this.color = saved.color;
      if (saved.customColor) this.customColor = saved.customColor;
      if (saved.dir) this.dir = saved.dir;
      if (saved.sidebarType) this.sidebarType = saved.sidebarType;
      if (saved.layoutType) this.layoutType = saved.layoutType;
      if (saved.cardWith) this.cardWith = saved.cardWith;
      if (saved.containerOption) this.containerOption = saved.containerOption;
    } catch {}

    this.applyTheme(this.theme);
    if (this.color === 'custom') {
      this.applyCustomPrimaryColor(this.customColor);
    } else {
      this.applyThemeColor(this.color);
    }
    this.applyDir(this.dir);
    this.applySidebarType(this.sidebarType);
    this.applyLayoutType(this.layoutType);
    this.applyCardWith(this.cardWith);
    this.applyContainer(this.containerOption);
  }

  // Utilities
  private swapHtmlClass(addClass: string, removePrefixes: string[]) {
    const htmlEl = this.doc.documentElement;
    removePrefixes.forEach((prefix) => {
      htmlEl.classList.forEach((cls) => {
        if (cls.startsWith(prefix)) htmlEl.classList.remove(cls);
      });
    });
    if (addClass) htmlEl.classList.add(addClass);
  }

  private toggleBodyClass(cls: string, enable: boolean) {
    const body = this.doc.body;
    if (enable) body.classList.add(cls); else body.classList.remove(cls);
  }

  // Handlers bound from template
  onThemeChange(event: any) {
    const val = event.value;
    this.theme = val;
    this.applyTheme(val);
    this.persistSettings();
  }

  onThemeColorChange(event: any) {
    const val = event.value;
    this.color = val;
    if (val === 'custom') {
      this.applyCustomPrimaryColor(this.customColor);
    } else {
      this.applyThemeColor(val);
    }
    this.persistSettings();
  }

  onPickCustomColor(event: any) {
    const value = (event?.target?.value || '').toString();
    if (!value) return;
    this.customColor = value;
    this.color = 'custom';
    this.applyCustomPrimaryColor(this.customColor);
    this.persistSettings();
  }

  onDirChange(event: any) {
    const val = event.value;
    this.dir = val;
    this.applyDir(val);
    this.persistSettings();
  }

  onSidebarTypeChange(event: any) {
    const val = event.value;
    this.sidebarType = val;
    this.applySidebarType(val);
    this.persistSettings();
  }

  onLayoutTypeChange(event: any) {
    const val = event.value;
    this.layoutType = val;
    this.applyLayoutType(val);
    this.persistSettings();
  }

  onCardWithChange(event: any) {
    const val = event.value;
    this.cardWith = val;
    this.applyCardWith(val);
    this.persistSettings();
  }

  onContainerChange(event: any) {
    const val = event.value;
    this.containerOption = val;
    this.applyContainer(val);
    this.persistSettings();
  }

  // Appliers
  private applyTheme(val: 'light' | 'dark') {
    const html = this.doc.documentElement;
    html.classList.remove('light-theme', 'dark-theme');
    html.classList.add(val === 'dark' ? 'dark-theme' : 'light-theme');
  }

  private applyThemeColor(val: 'blue' | 'aqua' | 'purple' | 'green' | 'orange') {
    // Clear any inline custom overrides to let theme class take effect
    const html = this.doc.documentElement as HTMLElement;
    html.style.removeProperty('--mat-sys-primary');
    html.style.removeProperty('--mat-sys-on-primary');
    html.style.removeProperty('--mat-sys-primary-fixed-dim');
    this.swapHtmlClass(`${val}_theme`, ['blue_', 'aqua_', 'purple_', 'green_', 'orange_']);
  }

  private applyCustomPrimaryColor(color: string) {
    // Remove any previous theme class so custom takes full precedence
    this.swapHtmlClass('', ['blue_', 'aqua_', 'purple_', 'green_', 'orange_']);
    const html = this.doc.documentElement as HTMLElement;
    // Normalize to hex if needed; we accept hex from input type=color
    const primary = color;
    const onPrimary = '#ffffff';
    // A dim/fixed variant for hovers and subtle backgrounds
    // Simple fallback: mix with transparency via CSS color-mix where used; here set a reasonable default
    const fixedDim = 'rgba(0,0,0,0.06)';
    html.style.setProperty('--mat-sys-primary', primary);
    html.style.setProperty('--mat-sys-on-primary', onPrimary);
    html.style.setProperty('--mat-sys-primary-fixed-dim', fixedDim);
  }

  private applyDir(val: 'ltr' | 'rtl') {
    this.doc.dir = val;
  }

  private applySidebarType(val: 'full' | 'minisidebar') {
    this.toggleBodyClass('sidebar-full', val === 'full');
    this.toggleBodyClass('sidebar-mini', val === 'minisidebar');
  }

  private applyLayoutType(val: 'vertical' | 'horizontal') {
    this.toggleBodyClass('layout-vertical', val === 'vertical');
    this.toggleBodyClass('layout-horizontal', val === 'horizontal');
  }

  private applyCardWith(val: 'shadow' | 'border') {
    this.toggleBodyClass('cards-border', val === 'border');
    this.toggleBodyClass('cards-shadow', val === 'shadow');
  }

  private applyContainer(val: 'full' | 'boxed') {
    this.toggleBodyClass('container-full', val === 'full');
    this.toggleBodyClass('container-boxed', val === 'boxed');
  }

  private persistSettings() {
    try {
      localStorage.setItem(
        'mparish_customizer',
        JSON.stringify({
          theme: this.theme,
          color: this.color,
          customColor: this.customColor,
          dir: this.dir,
          sidebarType: this.sidebarType,
          layoutType: this.layoutType,
          cardWith: this.cardWith,
          containerOption: this.containerOption,
        })
      );
    } catch {}
  }
  constructor(
    private settings: CoreService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private cart: CartService,
    private dialog: MatDialog,
  ) {
    this.options = this.settings.getOptions();
    this.cartCount$ = this.cart.count$;
    this.htmlElement = document.querySelector('html')!;
    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, TABLET_VIEW])
      .subscribe((state) => {
        // SidenavOpened must be reset true when layout changes
        this.options.sidenavOpened = true;
        this.isMobileScreen = state.breakpoints[MOBILE_VIEW];
        console.log('[FullComponent] Breakpoint change:', {
          MOBILE_VIEW: state.breakpoints[MOBILE_VIEW],
          TABLET_VIEW: state.breakpoints[TABLET_VIEW],
          isOver: this.isMobileScreen,
        });
        if (this.options.sidenavCollapsed == false) {
          this.options.sidenavCollapsed = state.breakpoints[TABLET_VIEW];
        }
      });

    // Initialize project theme with options


    // This is for scroll to top
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        this.content.scrollTo({ top: 0 });
      });
  }

  ngOnDestroy() {
    this.layoutChangesSubscription.unsubscribe();
  }

  toggleCollapsed() {
    this.isContentWidthFixed = false;
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    console.log('[FullComponent] toggleCollapsed ->', this.options.sidenavCollapsed ? 'collapsed' : 'expanded');
    this.resetCollapsedState();
  }

  resetCollapsedState(timer = 400) {
    setTimeout(() => this.settings.setOptions(this.options), timer);
  }

  onSidenavClosedStart() {
    this.isContentWidthFixed = false;
    console.log('[FullComponent] sidenav closed start');
  }

  onSidenavOpenedChange(isOpened: boolean) {
    this.isCollapsedWidthFixed = !this.isOver;
    this.options.sidenavOpened = isOpened;
    console.log('[FullComponent] sidenav opened change ->', isOpened);
  }

  openCart(): void {
    this.dialog.open(CartDialogComponent, {
      panelClass: 'app-cart-dialog-panel',
      width: '520px',
      maxWidth: '95vw',
    });
  }
}

@Component({
  selector: 'app-cart-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="cart-dialog-content modal-dark-theme">
      <div class="d-flex align-items-center justify-content-between m-b-12">
        <h3 class="m-0 f-s-18 f-w-600 cart-title">Cart</h3>
        <button mat-icon-button aria-label="Close" (click)="close()" class="close-btn"><mat-icon>close</mat-icon></button>
      </div>
      <ng-container *ngIf="(items$ | async) as items; else empty">
        <div class="d-flex flex-column gap-12 cart-items">
          <div *ngFor="let it of items" class="d-flex gap-12 align-items-center cart-item">
            <img [src]="it.imagePath" [alt]="it.uname" class="cart-item-image" />
            <div class="flex-1 cart-item-details">
              <div class="f-w-600 cart-item-name">{{ it.uname }}</div>
              <div class="text-muted f-s-12 cart-item-quantity">Qty: {{ it.quantity }} · {{ it.price | currency:'USD':'symbol' }}</div>
            </div>
            <div class="f-w-600 cart-item-price">{{ it.price * it.quantity | currency:'USD':'symbol' }}</div>
            <button mat-icon-button color="warn" (click)="remove(it.id)" aria-label="Remove" class="remove-btn"><mat-icon>delete</mat-icon></button>
          </div>
          <div class="d-flex justify-content-between m-t-8 b-t-1 p-t-12 cart-total">
            <div class="f-w-600 cart-total-label">Total</div>
            <div class="f-w-700 cart-total-amount">{{ total(items) | currency:'USD':'symbol' }}</div>
          </div>
          <div class="d-flex justify-content-end gap-12 m-t-8 cart-actions">
            <button mat-stroked-button color="warn" (click)="clear()" class="clear-btn">Clear</button>
            <button mat-stroked-button color="primary" (click)="gotoCart()" class="view-cart-btn">Voir le panier</button>
            <button mat-flat-button color="primary" (click)="checkout()" class="checkout-btn">Checkout</button>
          </div>
        </div>
      </ng-container>
      <ng-template #empty>
        <div class="text-center p-24 cart-empty">Your cart is empty.</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .cart-dialog-content {
      padding: 20px;
      min-width: 300px;
      max-width: 500px;
    }
    .cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .cart-title { margin: 0; font-size: 1.25rem; font-weight: 600; }
    .cart-body { display: flex; flex-direction: column; gap: 12px; }
    .cart-items { display: flex; flex-direction: column; gap: 12px; }
    .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.1); }
    .cart-item-info { display: flex; flex-direction: column; gap: 4px; }
    .cart-item-name { font-weight: 500; }
    .cart-item-quantity { font-size: 0.875rem; color: #6c757d; }
    .cart-item-price { font-weight: 600; color: #28a745; }
    .cart-total { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 2px solid rgba(0,0,0,0.1); font-weight: 600; }
    .cart-total-label { color: var(--bs-body-color, #212529); }
    .cart-total-amount { color: #28a745; }
    .cart-empty { text-align: center; padding: 20px; color: #6c757d; }
    .close-btn { background: transparent; }
  `],
})
export class CartDialogComponent {
  items$!: Observable<CartItem[]>;
  constructor(private cart: CartService, private ref: MatDialogRef<CartDialogComponent>, private router: Router) {
    this.items$ = this.cart.items$;
  }
  remove(id: number) { this.cart.removeItem(id); }
  clear() { this.cart.clear(); }
  total(items: CartItem[]): number { return items.reduce((acc, it) => acc + it.price * it.quantity, 0); }
  checkout() { this.ref.close(); }
  gotoCart() { this.ref.close(); this.router.navigateByUrl('/ui-components/cart'); }
  close() { this.ref.close(); }
}
