# 1️⃣ Image PHP avec Composer et extensions nécessaires
FROM php:8.2-fpm

# 2️⃣ Installer les dépendances système et extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    git zip unzip curl libpng-dev libjpeg-dev libfreetype6-dev libzip-dev pkg-config autoconf build-essential npm \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd bcmath intl zip opcache \
    && pecl install grpc protobuf \
    && docker-php-ext-enable grpc protobuf \
    && rm -rf /var/lib/apt/lists/*

# 3️⃣ Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 4️⃣ Installer Angular CLI et Yarn globalement
RUN npm install -g yarn @angular/cli

# 5️⃣ Copier le backend Laravel
WORKDIR /var/www/backend
COPY GESCOM_LARAVEL_FireBaseXDrive/ ./

# 6️⃣ Définir le chemin du secret Firebase (Secret File sur Render)
ENV FIREBASE_CREDENTIALS_PATH=/etc/secrets/firebase_credentials.json

# 7️⃣ Installer les dépendances Laravel
RUN composer install --no-dev --optimize-autoloader

# 8️⃣ Copier et build le frontend Angular
WORKDIR /var/www/frontend
COPY GESCOM_ANGULAR/ ./

# Installer les dépendances Node avec Yarn et build en production
RUN yarn install --ignore-engines --legacy-peer-deps && yarn build --configuration=production

# 9️⃣ Copier le build Angular dans le dossier public de Laravel
RUN cp -r /var/www/frontend/dist/* /var/www/backend/public/

# 10️⃣ Permissions Laravel
WORKDIR /var/www/backend
RUN chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data /var/www/backend

# 11️⃣ Exposer le port 1000
EXPOSE 1000

# 12️⃣ Démarrer le serveur Laravel sur le port 1000
CMD php artisan serve --host=0.0.0.0 --port=1000
