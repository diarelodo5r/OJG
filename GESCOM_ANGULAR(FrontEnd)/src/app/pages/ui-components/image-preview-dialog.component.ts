import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

/**
 * Composant réutilisable pour afficher une image en plein écran dans un modal
 */
@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div style="justify-content:center; display:flex">
      <button mat-icon-button class="close-btn" (click)="onClose()" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>
      <img [src]="data.src" [alt]="data.title" (error)="onImgError($event)" />
    </div>
  `,
  styles: [`
    .image-only-container { 
      position: relative; 
      padding: 12px; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      background: rgba(0, 0, 0, 0.9);
      border-radius: 8px;
      max-height: 85vh;
    }
    .image-only-container img { 
      max-width: 100%; 
      max-height: 80vh; 
      object-fit: contain; 
      border-radius: 6px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .close-btn { 
      position: absolute; 
      top: 8px; 
      right: 8px; 
      background: rgba(255, 255, 255, 0.9); 
      z-index: 10;
      transition: all 0.2s ease;
    }
    .close-btn:hover { 
      background: rgba(255, 255, 255, 1); 
      transform: scale(1.1);
    }
    .close-btn mat-icon {
      color: #333;
    }
    
    /* Dark theme support */
    .dark-theme .image-only-container {
      background: rgba(0, 0, 0, 0.95);
    }
    .dark-theme .close-btn {
      background: rgba(0,0,0,0.6) !important;
      color: #ffffff !important;
    }
    .dark-theme .close-btn:hover {
      background: rgba(0,0,0,0.8) !important;
    }
    .dark-theme .close-btn mat-icon {
      color: #ffffff;
    }
  `]
})
export class ImagePreviewDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { src: string; title: string },
    private dialogRef: MatDialogRef<ImagePreviewDialogComponent>
  ) {}

  onClose(): void { 
    this.dialogRef.close(); 
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/products/Product.png';
  }
}
