# API VENTES - Documentation Complète

## Vue d'ensemble

Le système de ventes a été amélioré pour inclure un **déstockage automatique** à chaque enregistrement de vente. Le processus complet inclut :

1. ✅ Validation des données de vente
2. ✅ Vérification de la disponibilité en stock
3. ✅ Création de snapshots (données figées au moment de la vente)
4. ✅ Déstockage automatique (mise à jour des quantités)
5. ✅ Recalcul de l'état du stock
6. ✅ Enregistrement de l'historique complet
7. ✅ Transaction sécurisée (rollback en cas d'erreur)

---

## Endpoints disponibles

### 1. Enregistrer une vente unique
**POST** `/api/ventes`

#### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Body
```json
{
    "stock_id": 1,
    "client_id": 2,
    "quantite": 5,
    "montant": 25000,
    "description": "Vente directe magasin" // Optionnel
}
```

#### Réponse succès (201)
```json
{
    "success": true,
    "message": "Vente enregistrée avec succès",
    "data": {
        "id": 15,
        "stock_id": 1,
        "client_id": 2,
        "quantite": 5,
        "montant": 25000,
        "nom_article_snapshot": "Article XYZ",
        "nom_famille_snapshot": "Famille ABC",
        "prix_vente_snapshot": 5000,
        "prix_achat_snapshot": 3000,
        "nom_fournisseur_snapshot": "Fournisseur DEF",
        "lot_snapshot": "LOT001",
        "reference_snapshot": "REF-123",
        "conditionnement_snapshot": "Boîte de 10",
        "image_article_snapshot": "uploads/articles/xyz.jpg",
        "description": "Vente directe magasin",
        "created_at": "2025-10-09T18:44:00.000000Z",
        "stock": { ... },
        "client": { ... }
    }
}
```

#### Réponse erreur (400)
```json
{
    "success": false,
    "message": "Erreur: Quantité en stock insuffisante. Disponible: 3, Demandé: 5"
}
```

---

### 2. Enregistrer plusieurs ventes en lot
**POST** `/api/ventes/batch`

#### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Body
```json
{
    "ventes": [
        {
            "stock_id": 1,
            "client_id": 2,
            "quantite": 5,
            "montant": 25000,
            "description": "Vente directe magasin" // Optionnel
        },
        {
            "stock_id": 3,
            "client_id": 2,
            "quantite": 10,
            "montant": 50000,
            "description": "Vente en gros" // Optionnel
        },
        {
            "stock_id": 5,
            "client_id": 4,
            "quantite": 2,
            "montant": 8000,
            "description": "Commande spéciale" // Optionnel
        }
    ]
}
```

#### Réponse succès (201)
```json
{
    "success": true,
    "message": "Ventes enregistrées avec succès",
    "data": [
        {
            "id": 16,
            "stock_id": 1,
            "client_id": 2,
            ...
        },
        {
            "id": 17,
            "stock_id": 3,
            "client_id": 2,
            ...
        },
        {
            "id": 18,
            "stock_id": 5,
            "client_id": 4,
            ...
        }
    ]
}
```

#### Réponse erreur (400)
```json
{
    "success": false,
    "message": "Erreur: Quantité en stock insuffisante pour l'article ID 3. Disponible: 7, Demandé: 10"
}
```

---

### 3. Lister toutes les ventes
**GET** `/api/ventes`

#### Réponse (200)
```json
{
    "current_page": 1,
    "data": [
        {
            "id": 1,
            "stock_id": 1,
            "client_id": 2,
            "quantite": 5,
            "montant": 25000,
            ...
            "stock": { ... },
            "client": { ... }
        },
        ...
    ],
    "per_page": 20,
    "total": 45
}
```

---

### 4. Voir une vente spécifique
**GET** `/api/ventes/{id}`

#### Réponse (200)
```json
{
    "id": 1,
    "stock_id": 1,
    "client_id": 2,
    "quantite": 5,
    "montant": 25000,
    "nom_article_snapshot": "Article XYZ",
    ...
    "stock": { ... },
    "client": { ... }
}
```

---

### 5. Mettre à jour une vente
**PUT/PATCH** `/api/ventes/{id}`

⚠️ **Attention**: La mise à jour d'une vente ne redéclenche PAS le déstockage automatique.

---

### 6. Supprimer une vente
**DELETE** `/api/ventes/{id}`

⚠️ **Attention**: La suppression d'une vente ne restaure PAS automatiquement le stock.

---

## Processus de déstockage automatique

Lorsqu'une vente est enregistrée, le système effectue automatiquement :

### 1. Récupération des données complètes
```php
- Article (nom, prix vente, conditionnement, image)
- Famille (nom)
- Fournisseur (nom, prix achat)
- Stock (quantité, lot, référence)
```

### 2. Validation
```php
- Vérification de l'existence du stock
- Vérification de la quantité disponible
- Si insuffisant → Exception → Rollback
```

### 3. Création de snapshots
Toutes les données au moment de la vente sont figées :
- `nom_article_snapshot`
- `nom_famille_snapshot`
- `prix_vente_snapshot`
- `prix_achat_snapshot`
- `nom_fournisseur_snapshot`
- `lot_snapshot`
- `reference_snapshot`
- `conditionnement_snapshot`
- `image_article_snapshot`
- `description` (optionnel)

### 4. Mise à jour du stock
```php
stock.quantite = stock.quantite - quantite_vendue
```

### 5. Recalcul de l'état
```php
stock.etat = (stock.quantite / article.quantite_standard) * 100
```

### 6. Enregistrement de l'historique
Création de 4 enregistrements :
- `historique_quantite_standard`
- `historique_prix_achat` (si fournisseur existe)
- `historique_prix_vente`
- `historiques` (historique principal avec description détaillée)

---

## Codes de réponse HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| 200 | OK | Succès (GET, PUT) |
| 201 | Created | Vente créée avec succès |
| 400 | Bad Request | Données invalides ou stock insuffisant |
| 401 | Unauthorized | Token manquant ou invalide |
| 404 | Not Found | Ressource non trouvée |
| 422 | Unprocessable Entity | Erreur de validation |

---

## Exemples d'utilisation avec Postman

### Exemple 1 : Vente unique
```
POST http://127.0.0.1:8000/api/ventes
Headers:
  Authorization: Bearer.{your_token}
  Content-Type: application/json

Body (raw JSON):
{
    "stock_id": 1,
    "client_id": 2,
    "quantite": 5,
    "montant": 25000,
    "description": "Vente directe magasin"
}
```

### Exemple 2 : Ventes en lot
```
POST http://127.0.0.1:8000/api/ventes/batch
Headers:
  Authorization: Bearer.{your_token}
  Content-Type: application/json

Body (raw JSON):
{
    "ventes": [
        {
            "stock_id": 1,
            "client_id": 2,
            "quantite": 5,
            "montant": 25000,
            "description": "Vente directe magasin"
        },
        {
            "stock_id": 3,
            "client_id": 2,
            "quantite": 10,
            "montant": 50000,
            "description": "Vente en gros"
        }
    ]
}
```

---

## Sécurité et transactions

### Protection transactionnelle
Toutes les opérations de vente utilisent des transactions Laravel :
```php
DB::beginTransaction();
try {
    // Création vente
    // Déstockage
    // Historique
    DB::commit();
} catch (Exception $e) {
    DB::rollBack();
    // Retour erreur
}
```

### Gestion des erreurs
- Quantité insuffisante → Rollback complet
- Stock introuvable → Rollback complet
- Client introuvable → Validation Laravel
- Toute erreur → Aucune modification en base

### Logging
Toutes les erreurs sont loggées dans `storage/logs/laravel.log` :
```php
Log::error('Erreur lors de l\'enregistrement de la vente: ' . $e->getMessage());
```

---

## Intégration avec l'historique

Chaque vente génère automatiquement :

### Historique principal
```
Type: sortie
Description: "Vente de 5 unités pour un montant de 25000.00 CFA. 
              Prix unitaire: 5000.00 CFA, Prix d'achat: 3000.00 CFA"
```

### Traçabilité complète
- ID utilisateur (si authentifié)
- ID stock
- ID fournisseur
- Références vers les historiques de prix
- Date et heure exacte

---

## Notes importantes

1. ✅ Les ventes sont protégées par authentification Sanctum
2. ✅ Les snapshots garantissent l'intégrité des données historiques
3. ✅ Le déstockage est immédiat et automatique
4. ✅ Les transactions garantissent la cohérence des données
5. ⚠️ La modification/suppression ne gère PAS le restockage automatique
6. ⚠️ Vérifier toujours la disponibilité avant de vendre

---

## Support et maintenance

Pour toute question ou problème :
- Vérifier les logs Laravel : `storage/logs/laravel.log`
- Vérifier la configuration de la base de données
- Vérifier que toutes les relations existent
- Tester avec Postman avant l'intégration frontend

---

**Date de création** : 2025-10-09  
**Version** : 1.0  
**Framework** : Laravel 11.x
