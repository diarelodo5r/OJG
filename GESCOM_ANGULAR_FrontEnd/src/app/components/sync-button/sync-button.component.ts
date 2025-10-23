import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { LibraryService } from '../../services/gescom/library.service';
import { MediaType } from '../../interfaces/gescom/library.models';

@Component({
  selector: 'app-sync-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
  ],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="syncMenu"
      [disabled]="isSyncing"
      matTooltip="Synchroniser avec Google Drive"
      class="sync-button"
      [class.syncing]="isSyncing"
    >
      <mat-icon *ngIf="!isSyncing">sync</mat-icon>
      <mat-spinner *ngIf="isSyncing" diameter="24"></mat-spinner>
    </button>

    <mat-menu #syncMenu="matMenu">
      <button mat-menu-item (click)="syncAll()">
        <mat-icon>sync</mat-icon>
        <span>Synchroniser tout</span>
      </button>
      
      <mat-divider></mat-divider>
      
      <button mat-menu-item (click)="syncType('images')">
        <mat-icon>image</mat-icon>
        <span>Synchroniser les images</span>
      </button>
      
      <button mat-menu-item (click)="syncType('videos')">
        <mat-icon>videocam</mat-icon>
        <span>Synchroniser les vidéos</span>
      </button>
      
      <button mat-menu-item (click)="syncType('audio')">
        <mat-icon>audiotrack</mat-icon>
        <span>Synchroniser l'audio</span>
      </button>
      
      <button mat-menu-item (click)="syncType('documents')">
        <mat-icon>description</mat-icon>
        <span>Synchroniser les documents</span>
      </button>
      
      <mat-divider></mat-divider>
      
      <button mat-menu-item (click)="showStatus()">
        <mat-icon>info</mat-icon>
        <span>Afficher le statut</span>
      </button>
      
      <button mat-menu-item (click)="initializeLibrary()">
        <mat-icon>refresh</mat-icon>
        <span>Réinitialiser la bibliothèque</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .sync-button {
      transition: all 0.3s ease;
    }

    .sync-button.syncing {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .sync-button mat-icon {
      animation: none;
    }

    .sync-button.syncing mat-icon {
      animation: rotate 2s linear infinite;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `],
})
export class SyncButtonComponent {
  @Input() autoSync = false;
  @Output() syncStarted = new EventEmitter<void>();
  @Output() syncCompleted = new EventEmitter<any>();
  @Output() syncError = new EventEmitter<Error>();

  isSyncing = false;

  constructor(private libraryService: LibraryService) {}

  async syncAll(): Promise<void> {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      this.syncStarted.emit();

      console.log('🔄 Synchronisation de tous les médias...');
      const result = await this.libraryService.syncAllContenus();

      console.log('✓ Synchronisation terminée:', result);
      this.syncCompleted.emit(result);
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      this.syncError.emit(error as Error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncType(type: MediaType): Promise<void> {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      this.syncStarted.emit();

      console.log(`🔄 Synchronisation de ${type}...`);
      const result = await this.libraryService.syncContenus(type);

      console.log(`✓ ${result.length} éléments synchronisés pour ${type}`);
      this.syncCompleted.emit({ type, count: result.length, items: result });
    } catch (error) {
      console.error(`❌ Erreur lors de la synchronisation de ${type}:`, error);
      this.syncError.emit(error as Error);
    } finally {
      this.isSyncing = false;
    }
  }

  async showStatus(): Promise<void> {
    try {
      const status = await this.libraryService.getSyncStatus();

      console.log('📊 Statut de la bibliothèque:');
      console.log('  ├─ Initialisée:', status.isInitialized ? '✓' : '✗');
      console.log('  ├─ Dossiers:', status.dossierCount);
      console.log('  └─ Contenus:');
      console.log('      ├─ Images:', status.contenuCount.images);
      console.log('      ├─ Vidéos:', status.contenuCount.videos);
      console.log('      ├─ Audio:', status.contenuCount.audio);
      console.log('      └─ Documents:', status.contenuCount.documents);

      const total = Object.values(status.contenuCount).reduce((sum, count) => sum + count, 0);
      console.log(`  📦 Total: ${total} éléments`);

      // Vous pouvez également afficher un dialog ici
      alert(
        `Statut de la bibliothèque:\n\n` +
        `Initialisée: ${status.isInitialized ? 'Oui' : 'Non'}\n` +
        `Dossiers: ${status.dossierCount}\n\n` +
        `Contenus:\n` +
        `• Images: ${status.contenuCount.images}\n` +
        `• Vidéos: ${status.contenuCount.videos}\n` +
        `• Audio: ${status.contenuCount.audio}\n` +
        `• Documents: ${status.contenuCount.documents}\n\n` +
        `Total: ${total} éléments`
      );
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du statut:', error);
      this.syncError.emit(error as Error);
    }
  }

  async initializeLibrary(): Promise<void> {
    if (this.isSyncing) return;

    const confirmed = confirm(
      'Voulez-vous réinitialiser la bibliothèque ?\n\n' +
      'Cela va:\n' +
      '1. Créer/mettre à jour la structure des dossiers dans Firestore\n' +
      '2. Synchroniser tous les fichiers depuis Google Drive\n\n' +
      'Cette opération peut prendre quelques minutes.'
    );

    if (!confirmed) return;

    try {
      this.isSyncing = true;
      this.syncStarted.emit();

      console.log('🔄 Initialisation de la bibliothèque...');
      const result = await this.libraryService.initializeLibrary();

      console.log('✓ Bibliothèque initialisée:');
      console.log('  ├─ Dossiers:', result.dossiers.length);
      console.log('  └─ Contenus:', result.contenus);

      this.syncCompleted.emit(result);
      alert('Bibliothèque initialisée avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.syncError.emit(error as Error);
      alert('Erreur lors de l\'initialisation de la bibliothèque.');
    } finally {
      this.isSyncing = false;
    }
  }
}
