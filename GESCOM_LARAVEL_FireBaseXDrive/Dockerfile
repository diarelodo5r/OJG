FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git zip unzip curl libpng-dev libjpeg-dev libfreetype6-dev libzip-dev pkg-config autoconf build-essential \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd bcmath intl zip opcache \
    && pecl install grpc protobuf \
    && docker-php-ext-enable grpc protobuf \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --optimize-autoloader
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 1000
CMD php artisan serve --host=0.0.0.0 --port=1000
