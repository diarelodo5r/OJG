# 🌐 Configuration des URLs Render - GESCOM

## 📍 URLs de Production

### Frontend Angular
```
Production URL:  https://gescom-angular-frontend.onrender.com
Service Name:    gescom-angular-frontend
Type:            Static Site
Region:          Frankfurt (ou votre choix)
```

### Backend Laravel  
```
Production URL:  https://gescom-backend-laravel.onrender.com
API Base URL:    https://gescom-backend-laravel.onrender.com/api
Health Check:    https://gescom-backend-laravel.onrender.com/api/health
Service Name:    gescom-backend-laravel
Type:            Web Service (Docker)
Region:          Frankfurt (ou votre choix)
Port:            1000 (interne)
```

---

## 🔧 Fichiers de Configuration

### ✅ Backend Laravel

#### `config/cors.php`
```php
'allowed_origins' => [
    'http://localhost:4200',                          // Développement local
    'https://gescom-angular-frontend.onrender.com',   // Production Render
],
```

#### `render.yaml`
```yaml
services:
  - type: web
    name: gescom-backend-laravel
    env: docker
    healthCheckPath: /api/health
```

---

### ✅ Frontend Angular

#### `src/environments/environment.ts` (Local)
```typescript
export const environment = {
  apiBaseUrl: 'http://localhost:1000/api',
  webBaseUrl: 'http://localhost:1000',
  // ...
};
```

#### `src/environments/environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://gescom-backend-laravel.onrender.com/api',
  webBaseUrl: 'https://gescom-backend-laravel.onrender.com',
  // ...
};
```

#### `render.yaml`
```yaml
services:
  - type: web
    name: gescom-angular-frontend
    env: static
    buildCommand: npm ci && npm run build
    staticPublishPath: dist/materialm/browser
```

---

## 🔄 Comment Changer les URLs

### Si vous changez le nom du service Backend sur Render :

1. **Dans Render** :
   - Notez la nouvelle URL (ex: `https://nouveau-nom.onrender.com`)

2. **Dans le code Frontend** :
   ```typescript
   // src/environments/environment.prod.ts
   export const environment = {
     production: true,
     apiBaseUrl: 'https://nouveau-nom.onrender.com/api',
     webBaseUrl: 'https://nouveau-nom.onrender.com',
   };
   ```

3. **Rebuilder et redéployer** :
   ```bash
   npm run build --configuration production
   git add .
   git commit -m "feat: update backend URL"
   git push origin main
   ```

### Si vous changez le nom du service Frontend sur Render :

1. **Dans Render** :
   - Notez la nouvelle URL (ex: `https://nouveau-frontend.onrender.com`)

2. **Dans le code Backend** :
   ```php
   // config/cors.php
   'allowed_origins' => [
       'http://localhost:4200',
       'https://nouveau-frontend.onrender.com',
   ],
   ```

3. **Redéployer le backend** :
   ```bash
   git add .
   git commit -m "fix: update CORS for new frontend URL"
   git push origin main
   ```

---

## 🧪 Tester la Communication

### 1. Tester le Backend seul

```bash
# Health check
curl https://gescom-backend-laravel.onrender.com/api/health

# Réponse attendue :
{
  "status": "ok",
  "timestamp": "2025-01-24T01:30:00+00:00",
  "service": "GESCOM Backend API"
}
```

### 2. Tester le Frontend seul

Ouvrez : `https://gescom-angular-frontend.onrender.com`

Vous devriez voir votre application Angular chargée.

### 3. Tester la Communication Frontend → Backend

1. Ouvrez : `https://gescom-angular-frontend.onrender.com`
2. F12 → **Network**
3. Effectuez une action (login, chargement de données, etc.)
4. Vérifiez que les requêtes vers `gescom-backend-laravel.onrender.com` sont **200 OK**

---

## ⚠️ Problèmes Fréquents

### ❌ Erreur CORS

```
Access to XMLHttpRequest at 'https://gescom-backend-laravel.onrender.com/api/...' 
from origin 'https://gescom-angular-frontend.onrender.com' has been blocked by CORS policy
```

**Solution** :
1. Vérifiez `config/cors.php` côté backend
2. Assurez-vous que l'URL du frontend est bien dans `allowed_origins`
3. Redéployez le backend

### ❌ 404 Not Found sur une route Angular

```
Cannot GET /products
```

**Solution** :
- Vérifiez que le fichier `_redirects` existe dans `src/`
- Contenu : `/*    /index.html   200`
- Redéployez le frontend

### ❌ Le backend ne démarre pas

**Solution** :
1. Allez dans **Logs** du service backend sur Render
2. Vérifiez les erreurs (souvent : variables d'environnement manquantes)
3. Assurez-vous que `APP_KEY` est défini

---

## 📋 Checklist de Vérification

Avant de déployer, vérifiez :

- [ ] `environment.prod.ts` contient la bonne URL backend
- [ ] `config/cors.php` contient la bonne URL frontend
- [ ] `render.yaml` existe dans les deux projets
- [ ] `APP_KEY` est généré et défini côté backend
- [ ] Les variables Firebase/Google sont configurées
- [ ] Le fichier `_redirects` existe dans le frontend

---

## 🔗 Liens Utiles

- Dashboard Backend : `https://dashboard.render.com/web/<backend-service-id>`
- Dashboard Frontend : `https://dashboard.render.com/static/<frontend-service-id>`
- Logs Backend : Onglet **Logs** dans le dashboard
- Logs Frontend : Onglet **Logs** dans le dashboard

---

**Dernière mise à jour** : 24/01/2025
