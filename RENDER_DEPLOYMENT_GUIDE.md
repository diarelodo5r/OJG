# 🚀 Guide de Déploiement sur Render - GESCOM

## 📦 Architecture sur Render

```
Frontend Angular                    Backend Laravel
┌─────────────────────┐            ┌─────────────────────┐
│ gescom-angular-     │   HTTPS    │ gescom-backend-     │
│ frontend            │ ────────>  │ laravel             │
│ (Static Site)       │            │ (Docker/PHP)        │
│ Port: 443           │            │ Port: 1000          │
└─────────────────────┘            └─────────────────────┘
https://gescom-angular-frontend.onrender.com
                                   https://gescom-backend-laravel.onrender.com
```

---

## 🎯 Étape 1 : Déployer le Backend Laravel

### 1.1 Créer le service sur Render

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur **New +** → **Web Service**
3. Connectez votre repo GitHub contenant `GESCOM_LARAVEL_FireBaseXDrive`
4. Configuration :
   - **Name** : `gescom-backend-laravel`
   - **Region** : Frankfurt (ou proche de vous)
   - **Branch** : `main` ou `master`
   - **Root Directory** : `GESCOM_LARAVEL_FireBaseXDrive` (si monorepo)
   - **Environment** : `Docker`
   - **Plan** : Free

### 1.2 Configurer les variables d'environnement

Dans l'onglet **Environment** de votre service :

```bash
# Application
APP_NAME=Gescom
APP_ENV=production
APP_DEBUG=false
APP_URL=https://gescom-backend-laravel.onrender.com

# Générer une clé APP_KEY
php artisan key:generate --show
# Coller la valeur dans Render

# Base de données
DB_CONNECTION=sqlite

# Sessions & Cache
SESSION_DRIVER=database
CACHE_STORE=database

# Logs
LOG_CHANNEL=stack
LOG_LEVEL=error

# Firebase (à remplir avec vos valeurs)
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_CREDENTIALS_PATH=/var/www/html/firebase-credentials.json
FIREBASE_STORAGE_BUCKET=votre-bucket.appspot.com

# Google Drive (à remplir avec vos valeurs)
GOOGLE_API_KEY=votre-api-key
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
DRIVE_FOLDER_IMAGES=folder-id-images
DRIVE_FOLDER_VIDEOS=folder-id-videos
DRIVE_FOLDER_AUDIO=folder-id-audio
DRIVE_FOLDER_DOCUMENTS=folder-id-documents
```

### 1.3 Ajouter le fichier Firebase Credentials

Si vous utilisez Firebase, ajoutez votre fichier `firebase-credentials.json` :

1. Dans Render, allez dans **Settings** → **Secret Files**
2. Créez un nouveau fichier :
   - **Filename** : `firebase-credentials.json`
   - **Contents** : Collez le contenu de votre fichier JSON Firebase

### 1.4 Déployer

Cliquez sur **Manual Deploy** → **Deploy latest commit**

⏱️ Le build prendra environ 5-10 minutes.

---

## 🎨 Étape 2 : Déployer le Frontend Angular

### 2.1 Vérifier l'URL du backend

✅ **Déjà configuré** dans `environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://gescom-backend-laravel.onrender.com/api',
  webBaseUrl: 'https://gescom-backend-laravel.onrender.com',
  // ...
};
```

⚠️ **IMPORTANT** : Si votre backend a une URL différente, mettez à jour ce fichier AVANT le déploiement.

### 2.2 Créer le service sur Render

1. **New +** → **Static Site**
2. Connectez le même repo GitHub
3. Configuration :
   - **Name** : `gescom-angular-frontend`
   - **Branch** : `main` ou `master`
   - **Root Directory** : `GESCOM_ANGULAR_FrontEnd` (si monorepo)
   - **Build Command** : `npm ci && npm run build`
   - **Publish Directory** : `dist/materialm/browser`

### 2.3 Configuration des redirections (SPA)

✅ **Déjà configuré** dans `render.yaml` :

Le fichier `_redirects` dans `/src` contient :
```
/*    /index.html   200
```

Cela permet au routeur Angular de fonctionner correctement.

### 2.4 Déployer

Cliquez sur **Manual Deploy** → **Deploy latest commit**

⏱️ Le build prendra environ 3-5 minutes.

---

## 🔐 Étape 3 : Vérifier les CORS

### 3.1 Backend - config/cors.php

✅ **Déjà configuré** :

```php
'allowed_origins' => [
    'http://localhost:4200',
    'https://gescom-angular-frontend.onrender.com',
],
```

### 3.2 Tester les CORS

Une fois le frontend et backend déployés, testez une requête :

```bash
curl -X OPTIONS https://gescom-backend-laravel.onrender.com/api/health \
  -H "Origin: https://gescom-angular-frontend.onrender.com" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

Vous devriez voir :
```
< Access-Control-Allow-Origin: https://gescom-angular-frontend.onrender.com
< Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## 🧪 Étape 4 : Tester la communication

### 4.1 Depuis le navigateur

1. Ouvrez : `https://gescom-angular-frontend.onrender.com`
2. Ouvrez les DevTools (F12) → Onglet **Network**
3. Effectuez une action qui appelle l'API
4. Vérifiez que les requêtes vers `gescom-backend-laravel.onrender.com` sont en status **200 OK**

### 4.2 Vérifier les erreurs

**Si vous voyez une erreur CORS** :
```
Access to XMLHttpRequest at 'https://gescom-backend-laravel.onrender.com/api/...' 
from origin 'https://gescom-angular-frontend.onrender.com' has been blocked by CORS policy
```

→ Retournez dans le backend et vérifiez `config/cors.php`
→ Redéployez le backend après modification

**Si vous voyez 404 ou 500** :
→ Vérifiez les logs du backend sur Render (onglet **Logs**)

---

## 🔄 Redéploiements

### Backend Laravel

Après modification du code :
```bash
git add .
git commit -m "fix: correction API"
git push origin main
```

Render détectera automatiquement le push et redéploiera (si auto-deploy activé).

### Frontend Angular

⚠️ **IMPORTANT** : Si vous modifiez `environment.prod.ts`, vous DEVEZ reconstruire et redéployer :

```bash
# Localement (facultatif, pour tester)
npm run build --configuration production

# Puis commit et push
git add .
git commit -m "feat: mise à jour URL API"
git push origin main
```

---

## 📝 URLs finales

Une fois déployé, notez vos URLs :

| Service | URL |
|---------|-----|
| **Frontend Angular** | `https://gescom-angular-frontend.onrender.com` |
| **Backend Laravel API** | `https://gescom-backend-laravel.onrender.com/api` |
| **Backend Health Check** | `https://gescom-backend-laravel.onrender.com/api/health` |

---

## ⚠️ Points d'attention

### 1. Plan Free de Render

- Le service **s'endort après 15 min d'inactivité**
- La première requête après réveil prend **50 secondes**
- Solution : utiliser un service de ping (ex: [UptimeRobot](https://uptimerobot.com/))

### 2. Secrets Firebase

- Ne JAMAIS commiter `firebase-credentials.json` dans Git
- Utilisez la fonctionnalité **Secret Files** de Render

### 3. Variables d'environnement sensibles

- Les clés Google API, Client ID/Secret doivent être dans les **Environment Variables** de Render
- Ne les écrivez JAMAIS en dur dans le code

### 4. Build time

- **Backend** : ~5-10 min (compile grpc, protobuf, etc.)
- **Frontend** : ~3-5 min (npm install + build Angular)

### 5. HTTPS obligatoire

- Render utilise HTTPS par défaut
- Vérifiez que votre code ne force pas HTTP

---

## 🐛 Débogage

### Logs Backend

```bash
# Sur Render, onglet Logs du service backend
# Ou via CLI Render
render logs -s gescom-backend-laravel
```

### Logs Frontend

Les logs de build sont dans l'onglet **Logs** du service static.

Pour les logs runtime (navigateur) :
- F12 → Console
- F12 → Network

---

## ✅ Checklist finale

- [ ] Backend déployé et accessible via `https://gescom-backend-laravel.onrender.com/api/health`
- [ ] Frontend déployé et accessible via `https://gescom-angular-frontend.onrender.com`
- [ ] Les requêtes API depuis le frontend passent (pas d'erreur CORS)
- [ ] Les variables d'environnement sont configurées (Firebase, Google Drive)
- [ ] Le fichier `firebase-credentials.json` est ajouté en Secret File
- [ ] Les deux services ont auto-deploy activé (facultatif)

---

## 📚 Ressources

- [Documentation Render](https://render.com/docs)
- [Laravel CORS](https://laravel.com/docs/11.x/routing#cors)
- [Angular Environments](https://angular.dev/tools/cli/environments)

---

**Bon déploiement ! 🚀**
