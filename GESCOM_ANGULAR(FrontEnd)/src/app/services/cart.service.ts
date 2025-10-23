import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  uname: string;
  imagePath: string;
  price: number;
  quantity: number;
  maxQty?: number; // stock maximum disponible pour cet article
  lineTotalOverride?: number | null;
  discount?: number; // remise par ligne (0-100 pour %, montant fixe selon discountType)
  discountType?: 'percent' | 'fixed'; // type de remise
  articleName?: string; // nom de l'article
  familleName?: string; // nom de la famille
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  private readonly countSubject = new BehaviorSubject<number>(0);
  readonly count$ = this.countSubject.asObservable();

  // Remise globale sur l'ensemble du panier
  private readonly globalDiscountSubject = new BehaviorSubject<{ value: number; type: 'percent' | 'fixed' }>({ value: 0, type: 'percent' });
  readonly globalDiscount$ = this.globalDiscountSubject.asObservable();

  // Remises par défaut prédéfinies
  readonly defaultDiscounts = [
    { label: 'Aucune remise', value: 0, type: 'percent' as const },
    { label: '5%', value: 5, type: 'percent' as const },
    { label: '10%', value: 10, type: 'percent' as const },
    { label: '15%', value: 15, type: 'percent' as const },
    { label: '20%', value: 20, type: 'percent' as const },
    { label: '25%', value: 25, type: 'percent' as const },
    { label: '50%', value: 50, type: 'percent' as const },
  ];

  addItem(item: Omit<CartItem, 'quantity'>, qty = 1): void {
    const items = [...this.itemsSubject.value];
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      const max = items[idx].maxQty ?? Number.POSITIVE_INFINITY;
      const nextQty = Math.min(items[idx].quantity + qty, max);
      items[idx] = { ...items[idx], quantity: nextQty };
    } else {
      const max = item.maxQty ?? Number.POSITIVE_INFINITY;
      const safeQty = Math.min(qty, max);
      items.push({ ...item, quantity: safeQty, lineTotalOverride: item.lineTotalOverride ?? null });
    }
    this.itemsSubject.next(items);
    this.updateCount(items);
  }

  changeQty(id: number, delta: number): void {
    if (!delta) return;
    const items = [...this.itemsSubject.value];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const max = items[idx].maxQty ?? Number.POSITIVE_INFINITY;
    const newQty = Math.min(items[idx].quantity + delta, max);
    if (newQty <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx] = { ...items[idx], quantity: newQty };
    }
    this.itemsSubject.next(items);
    this.updateCount(items);
  }

  setQty(id: number, qty: number): void {
    const safeInput = Math.max(0, Math.floor(isNaN(qty as any) ? 0 : qty));
    const items = [...this.itemsSubject.value];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const max = items[idx].maxQty ?? Number.POSITIVE_INFINITY;
    const safe = Math.min(safeInput, max);
    if (safe <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx] = { ...items[idx], quantity: safe };
    }
    this.itemsSubject.next(items);
    this.updateCount(items);
  }

  removeItem(id: number): void {
    const items = this.itemsSubject.value.filter((i) => i.id !== id);
    this.itemsSubject.next(items);
    this.updateCount(items);
  }

  clear(): void {
    this.itemsSubject.next([]);
    this.countSubject.next(0);
  }

  setUnitPrice(id: number, price: number): void {
    if (!Number.isFinite(price)) return;
    const items = [...this.itemsSubject.value];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const safePrice = Math.max(0, Number(price));
    items[idx] = { ...items[idx], price: safePrice };
    this.itemsSubject.next(items);
  }

  setLineTotalOverride(id: number, total: number | null | undefined): void {
    const items = [...this.itemsSubject.value];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    let override: number | null = null;
    if (total != null && !isNaN(total as any)) {
      override = Math.max(0, Number(total));
    }
    items[idx] = { ...items[idx], lineTotalOverride: override };
    this.itemsSubject.next(items);
  }

  private updateCount(items: CartItem[]) {
    const count = items.reduce((acc, cur) => acc + cur.quantity, 0);
    this.countSubject.next(count);
  }

  /**
   * Définit la remise pour une ligne spécifique
   */
  setLineDiscount(id: number, discount: number, type: 'percent' | 'fixed'): void {
    const items = [...this.itemsSubject.value];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    
    const safeDiscount = Math.max(0, Number(discount) || 0);
    items[idx] = { ...items[idx], discount: safeDiscount, discountType: type };
    this.itemsSubject.next(items);
  }

  /**
   * Définit la remise globale sur l'ensemble du panier
   */
  setGlobalDiscount(value: number, type: 'percent' | 'fixed'): void {
    const safeValue = Math.max(0, Number(value) || 0);
    this.globalDiscountSubject.next({ value: safeValue, type });
  }

  /**
   * Récupère la remise globale actuelle
   */
  getGlobalDiscount() {
    return this.globalDiscountSubject.value;
  }

  /**
   * Réinitialise toutes les remises
   */
  clearAllDiscounts(): void {
    const items = this.itemsSubject.value.map(item => ({
      ...item,
      discount: 0,
      discountType: 'percent' as const
    }));
    this.itemsSubject.next(items);
    this.globalDiscountSubject.next({ value: 0, type: 'percent' });
  }
}
