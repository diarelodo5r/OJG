# 1️⃣ Image PHP avec Composer et extensions nécessaires
FROM php:8.2-fpm

# 2️⃣ Installer les dépendances système et extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    git zip unzip curl libpng-dev libjpeg-dev libfreetype6-dev libzip-dev pkg-config autoconf build-essential \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd \
    && pecl install grpc protobuf \
    && docker-php-ext-enable grpc protobuf \
    && rm -rf /var/lib/apt/lists/*

# 3️⃣ Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 4️⃣ Copier le code de l’application
WORKDIR /var/www/html
COPY . .

# 5️⃣ Installer les dépendances Laravel
RUN composer install --no-dev --optimize-autoloader

# 6️⃣ Donner les bons droits
RUN chmod -R 775 storage bootstrap/cache

# 7️⃣ Démarrer le serveur Laravel
CMD php artisan serve --host=0.0.0.0 --port=10000

EXPOSE 10000