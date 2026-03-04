<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from these domains/hosts receive stateful API authentication
    | (cookies). Add the host:port where your React SPA is served (e.g.
    | when using nginx at localhost:8080, add "localhost:8080").
    |
    */

    'stateful' => array_filter(array_map('trim', explode(',', env(
        'SANCTUM_STATEFUL_DOMAINS',
        'localhost,localhost:3000,localhost:8080,127.0.0.1,127.0.0.1:8000,::1'
    )))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | Guards checked when Sanctum authenticates a request. For SPA cookie
    | auth we use the "web" guard (session).
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | Minutes until an issued token expires. Null = no expiry. Does not
    | affect first-party SPA session cookies.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | Middleware used when handling stateful SPA requests (cookies, session,
    | CSRF). Usually you don't need to change these.
    |
    */

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];
