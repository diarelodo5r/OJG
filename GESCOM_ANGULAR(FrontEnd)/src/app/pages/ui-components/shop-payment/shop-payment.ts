import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartService, CartItem } from '../../../services/cart.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-shop-payment',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    MatCardModule,
    MatRadioModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDividerModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    TablerIconsModule
  ],
  templateUrl: './shop-payment.html',
  styleUrls: ['./shop-payment.scss']
})
export class AppShopPaymentComponent {
  currentYear: number = new Date().getFullYear();
  // Cart observables
  items$!: Observable<CartItem[]>;
  count$!: Observable<number>;
  subtotal$!: Observable<number>;
  deliveryFee = 0; // could be dynamic
  grandTotal$!: Observable<number>;

  // Simple payment form model
  paymentMethod: 'card' | 'momo' | 'cash' = 'card';
  fullName = '';
  email = '';
  address = '';
  city = '';
  cardNumber = '';
  cardExp = '';
  cardCvv = '';

  constructor(private cart: CartService, private snack: MatSnackBar, private router: Router) {
    // Initialize after DI to avoid TS2729
    this.items$ = this.cart.items$;
    this.count$ = this.cart.count$;
    this.subtotal$ = this.cart.items$.pipe(
      map((items) => items.reduce((sum, it) => sum + it.price * it.quantity, 0))
    );
    this.grandTotal$ = this.subtotal$.pipe(map((sub) => sub + this.deliveryFee));
  }

  // Quantity controls
  incQty(id: number) { this.cart.changeQty(id, 1); }
  decQty(id: number) { this.cart.changeQty(id, -1); }
  setQty(id: number, value: number) { this.cart.setQty(id, Number(value || 0)); }
  removeItem(id: number) { this.cart.removeItem(id); }

  // Submit payment (mock flow)
  onSubmit() {
    // Basic validation
    if (!this.fullName || !this.address) {
      this.snack.open('Veuillez renseigner votre nom et votre adresse', 'Fermer', { duration: 3000 });
      return;
    }
    if (this.paymentMethod === 'card' && (!this.cardNumber || !this.cardExp || !this.cardCvv)) {
      this.snack.open('Veuillez compléter les informations de carte', 'Fermer', { duration: 3000 });
      return;
    }
    this.snack.open('Paiement en cours...', undefined, { duration: 1500 });
    setTimeout(() => {
      this.snack.open('Paiement réussi. Merci pour votre commande!', 'Fermer', { duration: 3000 });
      this.cart.clear();
      this.router.navigate(['/shop']);
    }, 1200);
  }
}
