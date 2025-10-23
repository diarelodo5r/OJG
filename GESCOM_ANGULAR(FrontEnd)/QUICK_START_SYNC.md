# Quick Start - Synchronisation de la Bibliothèque

## 🚀 Démarrage rapide

### 1. Première utilisation (Initialisation)

```typescript
// Dans la console du navigateur ou dans votre composant
const libraryService = inject(LibraryService);

// Initialiser complètement la bibliothèque
await libraryService.initializeLibrary();
```

**Ce que fait cette commande:**
- ✅ Crée la structure des dossiers dans Firestore (POST `/api/dossiers/initialize`)
- ✅ Synchronise tous les fichiers Drive (POST `/api/contenus/sync/{type}` pour chaque type)

### 2. Synchronisation manuelle

```typescript
// Synchroniser tous les types
await libraryService.syncAllContenus();

// Ou synchroniser un type spécifique
await libraryService.syncContenus('images');
await libraryService.syncContenus('videos');
await libraryService.syncContenus('audio');
await libraryService.syncContenus('documents');
```

### 3. Vérifier le statut

```typescript
const status = await libraryService.getSyncStatus();
console.log(status);
// {
//   isInitialized: true,
//   dossierCount: 4,
//   contenuCount: {
//     images: 10,
//     videos: 5,
//     audio: 3,
//     documents: 8
//   }
// }
```

## 📋 Scénarios d'utilisation

### Scénario 1: Nouvelle installation

```typescript
// 1. Connexion Google
await googleAuthService.signIn();

// 2. Initialisation
const result = await libraryService.initializeLibrary();
console.log('Dossiers:', result.dossiers.length);
console.log('Contenus:', result.contenus);

// 3. Charger la bibliothèque
await loadLibrary();
```

### Scénario 2: Mise à jour après ajout de fichiers

```typescript
// Après avoir ajouté des fichiers dans Google Drive
await libraryService.syncContenus('images');

// Recharger l'affichage
await loadLibrary();
```

### Scénario 3: Synchronisation complète

```typescript
// Synchroniser tous les types
const result = await libraryService.syncAllContenus();

// Afficher les résultats
for (const [type, contenus] of Object.entries(result)) {
  console.log(`${type}: ${contenus.length} éléments`);
}
```

## 🔧 API Endpoints utilisés

### Initialisation
```
POST /api/dossiers/initialize
→ Crée la structure des dossiers dans Firestore
```

### Synchronisation
```
POST /api/contenus/sync/images
POST /api/contenus/sync/videos
POST /api/contenus/sync/audio
POST /api/contenus/sync/documents
→ Synchronise les fichiers Drive vers Firestore
```

### Récupération
```
GET /api/dossiers
→ Liste tous les dossiers

GET /api/contenus?type=images
→ Liste les contenus d'un type
```

## 💡 Conseils

1. **Première utilisation**: Toujours initialiser avec `initializeLibrary()`
2. **Mise à jour régulière**: Utiliser `syncContenus(type)` pour un type spécifique
3. **Synchronisation complète**: Utiliser `syncAllContenus()` occasionnellement
4. **Vérification**: Utiliser `getSyncStatus()` pour vérifier l'état

## 🎯 Résultat dans Firestore

Après l'initialisation, vous aurez:

```
firestore/
├── dossiers/
│   ├── doc_images/
│   │   ├── type: "images"
│   │   ├── nom: "Images"
│   │   └── drive_folder_id: "1SVmhVKW..."
│   ├── doc_videos/
│   ├── doc_audio/
│   └── doc_documents/
│
└── contenus/
    ├── contenu_1/
    │   ├── nom: "photo.jpg"
    │   ├── type: "images"
    │   ├── drive_file_id: "1ABC..."
    │   └── web_view_link: "https://..."
    └── contenu_2/
        └── ...
```

## 🧪 Test rapide

Copiez-collez dans la console du navigateur:

```javascript
// Obtenir le service
const component = ng.getComponent(document.querySelector('app-library'));
const service = component.libraryService;

// Test complet
console.log('🔄 Début du test...');

// 1. Vérifier l'initialisation
const isInit = await service.isLibraryInitialized();
console.log('Initialisée:', isInit);

if (!isInit) {
  // 2. Initialiser
  console.log('Initialisation...');
  await service.initializeLibrary();
}

// 3. Synchroniser
console.log('Synchronisation...');
await service.syncAllContenus();

// 4. Afficher le statut
const status = await service.getSyncStatus();
console.log('✓ Statut:', status);
```
