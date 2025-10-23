# Guide de Synchronisation de la Bibliothèque

## Vue d'ensemble

Ce guide explique comment synchroniser les fichiers Google Drive avec Firestore via l'API Laravel.

## Architecture

```
Google Drive (Fichiers) → API Laravel → Firestore (Métadonnées) → Angular (Affichage)
```

## Processus d'initialisation

### 1. Initialisation automatique

Lorsque l'utilisateur se connecte avec Google, l'application vérifie automatiquement si la bibliothèque est initialisée :

```typescript
// Dans library.component.ts
async ngOnInit(): Promise<void> {
  this.authSub = this.googleAuthService.isSignedIn$.subscribe((isSignedIn) => {
    if (isSignedIn && this.mediaItems.length === 0) {
      void this.checkAndInitializeLibrary();
    }
  });
}
```

### 2. Vérification et initialisation

```typescript
async checkAndInitializeLibrary(): Promise<void> {
  const isInitialized = await this.libraryService.isLibraryInitialized();
  if (!isInitialized) {
    await this.initializeLibrary();
  } else {
    await this.loadLibrary();
  }
}
```

### 3. Initialisation complète

```typescript
async initializeLibrary(): Promise<void> {
  // Étape 1: Créer la structure des dossiers dans Firestore
  // POST /api/dossiers/initialize
  
  // Étape 2: Synchroniser tous les fichiers Drive
  // POST /api/contenus/sync/images
  // POST /api/contenus/sync/videos
  // POST /api/contenus/sync/audio
  // POST /api/contenus/sync/documents
  
  const result = await this.libraryService.initializeLibrary();
  console.log('✓ Dossiers initialisés:', result.dossiers.length);
  console.log('✓ Contenus synchronisés:', result.contenus);
}
```

## Utilisation dans le composant

### Synchroniser tous les médias

```typescript
// Dans library.component.ts
await this.syncAllMedia();
```

Cela appelle :
```
POST /api/contenus/sync/images
POST /api/contenus/sync/videos
POST /api/contenus/sync/audio
POST /api/contenus/sync/documents
```

### Synchroniser un type spécifique

```typescript
// Synchroniser uniquement les images
await this.syncMediaType('images');

// Synchroniser uniquement les vidéos
await this.syncMediaType('videos');
```

### Obtenir le statut de synchronisation

```typescript
await this.getSyncStatus();
// Affiche dans la console:
// - Initialisée: true/false
// - Nombre de dossiers: 4
// - Nombre de contenus par type: { images: 10, videos: 5, audio: 3, documents: 8 }
```

## API Laravel - Routes disponibles

### Dossiers

```php
GET    /api/dossiers              // Liste tous les dossiers
GET    /api/dossiers/{type}       // Récupère un dossier spécifique
GET    /api/dossiers/{type}/files // Récupère les fichiers d'un dossier
POST   /api/dossiers/initialize   // Initialise la structure
POST   /api/dossiers/sync         // Synchronise les dossiers
```

### Contenus

```php
GET    /api/contenus              // Liste tous les contenus
GET    /api/contenus?type={type}  // Filtre par type
GET    /api/contenus/type/{type}  // Contenus par type
GET    /api/contenus/{id}         // Récupère un contenu
POST   /api/contenus/upload       // Upload un fichier
DELETE /api/contenus/{id}         // Supprime un contenu
POST   /api/contenus/sync/{type}  // Synchronise un type
```

## Exemple de flux complet

### Première utilisation

```typescript
// 1. L'utilisateur se connecte avec Google
await this.googleAuthService.signIn();

// 2. Vérification automatique
const isInitialized = await this.libraryService.isLibraryInitialized();
// → false (première fois)

// 3. Initialisation automatique
await this.libraryService.initializeLibrary();
// → Crée les dossiers dans Firestore
// → Synchronise tous les fichiers Drive

// 4. Chargement de la bibliothèque
await this.loadLibrary();
// → Affiche les médias
```

### Utilisation normale

```typescript
// 1. L'utilisateur se connecte
await this.googleAuthService.signIn();

// 2. Vérification
const isInitialized = await this.libraryService.isLibraryInitialized();
// → true (déjà initialisé)

// 3. Chargement direct
await this.loadLibrary();
// → Affiche les médias depuis Drive
```

### Synchronisation manuelle

```typescript
// Synchroniser tous les types
await this.syncAllMedia();

// Ou synchroniser un type spécifique
await this.syncMediaType('images');
```

## Structure Firestore résultante

```
firestore/
├── dossiers/
│   ├── images/
│   │   ├── id: "doc_id"
│   │   ├── type: "images"
│   │   ├── nom: "Images"
│   │   ├── drive_folder_id: "1SVmhVKWGnRm2MBSjlD1cflSqQPiC3-VY"
│   │   └── created_at: "2025-10-22T20:00:00Z"
│   ├── videos/
│   ├── audio/
│   └── documents/
│
└── contenus/
    ├── contenu_1/
    │   ├── id: "contenu_id"
    │   ├── nom: "photo.jpg"
    │   ├── type: "images"
    │   ├── mime_type: "image/jpeg"
    │   ├── drive_file_id: "1ABC..."
    │   ├── web_view_link: "https://drive.google.com/..."
    │   ├── thumbnail_link: "https://..."
    │   ├── taille: 1024000
    │   └── dossier_type: "images"
    └── contenu_2/
        └── ...
```

## Méthodes du service disponibles

### LibraryService

```typescript
// Dossiers
getDossiers(): Promise<Dossier[]>
getDossier(type: MediaType): Promise<Dossier>
getDossierFiles(type: MediaType): Promise<DossierFilesResponse>
initializeDossiers(): Promise<Dossier[]>
syncDossiers(): Promise<Dossier[]>

// Contenus
getContenus(type?: MediaType): Promise<Contenu[]>
getContenusByType(type: MediaType): Promise<Contenu[]>
getContenu(id: string): Promise<Contenu>
uploadFileViaApi(request: UploadRequest): Promise<Contenu>
deleteContenu(id: string): Promise<void>
syncContenus(type: MediaType): Promise<Contenu[]>

// Synchronisation
syncAllContenus(): Promise<Record<MediaType, Contenu[]>>
initializeLibrary(): Promise<{ dossiers: Dossier[]; contenus: Record<MediaType, Contenu[]> }>
isLibraryInitialized(): Promise<boolean>
getSyncStatus(): Promise<{ isInitialized: boolean; dossierCount: number; contenuCount: Record<MediaType, number> }>

// Conversion
contenuToMediaItem(contenu: Contenu): MediaItem
getMediaItems(type?: MediaType): Promise<MediaItem[]>
```

## Console de débogage

Pour vérifier l'état de la synchronisation dans la console du navigateur :

```typescript
// Dans la console Chrome/Firefox
const component = ng.getComponent(document.querySelector('app-library'));
await component.getSyncStatus();
```

Ou ajoutez un bouton dans l'interface :

```html
<button (click)="getSyncStatus()">Vérifier le statut</button>
<button (click)="syncAllMedia()">Synchroniser tout</button>
<button (click)="syncMediaType('images')">Synchroniser les images</button>
```

## Gestion des erreurs

Toutes les méthodes gèrent les erreurs et les affichent dans la console :

```typescript
try {
  await this.syncAllMedia();
} catch (error) {
  console.error('Erreur lors de la synchronisation:', error);
  // Afficher un message à l'utilisateur
}
```

## Notes importantes

1. **Token Google** : Le token OAuth2 est automatiquement récupéré et envoyé à l'API
2. **Synchronisation** : La synchronisation ne supprime pas les fichiers, elle ajoute/met à jour
3. **Performance** : La première synchronisation peut prendre du temps selon le nombre de fichiers
4. **Cache** : Les métadonnées sont stockées dans Firestore pour un accès rapide
