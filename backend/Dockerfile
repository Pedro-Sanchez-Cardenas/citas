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

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

