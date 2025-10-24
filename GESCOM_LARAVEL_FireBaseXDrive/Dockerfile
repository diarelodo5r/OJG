FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    zip \
    unzip \
    curl \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libicu-dev \
    zlib1g-dev \
    pkg-config \
    autoconf \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd bcmath intl zip opcache

# Install PECL extensions
RUN pecl install grpc protobuf \
    && docker-php-ext-enable grpc protobuf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for better layer caching
COPY composer.json composer.lock ./

# Install dependencies without scripts to avoid errors
RUN composer install --no-dev --no-scripts --no-autoloader

# Copy application files
COPY . .

# Ensure no stale cached manifests/config remain (can reference dev providers like Pail)
RUN rm -f bootstrap/cache/*.php || true

# Generate optimized autoloader without running scripts
RUN composer dump-autoload --optimize --no-dev --no-scripts

# Set permissions
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 1000
CMD php artisan serve --host=0.0.0.0 --port=1000
