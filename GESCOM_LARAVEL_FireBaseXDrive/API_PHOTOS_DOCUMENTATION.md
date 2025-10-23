# Documentation API Photos - GESCOM Laravel

## Configuration du stockage

Les photos sont stockées dans `C:\Users\[VotreNom]\Documents\GESCOM\photos\` avec la structure suivante:

```
C:\Users\[VotreNom]\Documents\GESCOM\photos\
├── articles/         # Photos d'articles
└── profils/          # Photos de profils utilisateurs
```

### Disques configurés (filesystems.php)

- **`photos_articles`** - Pour les photos d'articles
- **`photos_profils`** - Pour les photos de profils

---

## Routes API disponibles

Toutes les routes nécessitent une authentification via `auth:sanctum` middleware.

### Routes API

**Articles:**
- Upload: `POST /api/articles/{article_id}/photo`
- Récupérer: `GET /api/articles/{article_id}/photo`
- Supprimer: `DELETE /api/articles/{article_id}/photo`

**Utilisateurs:**
- Upload: `POST /api/utilisateurs/{utilisateur_id}/photo`
- Récupérer: `GET /api/utilisateurs/{utilisateur_id}/photo`
- Supprimer: `DELETE /api/utilisateurs/{utilisateur_id}/photo`

---

## 📸 Photos d'Articles

### 1. **Upload photo d'article**
```http
POST /api/articles/{article_id}/photo
Content-Type: multipart/form-data
```

**Paramètres:**
- `photo` (file, required) - Fichier image (jpeg, png, jpg, gif, webp)
- Max size: 5MB

**Exemple cURL:**
```bash
curl -X POST "http://127.0.0.1:8000/api/articles/20/photo" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@/path/to/image.jpg"
```

**Réponse (200 OK):**
```json
{
  "message": "Photo d'article uploadée avec succès",
  "filename": "article_20_1696612800_aB3dEf9h.jpg",
  "path": "C:\\Users\\Username\\Documents\\GESCOM\\photos\\articles\\article_20_1696612800_aB3dEf9h.jpg"
}
```

**💾 Stockage en base de données:**
Le chemin complet est enregistré dans `articles.image_article`:
```sql
UPDATE articles SET image_article = 'C:\Users\Username\Documents\GESCOM\photos\articles\article_20_1696612800_aB3dEf9h.jpg' WHERE id = 20;
```

**Format du nom de fichier:**
```
article_{ID}_{timestamp}_{random}.{extension}
```

---

### 2. **Récupérer photo d'article**
```http
GET /api/articles/{article_id}/photo
```

**Exemple:**
```http
GET /api/articles/20/photo
```

**Réponse:** Image binaire directe (affichable dans le navigateur)

**Headers de réponse:**
```
Content-Type: image/jpeg
Cache-Control: public, max-age=3600
```

**Erreur (404):**
```json
{
  "message": "Aucune photo trouvée pour cet article"
}
```

---

### 3. **Supprimer photo d'article**
```http
DELETE /api/articles/{article_id}/photo
```

**Réponse (200 OK):**
```json
{
  "message": "Photo d'article supprimée avec succès"
}
```

---

## 👤 Photos de Profils

### 1. **Upload photo de profil**
```http
POST /api/utilisateurs/{utilisateur_id}/photo
Content-Type: multipart/form-data
```

**Paramètres:**
- `photo` (file, required) - Fichier image (jpeg, png, jpg, gif, webp)
- Max size: 5MB

**Exemple cURL:**
```bash
curl -X POST "http://127.0.0.1:8000/api/utilisateurs/5/photo" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@/path/to/profile.jpg"
```

**Réponse (200 OK):**
```json
{
  "message": "Photo de profil uploadée avec succès",
  "filename": "profil_5_1696612800_xY7zAb2c.jpg",
  "path": "C:\\Users\\Username\\Documents\\GESCOM\\photos\\profils\\profil_5_1696612800_xY7zAb2c.jpg"
}
```

**💾 Stockage en base de données:**
Le chemin complet est enregistré dans `utilisateurs.photo`:
```sql
UPDATE utilisateurs SET photo = 'C:\Users\Username\Documents\GESCOM\photos\profils\profil_5_1696612800_xY7zAb2c.jpg' WHERE id = 5;
```

**Format du nom de fichier:**
```
profil_{ID}_{timestamp}_{random}.{extension}
```

---

### 2. **Récupérer photo de profil**
```http
GET /api/utilisateurs/{utilisateur_id}/photo
```

**Exemple:**
```http
GET /api/utilisateurs/5/photo
```

**Réponse:** Image binaire directe

---

### 3. **Supprimer photo de profil**
```http
DELETE /api/utilisateurs/{utilisateur_id}/photo
```

**Réponse (200 OK):**
```json
{
  "message": "Photo de profil supprimée avec succès"
}
```

---

## 💾 Optimisation du stockage

### **Chemins complets en base de données**

Le système enregistre maintenant **le chemin complet** du fichier dans la base de données:

```php
// Exemple pour un article
$article->image_article = "C:\\Users\\Username\\Documents\\GESCOM\\photos\\articles\\article_20_1696612800.jpg";

// Exemple pour un utilisateur  
$utilisateur->photo = "C:\\Users\\Username\\Documents\\GESCOM\\photos\\profils\\profil_5_1696612800.jpg";
```

**Avantages:**
- ✅ Accès direct au fichier sans reconstruction du chemin
- ✅ Plus économique en ressources
- ✅ Pas besoin de Storage::disk() pour la lecture
- ✅ Suppression simplifiée avec `unlink()`

---

## 🔧 Utilisation avec Postman

### Upload photo d'article

1. **Méthode:** POST
2. **URL:** `http://127.0.0.1:8000/api/articles/20/photo`
3. **Headers:**
   - `Authorization: Bearer YOUR_TOKEN`
4. **Body:** 
   - Sélectionner `form-data`
   - Clé: `photo` (type: File)
   - Valeur: Sélectionner votre fichier image

### Voir photo d'article

1. **Méthode:** GET
2. **URL:** `http://127.0.0.1:8000/api/articles/20/photo`
3. **Headers:**
   - `Authorization: Bearer YOUR_TOKEN`
4. **Résultat:** Image s'affiche dans Postman

---

## 💻 Intégration Frontend (Angular/React)

### Upload avec FormData

```typescript
// Angular example
uploadArticlePhoto(articleId: number, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('photo', file);
  
  return this.http.post(
    `${this.apiUrl}/articles/${articleId}/photo`,
    formData,
    { headers: { 'Authorization': `Bearer ${this.token}` } }
  );
}
```

### Affichage d'une photo

```html
<!-- Angular -->
<img [src]="'http://127.0.0.1:8000/api/articles/' + article.id + '/photo'" 
     alt="Photo article"
     class="img-fluid">

<!-- React -->
<img 
  src={`http://127.0.0.1:8000/api/articles/${article.id}/photo`}
  alt="Photo article"
  className="img-fluid"
/>
```

---

## 🔒 Validation et sécurité

### Formats acceptés
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Taille maximale
- **5MB** par fichier

### Sécurité
- ✅ Authentification requise (Sanctum)
- ✅ Validation du type MIME
- ✅ Noms de fichiers uniques (timestamp + random)
- ✅ Suppression automatique de l'ancienne photo lors de l'upload
- ✅ Stockage hors du dossier web public

---

## 📁 Gestion automatique

### Remplacement automatique
Lors d'un nouvel upload, l'ancienne photo est **automatiquement supprimée**.

### Nettoyage
Les photos sont supprimées de la base de données ET du disque.

---

## ⚠️ Gestion des erreurs

### 404 - Photo non trouvée
```json
{
  "message": "Aucune photo trouvée pour cet article"
}
```

### 404 - Fichier introuvable
```json
{
  "message": "Fichier photo introuvable"
}
```

### 422 - Validation échouée
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "photo": [
      "Le fichier doit être une image.",
      "Le fichier ne doit pas dépasser 5120 kilobytes."
    ]
  }
}
```

### 401 - Non authentifié
```json
{
  "message": "Unauthenticated."
}
```

---

## 🎯 Cas d'usage

### 1. Upload photo lors de la création d'article

```javascript
// 1. Créer l'article
const article = await createArticle(articleData);

// 2. Upload la photo
if (photoFile) {
  await uploadArticlePhoto(article.id, photoFile);
}
```

### 2. Mettre à jour la photo de profil

```javascript
async function updateProfilePhoto(userId, file) {
  try {
    const response = await uploadProfilPhoto(userId, file);
    console.log('Photo uploadée:', response.filename);
    // Rafraîchir l'affichage
    reloadUserProfile();
  } catch (error) {
    console.error('Erreur upload:', error);
  }
}
```

### 3. Galerie d'articles avec photos

```html
<div class="article-grid">
  <div *ngFor="let article of articles" class="article-card">
    <img 
      [src]="getArticlePhotoUrl(article.id)" 
      (error)="handleImageError($event)"
      alt="{{ article.nom_article }}"
    >
    <h3>{{ article.nom_article }}</h3>
  </div>
</div>
```

```typescript
getArticlePhotoUrl(articleId: number): string {
  return `${this.apiUrl}/articles/${articleId}/photo`;
}

handleImageError(event: any) {
  // Photo par défaut si non trouvée
  event.target.src = '/assets/images/no-image.png';
}
```

---

## 🚀 Fonctionnalités

- ✅ Upload multipart/form-data
- ✅ Noms de fichiers uniques et traçables
- ✅ Stockage organisé par type (articles/profils)
- ✅ Récupération directe des images (pas de base64)
- ✅ Suppression automatique de l'ancienne photo
- ✅ Validation des formats et tailles
- ✅ Messages d'erreur clairs en français
- ✅ Support de multiples formats d'image
- ✅ Chemins absolus retournés pour référence
- ✅ Routes RESTful

---

## 📝 Notes importantes

1. **Créer les dossiers manuellement** si nécessaire:
   ```
   C:\Users\[VotreNom]\Documents\GESCOM\photos\articles
   C:\Users\[VotreNom]\Documents\GESCOM\photos\profils
   ```

2. **Permissions**: Assurez-vous que PHP a les droits d'écriture sur ces dossiers.

3. **Backup**: Les photos ne sont PAS dans le dossier du projet, pensez à les sauvegarder séparément.

4. **Production**: Pour la production, envisagez de changer le chemin vers un serveur de fichiers dédié ou un service cloud (S3, etc.).

---

**Dernière mise à jour:** 2025-10-06  
**Version:** 1.0.0
