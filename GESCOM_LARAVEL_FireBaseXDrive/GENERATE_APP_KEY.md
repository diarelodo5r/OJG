# 🔑 Générer APP_KEY pour Render

## Méthode 1 : Locale (Recommandée)

Si vous avez PHP et Composer installés localement :

```bash
# Naviguez vers le dossier du backend
cd GESCOM_LARAVEL_FireBaseXDrive

# Installez les dépendances (si pas déjà fait)
composer install

# Générez la clé (sans modifier .env)
php artisan key:generate --show
```

**Résultat** :
```
base64:XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx=
```

→ **Copiez cette valeur** et collez-la dans les variables d'environnement Render sous `APP_KEY`

---

## Méthode 2 : Avec Docker

Si vous n'avez pas PHP localement mais Docker :

```bash
# Naviguez vers le dossier du backend
cd GESCOM_LARAVEL_FireBaseXDrive

# Lancez un conteneur temporaire Laravel
docker run --rm -v ${PWD}:/app -w /app composer/composer:latest install

# Générez la clé
docker run --rm -v ${PWD}:/app -w /app php:8.2-cli php artisan key:generate --show
```

→ **Copiez la valeur** et collez-la dans Render

---

## Méthode 3 : En Ligne (Générateur)

Si vous n'avez ni PHP ni Docker :

Utilisez ce générateur en ligne (sûr) :
https://generate-random.org/laravel-key-generator

1. Cliquez sur **Generate Laravel Key**
2. Copiez la clé générée (format : `base64:...`)
3. Collez-la dans Render sous `APP_KEY`

---

## Méthode 4 : Manuel (Base64)

Générez une chaîne aléatoire de 32 caractères et encodez-la en base64 :

### Avec OpenSSL (Linux/macOS/Git Bash)
```bash
echo "base64:$(openssl rand -base64 32)"
```

### Avec PowerShell (Windows)
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
"base64:$([Convert]::ToBase64String($bytes))"
```

---

## ⚠️ Important

- Ne JAMAIS partager votre `APP_KEY` publiquement
- Ne JAMAIS commiter la clé dans Git
- Utilisez une clé différente pour développement et production
- Une fois la clé définie, ne la changez plus (sauf rotation de sécurité)

---

## ✅ Vérification

Une fois la clé ajoutée dans Render :

1. Redéployez le backend
2. Vérifiez les logs : pas d'erreur "No application encryption key has been specified"
3. Testez le health check : `https://gescom-backend-laravel.onrender.com/api/health`

---

**Format attendu** :
```
base64:XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx=
```

Ne pas oublier le préfixe `base64:` !
