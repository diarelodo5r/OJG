# 📚 Documentation Déploiement Render - GESCOM

Bienvenue dans la documentation complète pour déployer l'application GESCOM (Frontend Angular + Backend Laravel) sur **Render**.

---

## 🚀 Démarrage Rapide

**Nouveau sur Render ?** Suivez ce guide dans l'ordre :

1. 📖 Lisez **[RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)**
   - Guide complet pas-à-pas
   - Toutes les étapes de A à Z
   
2. ✅ Utilisez **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)**
   - Checklist à cocher pendant le déploiement
   - Ne ratez aucune étape
   
3. 🔑 Générez votre `APP_KEY` avec **[GENERATE_APP_KEY.md](./GESCOM_LARAVEL_FireBaseXDrive/GENERATE_APP_KEY.md)**
   - Méthodes pour générer la clé de chiffrement Laravel
   
4. 📝 Consultez **[RENDER_SETUP_SUMMARY.md](./GESCOM_LARAVEL_FireBaseXDrive/RENDER_SETUP_SUMMARY.md)**
   - Résumé des modifications apportées au code

---

## 📁 Structure de la Documentation

```
GESCOM/WEBSITE/
│
├── RENDER_DEPLOYMENT_GUIDE.md        # 📖 Guide complet de déploiement
├── DEPLOY_CHECKLIST.md               # ✅ Checklist de déploiement
├── RENDER_URLS_CONFIG.md             # 🌐 Configuration des URLs
├── README_RENDER_DEPLOYMENT.md       # 📚 Ce fichier
│
├── GESCOM_LARAVEL_FireBaseXDrive/    # Backend Laravel
│   ├── render.yaml                   # ⚙️ Config Render backend
│   ├── RENDER_SETUP_SUMMARY.md       # 📝 Résumé des modifications
│   ├── GENERATE_APP_KEY.md           # 🔑 Comment générer APP_KEY
│   ├── config/cors.php               # 🔐 Configuration CORS (modifié)
│   └── routes/api.php                # 🛣️ Routes API (health check ajouté)
│
└── GESCOM_ANGULAR_FrontEnd/          # Frontend Angular
    ├── render.yaml                   # ⚙️ Config Render frontend
    └── src/environments/
        └── environment.prod.ts       # 🌍 URLs de production (modifié)
```

---

## 🎯 Documentation par Sujet

### Pour Déployer
- **[RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)** : Guide complet
- **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** : Checklist à suivre

### Pour Configurer
- **[RENDER_URLS_CONFIG.md](./RENDER_URLS_CONFIG.md)** : Configuration des URLs
- **[GENERATE_APP_KEY.md](./GESCOM_LARAVEL_FireBaseXDrive/GENERATE_APP_KEY.md)** : Générer APP_KEY

### Pour Comprendre
- **[RENDER_SETUP_SUMMARY.md](./GESCOM_LARAVEL_FireBaseXDrive/RENDER_SETUP_SUMMARY.md)** : Résumé des modifications

---

## 🔧 Modifications Apportées au Code

### ✅ Fichiers Créés

#### Backend
- `render.yaml` : Configuration du service Docker
- `RENDER_SETUP_SUMMARY.md` : Documentation
- `GENERATE_APP_KEY.md` : Guide de génération de clé

#### Frontend
- (Déjà existant : `render.yaml` était présent)

#### Documentation
- `RENDER_DEPLOYMENT_GUIDE.md`
- `RENDER_URLS_CONFIG.md`
- `DEPLOY_CHECKLIST.md`
- `README_RENDER_DEPLOYMENT.md` (ce fichier)

### 🔧 Fichiers Modifiés

#### Backend
- `config/cors.php` : Ajout de l'URL frontend Render dans `allowed_origins`
- `routes/api.php` : Ajout de l'endpoint `/api/health` pour Render

#### Frontend
- `src/environments/environment.prod.ts` : Mise à jour de l'URL backend Render

---

## 🌐 URLs de Production

Une fois déployé sur Render :

| Service | URL |
|---------|-----|
| **Frontend** | `https://gescom-angular-frontend.onrender.com` |
| **Backend API** | `https://gescom-backend-laravel.onrender.com/api` |
| **Health Check** | `https://gescom-backend-laravel.onrender.com/api/health` |

---

## 🧪 Tests Post-Déploiement

### 1. Tester le Backend
```bash
curl https://gescom-backend-laravel.onrender.com/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2025-01-24T01:30:00+00:00",
  "service": "GESCOM Backend API"
}
```

### 2. Tester le Frontend
Ouvrir : `https://gescom-angular-frontend.onrender.com`

### 3. Tester la Communication
1. Ouvrir le frontend dans le navigateur
2. F12 → **Network**
3. Effectuer une action (login, chargement de données)
4. Vérifier que les requêtes vers le backend sont **200 OK**

---

## ⚠️ Points d'Attention

### Plan Free de Render
- Les services **s'endorment après 15 min** d'inactivité
- La première requête après réveil prend **~50 secondes**
- Solution : utiliser un service de ping (UptimeRobot)

### Secrets
- Ne JAMAIS commiter `.env` ou `firebase-credentials.json` dans Git
- Utilisez les **Environment Variables** et **Secret Files** de Render

### URLs
- Les URLs Render sont fixes : `<nom-service>.onrender.com`
- Si vous changez le nom, mettez à jour :
  - `environment.prod.ts` (frontend)
  - `config/cors.php` (backend)

---

## 🆘 Besoin d'Aide ?

### Problèmes Fréquents

**Erreur CORS** :
→ Consultez [RENDER_URLS_CONFIG.md](./RENDER_URLS_CONFIG.md) section "Problèmes Fréquents"

**Backend ne démarre pas** :
→ Vérifiez les logs sur Render Dashboard
→ Assurez-vous que `APP_KEY` est défini

**404 sur routes Angular** :
→ Vérifiez que `_redirects` existe dans `src/`

### Documentation Officielle
- [Render Docs](https://render.com/docs)
- [Laravel CORS](https://laravel.com/docs/11.x/routing#cors)
- [Angular Environments](https://angular.dev/tools/cli/environments)

---

## 📋 Ordre de Lecture Recommandé

Si c'est votre première fois :

1. **[RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)**
   → Comprenez le processus complet
   
2. **[GENERATE_APP_KEY.md](./GESCOM_LARAVEL_FireBaseXDrive/GENERATE_APP_KEY.md)**
   → Générez votre clé de chiffrement
   
3. **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)**
   → Suivez la checklist pendant le déploiement
   
4. **[RENDER_URLS_CONFIG.md](./RENDER_URLS_CONFIG.md)**
   → Référence rapide des URLs et troubleshooting

---

## ✨ Résumé

### Ce qui a été fait pour vous :

✅ Configuration CORS backend  
✅ URLs de production frontend  
✅ Health check endpoint  
✅ Fichiers `render.yaml` pour les deux services  
✅ Documentation complète (4 guides)

### Ce qu'il vous reste à faire :

1. Créer les services sur Render Dashboard
2. Configurer les variables d'environnement
3. Déclencher les déploiements
4. Tester la communication

**Temps estimé** : 20-30 minutes (hors temps de build)

---

**Bon déploiement ! 🚀**

_Dernière mise à jour : 24/01/2025_
