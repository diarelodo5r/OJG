import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <ng-container *ngIf="(loading.state$ | async) as s">
      <div class="app-loader-backdrop" *ngIf="s.active">
        <div class="app-loader-card" role="status" aria-live="polite">
          <mat-progress-spinner mode="indeterminate" diameter="56" color="primary"></mat-progress-spinner>
          <div class="app-loader-text">{{ s.message || 'Veuillez patienter...' }}</div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .app-loader-backdrop {
      position: fixed;
      inset: 0;
      background: color-mix(in srgb, var(--mat-sys-background) 60%, rgba(0,0,0,0.6));
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000; /* Above sidenav & dialogs */
    }
    .app-loader-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 20px 24px;
      border-radius: 16px;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-background);
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      min-width: 260px;
    }
    .app-loader-text {
      font-weight: 600;
      opacity: .9;
      text-align: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalLoaderComponent {
  constructor(public loading: LoadingService) {}
}
