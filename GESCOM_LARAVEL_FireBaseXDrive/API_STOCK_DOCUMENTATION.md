# Documentation API Stock - GESCOM Laravel

## Routes API disponibles

Toutes les routes nécessitent une authentification via `auth:sanctum` middleware.

### Base URL
```
http://127.0.0.1:8000/api/stocks
```

## Endpoints CRUD

### 1. **Liste des stocks** (Index)
```http
GET /api/stocks
```

**Réponse (200 OK):**
```json
{
  "data": [
    {
      "id": 34,
      "article_id": 20,
      "fournisseur_id": 19,
      "lot": "LOT-99",
      "reference": "REF-ABC",
      "quantite": 23,
      "montant": "2158108.80",
      "date_fabrication": "2025-07-01T00:00:00.000000Z",
      "date_peremption": "2025-12-31T00:00:00.000000Z",
      "etat": "100.00",
      "description": "Description du stock",
      "etat_stock": "actif",
      "created_at": "2025-10-05T23:55:59.000000Z",
      "updated_at": "2025-10-06T00:01:20.000000Z",
      "deleted_at": null,
      "article": {
        "id": 20,
        "famille_id": 7,
        "nom_article": "Yaourt",
        "quantite_standard": 15,
        "description": "Description article",
        "famille": {
          "id": 7,
          "nom_famille": "Produits laitiers"
        }
      },
      "fournisseur": {
        "id": 19,
        "nom": "Charly EKLU",
        "telephone": "+22890515663",
        "adresse": "Segbe, Lome"
      }
    }
  ],
  "links": {...},
  "meta": {...}
}
```

**Caractéristiques:**
- Pagination automatique (50 items par page)
- Relations chargées: `article.famille`, `fournisseur`
- Tri par date de création (plus récent en premier)

---

### 2. **Créer un stock** (Store)
```http
POST /api/stocks
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "article_id": 20,
  "fournisseur_id": 19,
  "lot": "LOT-2025-001",
  "reference": "REF-XYZ",
  "quantite": 50,
  "prix_unitaire": 1500.50,
  "date_fabrication": "2025-10-01",
  "date_peremption": "2025-12-31",
  "description": "Nouveau stock de yaourt"
}
```

**Champs requis:**
- `article_id` (integer, exists:articles,id)
- `quantite` (integer, min:1)
- `prix_unitaire` (numeric, min:0)

**Champs optionnels:**
- `fournisseur_id` (integer, exists:fournisseurs,id)
- `lot` (string, max:190)
- `reference` (string, max:190)
- `date_fabrication` (date)
- `date_peremption` (date, after_or_equal:date_fabrication)
- `description` (string)

**Réponse (201 Created):**
```json
{
  "message": "Stock créé avec succès",
  "data": {
    "id": 35,
    "article_id": 20,
    "quantite": 50,
    "montant": "75025.00",
    "etat": "100.00",
    "etat_stock": "actif",
    "article": {...},
    "fournisseur": {...}
  }
}
```

**Calculs automatiques:**
- `montant` = `quantite` × `prix_unitaire`
- `etat` = 100 (stock neuf)
- `etat_stock` = "actif"

---

### 3. **Afficher un stock** (Show)
```http
GET /api/stocks/{id}
```

**Exemple:**
```http
GET /api/stocks/34
```

**Réponse (200 OK):**
```json
{
  "data": {
    "id": 34,
    "article_id": 20,
    "quantite": 23,
    "montant": "2158108.80",
    "article": {
      "id": 20,
      "nom_article": "Yaourt",
      "famille": {
        "id": 7,
        "nom_famille": "Produits laitiers"
      }
    },
    "fournisseur": {...}
  }
}
```

---

### 4. **Mettre à jour un stock** (Update)
```http
PUT /api/stocks/{id}
Content-Type: application/json
```

**Exemple:**
```http
PUT /api/stocks/34
```

**Body (JSON):**
```json
{
  "article_id": 20,
  "fournisseur_id": 19,
  "lot": "LOT-2025-002",
  "reference": "REF-ABC-UPDATED",
  "quantite": 30,
  "prix_unitaire": 2000.00,
  "date_fabrication": "2025-10-01",
  "date_peremption": "2025-12-31",
  "description": "Stock mis à jour"
}
```

**Réponse (200 OK):**
```json
{
  "message": "Stock mis à jour avec succès",
  "data": {
    "id": 34,
    "quantite": 30,
    "montant": "60000.00",
    "article": {...},
    "fournisseur": {...}
  }
}
```

**Note:** Le montant est recalculé automatiquement lors de la mise à jour.

---

### 5. **Supprimer un stock** (Destroy)
```http
DELETE /api/stocks/{id}
```

**Exemple:**
```http
DELETE /api/stocks/34
```

**Réponse (200 OK):**
```json
{
  "message": "Stock supprimé avec succès",
  "id": 34
}
```

**Note:** Utilise le soft delete (deleted_at) pour conserver l'historique.

---

## Exemples avec cURL

### Lister les stocks
```bash
curl -X GET "http://127.0.0.1:8000/api/stocks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Créer un stock
```bash
curl -X POST "http://127.0.0.1:8000/api/stocks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "article_id": 20,
    "fournisseur_id": 19,
    "quantite": 100,
    "prix_unitaire": 1500.00,
    "lot": "LOT-2025-003",
    "description": "Nouveau stock"
  }'
```

### Afficher un stock
```bash
curl -X GET "http://127.0.0.1:8000/api/stocks/34" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Mettre à jour un stock
```bash
curl -X PUT "http://127.0.0.1:8000/api/stocks/34" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "article_id": 20,
    "quantite": 50,
    "prix_unitaire": 2000.00
  }'
```

### Supprimer un stock
```bash
curl -X DELETE "http://127.0.0.1:8000/api/stocks/34" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

---

## Structure des Resources

### StockResource
Transforme les données Stock avec relations imbriquées:
- Article complet avec famille
- Fournisseur complet
- Calculs automatiques (montant, état)

### ArticleResource
Inclut automatiquement la famille si chargée via `whenLoaded()`.

### FournisseurResource
Retourne les informations complètes du fournisseur.

---

## Gestion des erreurs

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 404 Not Found
```json
{
  "message": "No query results for model [App\\Models\\Stock] 999"
}
```

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "article_id": [
      "Le champ article id est obligatoire."
    ],
    "quantite": [
      "Le champ quantite doit être au minimum 1."
    ]
  }
}
```

---

## Architecture technique

### Contrôleur
`App\Http\Controllers\Api\StockController`

### Request Validation
`App\Http\Requests\Stock\StoreStockRequest`

### Resource
`App\Http\Resources\StockResource`

### Modèle
`App\Models\Stock`

### Middleware
- `auth:sanctum` - Authentification requise

---

## Améliorations implémentées

✅ **StockResource avec `whenLoaded()`** - Chargement conditionnel des relations  
✅ **ArticleResource amélioré** - Inclusion automatique de la famille  
✅ **Calcul automatique du montant** - `quantite × prix_unitaire`  
✅ **Gestion de l'état** - Stock neuf = 100%, etat_stock = "actif"  
✅ **Relations complètes** - `article.famille` et `fournisseur` toujours chargés  
✅ **Routes API RESTful** - Convention Laravel avec apiResources  
✅ **Validation robuste** - StoreStockRequest avec règles françaises  
✅ **Messages en français** - Tous les messages de succès localisés  
✅ **Soft deletes** - Conservation de l'historique des suppressions  

---

**Dernière mise à jour:** 2025-10-06
