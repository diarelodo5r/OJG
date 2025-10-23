import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatSlideToggleModule, MatButtonModule, MatIconModule],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class AppPricingComponent {
  isYearly = false;

  // Prices for monthly/yearly (example values)
  readonly prices = {
    silver: { monthly: 0, yearly: 0 },
    bronze: { monthly: 10.99, yearly: 99.99 },
    gold: { monthly: 22.99, yearly: 219.99 },
  } as const;

  onToggle(e: MatSlideToggleChange) {
    this.isYearly = !!e.checked;
  }

  getPriceValue(plan: 'silver' | 'bronze' | 'gold'): number {
    const period = this.isYearly ? 'yearly' : 'monthly';
    return this.prices[plan][period];
  }

  isFree(plan: 'silver' | 'bronze' | 'gold'): boolean {
    return this.getPriceValue(plan) === 0;
  }
}
