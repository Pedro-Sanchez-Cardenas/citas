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

# Instalamos dependencias de Laravel en modo desarrollo (incluye dev y sin optimizar autoload)
COPY composer.json composer.lock* ./
RUN COMPOSER_ALLOW_SUPERUSER=1 composer install --no-interaction --prefer-dist --no-scripts

# Copiamos el resto del proyecto (incluye artisan)
COPY . .

EXPOSE 8000

# Desarrollo: sin config/route cache para que cambios en .env y rutas se apliquen al vuelo
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

