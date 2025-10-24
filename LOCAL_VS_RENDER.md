# 🔄 Local vs Render - Comprendre la Différence

## 💡 La Question Essentielle

> "Sur Render, mon frontend et mon backend ne communiquent pas automatiquement, même s'ils sont dans le même projet GitHub. Pourquoi ?"

**Réponse courte** : Parce qu'ils sont déployés sur des **conteneurs séparés** avec des **URLs publiques différentes**.

---

## 🖥️ En Local (sur votre PC)

### Architecture

```
┌─────────────────────────────────────────┐
│         Votre Ordinateur (localhost)    │
│                                         │
│  ┌─────────────┐      ┌──────────────┐ │
│  │  Angular    │      │   Laravel    │ │
│  │  Frontend   │ ───> │   Backend    │ │
│  │  :4200      │      │   :1000      │ │
│  └─────────────┘      └──────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Comment ça marche ?

1. **Backend Laravel** tourne sur `http://localhost:1000`
2. **Frontend Angular** tourne sur `http://localhost:4200`
3. Le frontend appelle le backend via `http://localhost:1000/api/...`

**C'est simple** : tout est sur la même machine (localhost = votre PC)

### Configuration Locale

#### Frontend : `environment.ts`
```typescript
export const environment = {
  apiBaseUrl: 'http://localhost:1000/api',
  webBaseUrl: 'http://localhost:1000',
};
```

#### Backend : `config/cors.php`
```php
'allowed_origins' => [
    'http://localhost:4200',
],
```

---

## ☁️ Sur Render (Cloud)

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                      │
└──────────────────────────────────────────────────────────┘
        │                               │
        │                               │
        ▼                               ▼
┌─────────────────┐          ┌──────────────────────┐
│  Conteneur 1    │          │   Conteneur 2        │
│  (Static Site)  │          │   (Web Service)      │
│                 │          │                      │
│  Angular        │   HTTPS  │   Laravel            │
│  Frontend       │  ─────>  │   Backend            │
│                 │          │                      │
│  gescom-        │          │   gescom-backend-    │
│  angular-       │          │   laravel.           │
│  frontend.      │          │   onrender.com       │
│  onrender.com   │          │                      │
└─────────────────┘          └──────────────────────┘
  (Frankfurt)                  (Frankfurt ou autre)
```

### Comment ça marche ?

1. **Backend Laravel** est sur `https://gescom-backend-laravel.onrender.com`
2. **Frontend Angular** est sur `https://gescom-angular-frontend.onrender.com`
3. Ce sont **deux services distincts** sur **deux URLs différentes**
4. Le frontend doit connaître **explicitement** l'URL du backend

**C'est différent** : ils ne sont pas sur la même machine, ils communiquent via Internet (HTTPS)

### Configuration Production

#### Frontend : `environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://gescom-backend-laravel.onrender.com/api',
  webBaseUrl: 'https://gescom-backend-laravel.onrender.com',
};
```

#### Backend : `config/cors.php`
```php
'allowed_origins' => [
    'http://localhost:4200',  // Pour le dev local
    'https://gescom-angular-frontend.onrender.com',  // Pour Render
],
```

---

## 🔑 Différences Clés

| Aspect | Local | Render |
|--------|-------|--------|
| **URLs** | `localhost:4200` et `localhost:1000` | `*.onrender.com` (URLs publiques) |
| **Protocole** | HTTP | HTTPS |
| **Conteneurs** | Même machine | Machines séparées |
| **Port 1000** | Accessible directement | Accessible via URL Render uniquement |
| **Communication** | Localhost | Internet (HTTPS) |
| **CORS** | Optionnel (même origine) | **Obligatoire** (origines différentes) |

---

## 🚨 Erreurs Fréquentes

### ❌ Erreur 1 : Oublier de changer l'URL backend

**Symptôme** :
```
GET http://localhost:1000/api/articles failed: ERR_CONNECTION_REFUSED
```

**Cause** : Le frontend tente d'appeler `localhost:1000` depuis Render (ça n'existe pas là-bas)

**Solution** : Mettre à jour `environment.prod.ts` avec l'URL Render du backend

---

### ❌ Erreur 2 : CORS non configuré

**Symptôme** :
```
Access to XMLHttpRequest at 'https://gescom-backend-laravel.onrender.com/api/articles' 
from origin 'https://gescom-angular-frontend.onrender.com' has been blocked by CORS policy
```

**Cause** : Le backend n'autorise pas les requêtes depuis l'URL frontend Render

**Solution** : Ajouter l'URL frontend dans `config/cors.php`

---

### ❌ Erreur 3 : Port 1000 n'est pas accessible

**Symptôme** :
```
Cannot access https://gescom-backend-laravel.onrender.com:1000/api/articles
```

**Cause** : Tentative d'accéder au port 1000 directement

**Solution** : Sur Render, ne jamais mettre le port dans l'URL. Utilisez uniquement :
```
https://gescom-backend-laravel.onrender.com/api/...
```

---

## 🔍 Comprendre le Port 1000

### En Local
```
http://localhost:1000
         ^       ^
         |       └─ Port 1000 (accessible)
         └─ Votre PC
```

### Sur Render
```
https://gescom-backend-laravel.onrender.com
  ^                                   ^
  |                                   └─ Pas de port (HTTPS = 443 par défaut)
  └─ Protocole HTTPS
```

Le **port 1000** sur Render :
- Est **interne** au conteneur Docker
- N'est **pas accessible** depuis Internet
- Render fait un **mapping** automatique :
  - Internet (port 443) → Conteneur (port 1000)

---

## 📊 Schéma Complet de Communication

### Local
```
Navigateur
   │
   │ http://localhost:4200
   ▼
Angular Frontend (PC)
   │
   │ http://localhost:1000/api/...
   ▼
Laravel Backend (PC)
   │
   ▼
Base de données (PC)
```

### Render
```
Navigateur
   │
   │ https://gescom-angular-frontend.onrender.com
   ▼
Angular Frontend (Conteneur Render)
   │
   │ https://gescom-backend-laravel.onrender.com/api/...
   │ (Requête HTTPS via Internet)
   ▼
Laravel Backend (Conteneur Render)
   │
   ▼
Base de données SQLite (Conteneur Render)
Firebase/Firestore (Externe)
```

---

## ✅ Checklist de Configuration

Pour que le frontend et le backend communiquent sur Render :

- [ ] **Frontend** : `environment.prod.ts` contient l'URL Render du backend
- [ ] **Backend** : `config/cors.php` autorise l'URL Render du frontend
- [ ] **Backend** : Ne pas inclure le port dans l'URL publique
- [ ] **HTTPS** : Utiliser HTTPS (pas HTTP) sur Render
- [ ] **Rebuild** : Reconstruire le frontend après modification de `environment.prod.ts`
- [ ] **Redeploy** : Redéployer le backend après modification de `config/cors.php`

---

## 🎯 En Résumé

### Local = Facile
- Tout sur la même machine
- `localhost` partout
- Pas besoin de CORS (optionnel)

### Render = Configuration Nécessaire
- Services sur des machines séparées
- URLs publiques différentes
- CORS **obligatoire**
- Frontend doit connaître l'URL backend
- Backend doit autoriser l'URL frontend

---

## 💡 Astuce

Pour éviter la confusion, créez un tableau dans vos notes :

| Environnement | Frontend URL | Backend URL |
|---------------|--------------|-------------|
| **Local** | `http://localhost:4200` | `http://localhost:1000` |
| **Render** | `https://gescom-angular-frontend.onrender.com` | `https://gescom-backend-laravel.onrender.com` |

Et référez-vous toujours à ce tableau quand vous configurez les fichiers d'environnement !

---

**Maintenant vous savez pourquoi la communication ne se fait pas automatiquement sur Render ! 🎓**
