FROM composer:2 AS composer

FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libzip-dev \
    libonig-dev \
    libpng-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www

# Copiamos Composer desde la imagen oficial
COPY --from=composer /usr/bin/composer /usr/bin/composer

# Instalamos dependencias de Laravel durante el build (sin ejecutar scripts de Artisan)
COPY composer.json ./
RUN COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --no-interaction --prefer-dist --no-scripts

# Copiamos el resto del proyecto (incluye artisan)
COPY . .

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

