<?php
// config/cors.php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_origins' => ['http://localhost:3000'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
    // このヘッダーリストにX-XSRF-TOKENを追加
    'allowed_headers' => [
        'X-XSRF-TOKEN',
        'X-Requested-With', 
        'Content-Type', 
        'Accept', 
        'Authorization'
    ],
    
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];