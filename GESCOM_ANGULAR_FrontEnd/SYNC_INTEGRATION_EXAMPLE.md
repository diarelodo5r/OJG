# Intégration du bouton de synchronisation

## 1. Ajouter le composant dans library.component.html

### Option A: Dans la barre d'outils (recommandé)

```html
<!-- Dans library.component.html, dans la section toolbar -->
<header class="library-header">
  <div class="header-content">
    <h1>Bibliothèque</h1>
    
    <div class="header-actions">
      <!-- Bouton de synchronisation -->
      <app-sync-button
        (syncCompleted)="onSyncCompleted($event)"
        (syncError)="onSyncError($event)"
      ></app-sync-button>
      
      <!-- Autres boutons existants -->
      <button mat-icon-button matTooltip="Rechercher">
        <mat-icon>search</mat-icon>
      </button>
      
      <button mat-icon-button matTooltip="Paramètres">
        <mat-icon>settings</mat-icon>
      </button>
    </div>
  </div>
</header>
```

### Option B: Bouton flottant (FAB)

```html
<!-- À la fin de library.component.html -->
<div class="fab-container">
  <app-sync-button
    (syncCompleted)="onSyncCompleted($event)"
    (syncError)="onSyncError($event)"
  ></app-sync-button>
</div>
```

Avec le CSS:
```scss
.fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}
```

## 2. Importer le composant dans library.component.ts

```typescript
import { SyncButtonComponent } from '../../components/sync-button/sync-button.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    // ... autres imports
    SyncButtonComponent, // ← Ajouter ici
  ],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
})
export class LibraryComponent implements OnInit, OnDestroy {
  // ... code existant
  
  /**
   * Gérer la fin de synchronisation
   */
  onSyncCompleted(result: any): void {
    console.log('Synchronisation terminée:', result);
    
    // Recharger la bibliothèque
    void this.loadLibrary();
    
    // Afficher un message de succès (optionnel)
    // this.snackBar.open('Synchronisation réussie !', 'OK', { duration: 3000 });
  }
  
  /**
   * Gérer les erreurs de synchronisation
   */
  onSyncError(error: Error): void {
    console.error('Erreur de synchronisation:', error);
    
    // Afficher un message d'erreur (optionnel)
    // this.snackBar.open('Erreur lors de la synchronisation', 'OK', { duration: 5000 });
  }
}
```

## 3. Utilisation programmatique

### Dans library.component.ts

```typescript
import { ViewChild } from '@angular/core';
import { SyncButtonComponent } from '../../components/sync-button/sync-button.component';

export class LibraryComponent implements OnInit, OnDestroy {
  @ViewChild(SyncButtonComponent) syncButton?: SyncButtonComponent;
  
  // Synchroniser automatiquement au chargement
  async ngOnInit(): Promise<void> {
    this.authSub = this.googleAuthService.isSignedIn$.subscribe(async (isSignedIn) => {
      if (isSignedIn && this.mediaItems.length === 0) {
        await this.checkAndInitializeLibrary();
        
        // Synchroniser automatiquement après l'initialisation
        if (this.syncButton) {
          await this.syncButton.syncAll();
        }
      }
    });
  }
  
  // Synchroniser après un upload
  async handleUpload(files: File[]): Promise<void> {
    if (!files.length) return;
    
    try {
      this.isLoading = true;
      for (const file of files) {
        await this.libraryService.uploadFile(file, { 
          folderKey: this.mapTabToFolder(this.activeTab) 
        });
      }
      
      // Synchroniser après l'upload
      if (this.syncButton) {
        await this.syncButton.syncType(this.activeTab as MediaType);
      }
    } catch (error) {
      console.error('Erreur lors du téléversement :', error);
    } finally {
      this.isLoading = false;
    }
  }
}
```

## 4. Personnalisation du composant

### Ajouter des options

```html
<app-sync-button
  [autoSync]="true"
  (syncStarted)="onSyncStarted()"
  (syncCompleted)="onSyncCompleted($event)"
  (syncError)="onSyncError($event)"
></app-sync-button>
```

### Modifier l'apparence

```typescript
// Dans sync-button.component.ts
@Input() color: 'primary' | 'accent' | 'warn' = 'primary';
@Input() size: 'small' | 'medium' | 'large' = 'medium';
```

```html
<button
  mat-icon-button
  [color]="color"
  [class.small]="size === 'small'"
  [class.large]="size === 'large'"
  ...
>
```

## 5. Ajouter des notifications

### Avec MatSnackBar

```typescript
import { MatSnackBar } from '@angular/material/snack-bar';

export class LibraryComponent {
  constructor(
    private snackBar: MatSnackBar,
    // ... autres services
  ) {}
  
  onSyncCompleted(result: any): void {
    let message = 'Synchronisation réussie !';
    
    if (result.type) {
      // Synchronisation d'un type spécifique
      message = `${result.count} ${result.type} synchronisés`;
    } else if (result.contenus) {
      // Synchronisation complète
      const total = Object.values(result.contenus)
        .reduce((sum: number, items: any) => sum + items.length, 0);
      message = `${total} éléments synchronisés`;
    }
    
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
    
    void this.loadLibrary();
  }
  
  onSyncError(error: Error): void {
    this.snackBar.open(
      'Erreur lors de la synchronisation',
      'Réessayer',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
      }
    ).onAction().subscribe(() => {
      // Réessayer la synchronisation
      this.syncButton?.syncAll();
    });
  }
}
```

## 6. Ajouter un indicateur de progression

```html
<!-- Dans library.component.html -->
<mat-progress-bar
  *ngIf="isSyncing"
  mode="indeterminate"
  color="accent"
  class="sync-progress"
></mat-progress-bar>
```

```typescript
export class LibraryComponent {
  isSyncing = false;
  
  onSyncStarted(): void {
    this.isSyncing = true;
  }
  
  onSyncCompleted(result: any): void {
    this.isSyncing = false;
    // ... reste du code
  }
  
  onSyncError(error: Error): void {
    this.isSyncing = false;
    // ... reste du code
  }
}
```

## 7. Synchronisation automatique périodique

```typescript
export class LibraryComponent implements OnInit, OnDestroy {
  private syncInterval?: number;
  
  ngOnInit(): void {
    // ... code existant
    
    // Synchroniser toutes les 5 minutes
    this.syncInterval = window.setInterval(() => {
      if (this.googleAuthService.isSignedIn && !this.isLoading) {
        console.log('Synchronisation automatique...');
        this.syncButton?.syncAll();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  ngOnDestroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.authSub?.unsubscribe();
  }
}
```

## 8. Exemple complet d'intégration

```typescript
// library.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SyncButtonComponent } from '../../components/sync-button/sync-button.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    // ... autres imports
    SyncButtonComponent,
  ],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
})
export class LibraryComponent implements OnInit, OnDestroy {
  @ViewChild(SyncButtonComponent) syncButton?: SyncButtonComponent;
  
  isSyncing = false;
  
  constructor(
    private snackBar: MatSnackBar,
    // ... autres services
  ) {}
  
  async ngOnInit(): Promise<void> {
    this.authSub = this.googleAuthService.isSignedIn$.subscribe(async (isSignedIn) => {
      if (isSignedIn && this.mediaItems.length === 0) {
        await this.checkAndInitializeLibrary();
      }
    });
  }
  
  onSyncStarted(): void {
    this.isSyncing = true;
  }
  
  onSyncCompleted(result: any): void {
    this.isSyncing = false;
    
    let message = 'Synchronisation réussie !';
    if (result.type) {
      message = `${result.count} ${result.type} synchronisés`;
    }
    
    this.snackBar.open(message, 'OK', { duration: 3000 });
    void this.loadLibrary();
  }
  
  onSyncError(error: Error): void {
    this.isSyncing = false;
    this.snackBar.open('Erreur lors de la synchronisation', 'OK', { duration: 5000 });
  }
}
```

```html
<!-- library.component.html -->
<header class="library-header">
  <div class="header-content">
    <h1>Bibliothèque</h1>
    
    <div class="header-actions">
      <app-sync-button
        (syncStarted)="onSyncStarted()"
        (syncCompleted)="onSyncCompleted($event)"
        (syncError)="onSyncError($event)"
      ></app-sync-button>
    </div>
  </div>
</header>

<mat-progress-bar
  *ngIf="isSyncing"
  mode="indeterminate"
  color="accent"
></mat-progress-bar>

<!-- Reste du template -->
```

## 9. Tests

Pour tester la synchronisation dans la console:

```javascript
// Dans la console du navigateur
const component = ng.getComponent(document.querySelector('app-library'));

// Tester la synchronisation complète
await component.syncButton.syncAll();

// Tester la synchronisation d'un type
await component.syncButton.syncType('images');

// Afficher le statut
await component.syncButton.showStatus();

// Réinitialiser la bibliothèque
await component.syncButton.initializeLibrary();
```
