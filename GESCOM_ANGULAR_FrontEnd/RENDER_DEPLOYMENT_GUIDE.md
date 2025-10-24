# 🚀 Guide de Déploiement sur Render

## 📋 Configuration Complétée

### ✅ 1. Fichiers d'Environnement Angular

Les fichiers suivants ont été créés/configurés pour la production :

- **`src/environments/environment.prod.ts`** ✓
- **`src/app/environment.prod.ts`** ✓
- **`angular.json`** : Configuration `fileReplacements` ajoutée ✓

### ✅ 2. Configuration CORS Laravel

Le fichier **`config/cors.php`** a été mis à jour pour autoriser :
- `http://localhost:4200` (développement local)
- `https://gescom-frontend-r4do.onrender.com` (production Render)

---

## 🔧 Configuration à Personnaliser

### 🎯 Étape 1 : Mettre à Jour les URLs Render

**Dans les fichiers Angular :**
- `src/environments/environment.prod.ts`
- `src/app/environment.prod.ts`

**Remplacez :**
```typescript
apiBaseUrl: 'https://gescom-backend-xyz.onrender.com/api',
webBaseUrl: 'https://gescom-backend-xyz.onrender.com',
```

**Par l'URL réelle de votre backend Laravel sur Render.**

**Exemple :**
```typescript
apiBaseUrl: 'https://gescom-api-prod.onrender.com/api',
webBaseUrl: 'https://gescom-api-prod.onrender.com',
```

---

### 🎯 Étape 2 : Vérifier les CORS Laravel

**Dans le backend Laravel :**  
Fichier : `config/cors.php`

**Vérifiez que l'URL de votre frontend est correcte :**
```php
'allowed_origins' => [
    'http://localhost:4200',
    'https://gescom-frontend-r4do.onrender.com', // ← Vérifiez cette URL
],
```

---

## 🏗️ Déploiement

### 📦 Frontend Angular

**1. Builder l'application en mode production :**
```bash
ng build --configuration production
```

**2. Vérifier le dossier de sortie :**
```bash
# Le build sera dans : dist/materialm/
```

**3. Sur Render :**
- **Type de service** : Static Site
- **Build Command** : `npm install && ng build --configuration production`
- **Publish Directory** : `dist/materialm/browser`

---

### 🔐 Backend Laravel

**1. Mettre à jour la configuration CORS sur le serveur :**
```bash
php artisan config:cache
php artisan config:clear
```

**2. Variables d'environnement sur Render :**

Assurez-vous d'avoir configuré :
```
APP_URL=https://votre-backend.onrender.com
FRONTEND_URL=https://gescom-frontend-r4do.onrender.com
APP_ENV=production
APP_DEBUG=false
```

**3. Fichier `.env` Laravel - Section CORS :**
```env
SANCTUM_STATEFUL_DOMAINS=gescom-frontend-r4do.onrender.com
SESSION_DOMAIN=.onrender.com
```

---

## 🧪 Tests Après Déploiement

### ✅ Vérifier la Communication

**1. Ouvrez la console développeur de votre navigateur**

**2. Vérifiez les requêtes API :**
- Les requêtes doivent pointer vers : `https://votre-backend.onrender.com/api`
- Pas d'erreurs CORS
- Status 200 ou les codes appropriés

**3. Tester une action :**
- Connexion utilisateur
- Récupération de données
- Opérations CRUD

---

## 🚨 Dépannage

### ❌ Erreur CORS

**Symptôme :**
```
Access to XMLHttpRequest at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Solution :**
1. Vérifiez `config/cors.php` dans Laravel
2. Exécutez `php artisan config:cache`
3. Redéployez le backend

---

### ❌ Backend Non Joignable

**Symptôme :**
```
ERR_CONNECTION_REFUSED ou 404
```

**Solution :**
1. Vérifiez que l'URL du backend est correcte dans `environment.prod.ts`
2. Vérifiez que le service Laravel sur Render est actif
3. Testez l'URL du backend directement dans le navigateur

---

### ❌ Frontend Affiche localhost:1000

**Symptôme :**
Le frontend en production appelle encore `localhost:1000`

**Solution :**
1. Vérifiez que le build a bien été fait avec `--configuration production`
2. Vérifiez `angular.json` - section `fileReplacements`
3. Rebuilder et redéployer

---

## 📝 Checklist de Déploiement

- [ ] URLs Render mises à jour dans `environment.prod.ts`
- [ ] URLs Render mises à jour dans `src/app/environment.prod.ts`
- [ ] CORS configuré dans Laravel `config/cors.php`
- [ ] Build Angular en mode production
- [ ] Frontend déployé sur Render
- [ ] Backend déployé sur Render
- [ ] Variables d'environnement Laravel configurées
- [ ] Cache Laravel nettoyé (`php artisan config:cache`)
- [ ] Tests de communication frontend ↔️ backend
- [ ] Tests fonctionnels (login, API calls)

---

## 🎉 Résultat Attendu

Une fois tout configuré :
- **Frontend** : `https://gescom-frontend-r4do.onrender.com`
- **Backend** : `https://votre-backend.onrender.com`
- Communication fluide via HTTPS
- Pas d'erreurs CORS
- Application fonctionnelle en production

---

**📚 Ressources Utiles :**
- [Documentation Render](https://render.com/docs)
- [Angular Environments](https://angular.dev/tools/cli/environments)
- [Laravel CORS](https://laravel.com/docs/11.x/routing#cors)
