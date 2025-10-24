# ✅ Checklist de Déploiement Render - GESCOM

## 🎯 Avant de Déployer

### Prérequis
- [ ] Compte Render créé et connecté à GitHub
- [ ] Repo GitHub contenant les deux projets (Frontend + Backend)
- [ ] Clés API Google/Firebase prêtes (si applicable)

---

## 🔧 Backend Laravel

### Configuration Locale
- [x] Fichier `render.yaml` créé à la racine du projet backend
- [x] Endpoint `/api/health` ajouté dans `routes/api.php`
- [x] CORS configuré dans `config/cors.php` avec l'URL frontend Render
- [ ] `APP_KEY` généré localement avec `php artisan key:generate`

### Sur Render Dashboard
- [ ] Service Web créé (Docker)
- [ ] Variables d'environnement configurées :
  - [ ] `APP_NAME`
  - [ ] `APP_ENV=production`
  - [ ] `APP_DEBUG=false`
  - [ ] `APP_KEY` (copier depuis local)
  - [ ] `APP_URL` (URL du backend Render)
  - [ ] `DB_CONNECTION=sqlite`
  - [ ] `SESSION_DRIVER=database`
  - [ ] `CACHE_STORE=database`
  - [ ] Firebase : `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`
  - [ ] Google : `GOOGLE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - [ ] Dossiers Drive : `DRIVE_FOLDER_*`
- [ ] Secret File `firebase-credentials.json` ajouté (si Firebase utilisé)
- [ ] Deploy déclenché
- [ ] Logs vérifiés (pas d'erreur)
- [ ] Health check accessible : `https://<backend-url>/api/health`

---

## 🎨 Frontend Angular

### Configuration Locale
- [x] Fichier `render.yaml` créé à la racine du projet frontend
- [x] Fichier `_redirects` présent dans `src/`
- [x] Fichier `environment.prod.ts` mis à jour avec l'URL backend Render :
  ```typescript
  apiBaseUrl: 'https://gescom-backend-laravel.onrender.com/api'
  ```
- [ ] Build de test local réussi : `npm run build --configuration production`

### Sur Render Dashboard
- [ ] Static Site créé
- [ ] Build Command : `npm ci && npm run build`
- [ ] Publish Directory : `dist/materialm/browser`
- [ ] Deploy déclenché
- [ ] Logs vérifiés (build successful)
- [ ] Site accessible : `https://<frontend-url>`

---

## 🧪 Tests Post-Déploiement

### 1. Backend
- [ ] `https://<backend-url>/api/health` retourne `{"status":"ok",...}`
- [ ] Logs backend : pas d'erreur critique

### 2. Frontend
- [ ] `https://<frontend-url>` charge correctement
- [ ] F12 → Console : pas d'erreur JavaScript
- [ ] F12 → Network : pas d'erreur de chargement de ressources

### 3. Communication Frontend ↔ Backend
- [ ] Ouvrir le frontend dans le navigateur
- [ ] F12 → Network
- [ ] Effectuer une action (login, charger des données, etc.)
- [ ] Vérifier que les requêtes vers `<backend-url>/api/...` sont **200 OK**
- [ ] Pas d'erreur CORS dans la console

---

## 🐛 En Cas de Problème

### Erreur CORS
```
Access-Control-Allow-Origin error
```
→ Vérifier `config/cors.php` backend et redéployer

### 404 sur routes Angular
```
Cannot GET /products
```
→ Vérifier le fichier `_redirects` dans `src/`

### Backend ne démarre pas
→ Consulter **Logs** sur Render Dashboard
→ Vérifier les variables d'environnement (surtout `APP_KEY`)

### Frontend ne build pas
→ Consulter **Logs** sur Render Dashboard
→ Vérifier `package.json` et les dépendances

---

## 📝 URLs Finales

Notez vos URLs ici après déploiement :

```
Frontend :  https://_______________________________.onrender.com
Backend  :  https://_______________________________.onrender.com
API Base :  https://_______________________________.onrender.com/api
Health   :  https://_______________________________.onrender.com/api/health
```

---

## 🔄 Redéploiement Futur

### Backend
```bash
# Après modification du code
git add .
git commit -m "fix: correction API"
git push origin main
# → Render redéploie automatiquement
```

### Frontend
```bash
# Si modification de environment.prod.ts ou code Angular
git add .
git commit -m "feat: mise à jour"
git push origin main
# → Render rebuild automatiquement
```

---

## ⚡ Optimisations Post-Déploiement

- [ ] Activer Auto-Deploy sur Render (main branch)
- [ ] Configurer UptimeRobot pour ping le backend (évite sleep)
- [ ] Ajouter les URLs dans les favoris
- [ ] Partager les URLs avec l'équipe

---

**Bon déploiement ! 🚀**

_Dernière vérification : ___/___/______
